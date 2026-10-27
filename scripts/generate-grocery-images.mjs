#!/usr/bin/env node
/**
 * AI image generation for grocery imagery that cannot be sourced from a
 * retailer catalogue.
 *
 *   --categories   generate the 17 category cover images (landing page)
 *   --generic      generate photorealistic packshots for generic / unbranded groceries
 *   --placeholder  generate clearly identified generic placeholders for branded
 *                  products whose exact packshot could not be found
 *   --all          run every stage
 *
 * The public text-to-image endpoint renders one image per 45 seconds, so the
 * script is paced and resumable: every artefact is written to disk / the
 * database as soon as it is produced and skipped on the next run.
 *
 * Storage:
 *   - category covers  -> public/images/categories/grocery/<slug>.jpg
 *   - product imagery  -> Cloudinary (friendlybasket/grocery/products)
 *
 * Usage:
 *   node scripts/generate-grocery-images.mjs --categories --concurrency=1
 */

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import {
  readEnvFile,
  configureCloudinary,
  describeProduct,
  generateImage,
  contentHash,
  slugify,
  sleep,
} from "./lib/grocery-images.mjs";
import {
  GROCERY_CATEGORIES,
  GROCERY_TAGS,
  OTHER_GROCERY,
} from "../lib/grocery-categories.ts";

const ROOT = process.cwd();
const COVER_DIR = path.join(ROOT, "public", "images", "categories", "grocery");
const REPORT = path.join(ROOT, "reports", "grocery-generated-images.json");
const CLOUD_FOLDER = "friendlybasket/grocery/products";
const RENDER_INTERVAL_MS = 47000;

function parseArgs(argv) {
  const args = {
    categories: false,
    generic: false,
    placeholder: false,
    all: false,
    force: false,
    maxPlaceholderTypes: 0,
    width: 1024,
    height: 1024,
  };
  for (const raw of argv) {
    const [key, value] = raw.replace(/^--/, "").split("=");
    switch (key) {
      case "categories": args.categories = true; break;
      case "generic": args.generic = true; break;
      case "placeholder": args.placeholder = true; break;
      case "all": args.all = true; break;
      case "force": args.force = true; break;
      case "max-placeholder-types": args.maxPlaceholderTypes = Number(value) || 0; break;
      case "width": args.width = Number(value) || 1024; break;
      case "height": args.height = Number(value) || 1024; break;
      default: break;
    }
  }
  if (args.all) args.categories = args.generic = args.placeholder = true;
  return args;
}

const args = parseArgs(process.argv.slice(2));

function log(...parts) {
  console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...parts);
}

/* ------------------------------------------------------------------ pacing --- */

let lastRender = 0;

async function render(prompt, { width, height, seed }) {
  let lastError = "unknown";
  for (let attempt = 0; attempt < 6; attempt++) {
    const wait = RENDER_INTERVAL_MS - (Date.now() - lastRender);
    if (wait > 0) await sleep(wait);
    lastRender = Date.now();
    const result = await generateImage(prompt, { width, height, seed });
    if (result.ok) return result;
    lastError = result.error;
    if (result.error !== "rate-limited") await sleep(4000 * (attempt + 1));
  }
  return { ok: false, error: lastError };
}

/* --------------------------------------------------------------- cloudinary --- */

async function uploadCropped(buffer, width, height, publicId, folder) {
  const cropped = Math.round(height * 0.9);
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        public_id: publicId,
        overwrite: true,
        transformation: [
          { crop: "fill", gravity: "north", width, height: cropped },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, response) => (error ? reject(error) : resolve(response))
    );
    stream.end(buffer);
  });
}

/* ------------------------------------------------------------- category art --- */

const CATEGORY_ART = {
  "rice-and-rice-products":
    "overhead flat lay photograph of premium Indian basmati rice and white rice grains spilling from open jute sacks onto a light neutral surface, small wooden bowl of raw rice, soft daylight, photorealistic food photography, no text",
  "dals-and-pulses":
    "overhead flat lay photograph of assorted Indian lentils and pulses in small wooden bowls, yellow toor dal, red masoor dal, chickpeas and whole pulses, light neutral background, photorealistic food photography, no text",
  "flour-and-grains":
    "overhead flat lay photograph of Indian flours and grains, mounds of white wheat atta, besan and rava in small bowls with a heap of rice grains, light neutral background, photorealistic food photography, no text",
  "cooking-oils-and-ghee":
    "photorealistic product photograph of a tall clear bottle of golden refined cooking oil beside a small glass jar of creamy ghee on a light neutral surface, soft studio lighting, no text",
  "salt-sugar-and-jaggery":
    "overhead flat lay photograph of white salt crystals, granulated sugar and golden jaggery pieces arranged in small ceramic bowls on a light neutral surface, photorealistic food photography, no text",
  "spices-and-masalas":
    "overhead flat lay photograph of vibrant Indian spices and masala powders, red chilli powder, turmeric, cumin seeds, coriander seeds and whole dried spices in small bowls, light neutral background, photorealistic, no text",
  "dry-fruits-nuts-and-seeds":
    "overhead flat lay photograph of premium dry fruits and nuts, almonds, cashews, pistachios, raisins and dates arranged in small bowls on a light neutral surface, photorealistic food photography, no text",
  "breakfast-and-cereals":
    "photorealistic overhead photograph of breakfast cereals, a bowl of corn flakes, rolled oats, granola and puffed rice with a spoon, light neutral background, soft daylight, no text",
  "biscuits-cookies-and-rusks":
    "photorealistic overhead photograph of assorted golden tea biscuits, cookies and rusk stacked on a light neutral surface, crisp studio lighting, no text",
  "snacks-and-namkeen":
    "photorealistic overhead photograph of Indian savoury snacks, potato chips, namkeen mixture and roasted peanuts in bowls on a light neutral surface, no text",
  "noodles-pasta-and-ready-mix":
    "photorealistic overhead photograph of pasta shapes, instant noodles, vermicelli and semolina arranged in small bowls on a light neutral surface, no text",
  "pickles-sauces-and-spreads":
    "photorealistic product photograph of glass jars of mango pickle, red chilli sauce and ketchup with a spoon, light neutral surface, soft studio lighting, no text",
  "dairy-and-refrigerated":
    "photorealistic product photograph of dairy essentials, a glass milk bottle, a bowl of curd, sliced paneer, butter and cheese blocks on a light neutral surface, no text",
  "tea-coffee-and-beverages":
    "photorealistic product photograph of a glass jar of loose leaf tea, a cup of coffee, and juice bottles on a light neutral surface, soft studio lighting, no text",
  "chocolates-and-sweets":
    "photorealistic product photograph of assorted chocolates, a chocolate bar, toffees and Indian sweets arranged on a light neutral surface, soft studio lighting, no text",
  "baking-and-cooking":
    "photorealistic overhead photograph of baking essentials, baking powder, baking soda, corn starch, vanilla essence and bread crumbs in small bowls on a light neutral surface, no text",
  "frozen-and-canned":
    "photorealistic product photograph of frozen vegetables, french fries, nuggets and tins of canned beans arranged on a light neutral surface, soft studio lighting, no text",
  "more-grocery-and-daily-needs":
    "photorealistic overhead photograph of fresh vegetables and everyday household groceries arranged on a light neutral surface, no text",
};

/* ---------------------------------------------------------- product imagery --- */

const PRODUCT_TYPE_ART = {
  rice: "a neat sack of polished white rice grains",
  "sona masoori": "a bowl of white rice grains",
  basmati: "a bowl of long grain basmati rice",
  dal: "a bowl of yellow lentils",
  chana: "a bowl of split chickpeas",
  pulses: "a bowl of mixed whole pulses",
  flour: "a bowl of white wheat flour",
  atta: "a bowl of whole wheat flour",
  besan: "a bowl of gram flour",
  rava: "a bowl of coarse semolina",
  oil: "a tall bottle of cooking oil",
  ghee: "a glass jar of clarified ghee",
  sugar: "a bowl of white granulated sugar",
  salt: "a bowl of white salt crystals",
  jaggery: "pieces of golden jaggery",
  spices: "a small bowl of ground spice",
  masala: "a small bowl of mixed masala powder",
  nuts: "a bowl of mixed nuts",
  seeds: "a bowl of small seeds",
  dates: "a bowl of dried dates",
  biscuits: "golden tea biscuits",
  cookies: "chocolate chip cookies",
  rusk: "crisp golden rusks",
  chips: "crispy potato chips",
  namkeen: "savoury namkeen mixture",
  noodles: "a nest of instant noodles",
  pasta: "dried penne pasta",
  vermicelli: "thin vermicelli noodles",
  pickle: "a jar of Indian pickle",
  sauce: "a bottle of tomato sauce",
  ketchup: "a bottle of tomato ketchup",
  milk: "a glass bottle of milk",
  curd: "a bowl of set curd",
  paneer: "cubes of paneer",
  cheese: "slices of cheese",
  butter: "a block of butter",
  tea: "loose leaf tea",
  coffee: "ground coffee",
  juice: "a bottle of fruit juice",
  chocolate: "a chocolate bar",
  candy: "wrapped candies",
  baking: "baking powder",
  yeast: "a packet of dried yeast",
  frozen: "frozen vegetables",
  canned: "a tin of canned beans",
  bread: "bread crumbs",
  "gulab jamun": "a bowl of syrup soaked sweet dumplings",
  "soan papdi": "a stack of flaky Indian sweet",
  mango: "a jar of mango pickle",
};

function artForType(productType) {
  const text = String(productType || "").toLowerCase();
  const keys = Object.keys(PRODUCT_TYPE_ART).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (!text.includes(key)) continue;
    const words = key.split(" ");
    const haystack = words
      .map((word, index) =>
        index === 0
          ? text
          : text.includes(words.slice(0, index + 1).join(" "))
            ? text
            : ""
      )
      .join(" ");
    if (haystack) return PRODUCT_TYPE_ART[key];
  }
  return "a plain unbranded grocery package";
}

/* --------------------------------------------------------------- utilities --- */

function saveReport(report) {
  if (!existsSync(path.join(ROOT, "reports"))) mkdirSync(path.join(ROOT, "reports"), { recursive: true });
  writeFileSync(REPORT, JSON.stringify(report, null, 2), "utf8");
}

/* ------------------------------------------------------------------ stages --- */

async function generateCategories(report) {
  mkdirSync(COVER_DIR, { recursive: true });
  for (const [slug, prompt] of Object.entries(CATEGORY_ART)) {
    const target = path.join(COVER_DIR, `${slug}.jpg`);
    if (existsSync(target) && !args.force) {
      log(`skip ${slug}`);
      continue;
    }
    const seed = Number(contentHash(slug).slice(0, 6), 16);
    const result = await render(prompt, { width: args.width, height: args.height, seed });
    if (!result.ok) {
      log(`FAIL ${slug}: ${result.error}`);
      report.categoryCovers.push({ slug, status: "failed", error: result.error });
      continue;
    }
    // Remove the generator watermark, then keep the asset in the repo.
    const uploaded = await uploadCropped(
      result.buffer,
      result.width,
      result.height,
      `cover-${slug}`,
      "friendlybasket/grocery/covers"
    );
    const image = Buffer.from(await (await fetch(uploaded.secure_url)).arrayBuffer());
    writeFileSync(target, image);
    await cloudinary.uploader.destroy(uploaded.public_id);
    log(`ok ${slug} (${uploaded.width}x${uploaded.height}, ${Math.round(image.length / 1024)}KB)`);
    report.categoryCovers.push({
      slug,
      status: "generated",
      path: `/images/categories/grocery/${slug}.jpg`,
      width: uploaded.width,
      height: uploaded.height,
    });
    saveReport(report);
  }
}

async function generateProductImages(report) {
  const env = readEnvFile();
  const uri = env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required.");
  configureCloudinary();
  await mongoose.connect(uri);
  const collection = mongoose.connection.db.collection("products");
  const all = await collection.find({ categorySlug: "grocery-and-daily-needs" }).toArray();

  const generic = all.filter((product) => {
    const target = describeProduct(product);
    if (!target.isGeneric) return false;
    const image = product.images?.[0];
    return !image || image.imageType !== "generated" || args.force;
  });

  // Only products that still carry no real retailer image need a placeholder.
  // Products whose pack size could not be independently confirmed keep their
  // (brand and product type correct) retailer packshot.
  const unmatched = all.filter((product) => {
    const target = describeProduct(product);
    if (target.isGeneric) return false;
    const image = product.images?.[0];
    if (!image || !image.url) return true;
    if (image.imageType === "licensed" || image.imageType === "official") return false;
    if (image.imageType === "placeholder" && !args.force) return false;
    if (image.imageType === "generated" && !args.force) return false;
    return true;
  });

  log(`generic products: ${generic.length} | products needing a placeholder: ${unmatched.length}`);

  // --- generic / unbranded groceries get their own photorealistic image ---
  for (const product of generic) {
    const target = describeProduct(product);
    const prompt = `high resolution photorealistic product photograph of ${artForType(target.productType)}, ${target.unit || ""}, centred composition on a clean white background, studio lighting, realistic colours, no text, no logos, square image`;
    const seed = Number(contentHash(`${product._id}:generic`).slice(0, 6), 16);
    const result = await render(prompt, { width: args.width, height: args.height, seed });
    if (!result.ok) {
      log(`FAIL generic ${product.sku}: ${result.error}`);
      continue;
    }
    const uploaded = await uploadCropped(
      result.buffer,
      result.width,
      result.height,
      `${slugify(product.slug || product.name)}-${contentHash(product._id)}`,
      CLOUD_FOLDER
    );
    const image = {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      alt: product.name,
      sourceUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`,
      sourceSite: "pollinations.ai",
      imageType: "generated",
      matchStatus: "generated",
      verificationStatus: "unverified",
      usagePermission: "confirmed",
      verifiedAt: new Date().toISOString(),
    };
    await collection.updateOne(
      { _id: product._id },
      { $set: { images: [image], brand: target.brand || "", updatedAt: new Date() } }
    );
    log(`ok generic ${product.sku} ${product.name}`);
    report.products.push({ id: product._id, sku: product.sku, name: product.name, kind: "generic", status: "stored", imageUrl: uploaded.secure_url });
    saveReport(report);
  }

  // --- branded products without a verified packshot share a type placeholder ---
  const byType = new Map();
  for (const product of unmatched) {
    const target = describeProduct(product);
    const key = target.productType;
    if (!byType.has(key)) byType.set(key, { target, products: [] });
    byType.get(key).products.push(product);
  }
  const ranked = [...byType.entries()].sort((a, b) => b[1].products.length - a[1].products.length);
  const limited = args.maxPlaceholderTypes ? ranked.slice(0, args.maxPlaceholderTypes) : ranked;
  log(`placeholder packs: ${limited.length} (types with unmatched products: ${ranked.length})`);

  const covered = new Set();

  for (const [productType, { products }] of limited) {
    const prompt = `high resolution photorealistic studio photograph of ${artForType(productType)} in plain unbranded packaging with no branding and no text, clean white background, centred composition, realistic colours, square image`;
    const seed = Number(contentHash(`placeholder:${productType}`).slice(0, 6), 16);
    const result = await render(prompt, { width: args.width, height: args.height, seed });
    if (!result.ok) {
      log(`FAIL placeholder ${productType}: ${result.error}`);
      continue;
    }
    const uploaded = await uploadCropped(
      result.buffer,
      result.width,
      result.height,
      `placeholder-${slugify(productType)}`,
      CLOUD_FOLDER
    );
    const image = {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      alt: `${productType} placeholder`,
      sourceUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`,
      sourceSite: "pollinations.ai",
      imageType: "placeholder",
      matchStatus: "not_found",
      verificationStatus: "unverified",
      usagePermission: "confirmed",
      verifiedAt: new Date().toISOString(),
    };
    await collection.updateMany(
      { _id: { $in: products.map((p) => p._id) } },
      { $set: { images: [image], updatedAt: new Date() } }
    );
    covered.add(productType);
    log(`ok placeholder ${productType} -> ${products.length} products`);
    report.products.push({ kind: "placeholder", productType, status: "stored", imageUrl: uploaded.secure_url, products: products.length });
    saveReport(report);
  }

  // --- fallback: one generic placeholder per grocery category ---
  const remaining = unmatched.filter((product) => !covered.has(describeProduct(product).productType));
  if (remaining.length) {
    const byCategory = new Map();
    for (const product of remaining) {
      const tag = (product.tags || []).find((t) => GROCERY_TAGS.includes(t)) || "other-grocery";
      if (!byCategory.has(tag)) byCategory.set(tag, []);
      byCategory.get(tag).push(product);
    }
    log(`category fallback placeholders: ${byCategory.size} for ${remaining.length} products`);
    for (const [tag, products] of byCategory) {
      const meta = GROCERY_CATEGORIES.find((c) => c.tag === tag) || OTHER_GROCERY;
      const prompt = `high resolution photorealistic studio photograph of assorted plain unbranded grocery packages for ${meta.name.toLowerCase()} with no branding and no text, clean white background, centred composition, realistic colours, square image`;
      const seed = Number(contentHash(`placeholder-category:${tag}`).slice(0, 6), 16);
      const result = await render(prompt, { width: args.width, height: args.height, seed });
      if (!result.ok) {
        log(`FAIL category placeholder ${tag}: ${result.error}`);
        continue;
      }
      const uploaded = await uploadCropped(
        result.buffer,
        result.width,
        result.height,
        `placeholder-category-${tag}`,
        CLOUD_FOLDER
      );
      const image = {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        alt: `${meta.name} placeholder`,
        sourceUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`,
        sourceSite: "pollinations.ai",
        imageType: "placeholder",
        matchStatus: "not_found",
        verificationStatus: "unverified",
        usagePermission: "confirmed",
        verifiedAt: new Date().toISOString(),
      };
      await collection.updateMany(
        { _id: { $in: products.map((p) => p._id) } },
        { $set: { images: [image], updatedAt: new Date() } }
      );
      log(`ok category placeholder ${tag} -> ${products.length} products`);
      report.products.push({ kind: "placeholder-category", category: tag, status: "stored", imageUrl: uploaded.secure_url, products: products.length });
      saveReport(report);
    }
  }

  await mongoose.disconnect();
}

/* -------------------------------------------------------------------- main --- */

const report = { startedAt: new Date().toISOString(), categoryCovers: [], products: [] };

configureCloudinary();

if (args.categories) await generateCategories(report);
if (args.generic || args.placeholder) await generateProductImages(report);

report.finishedAt = new Date().toISOString();
saveReport(report);
log("done");
