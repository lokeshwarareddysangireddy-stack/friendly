#!/usr/bin/env node
/**
 * Confirms the pack size of every sourced grocery product image.
 *
 * Retailer search results truncate their titles, so a candidate can look like
 * the right product while the real listing is a different pack size. This
 * script re-opens each accepted product page, reads the authoritative pack
 * size ("Net Quantity", "Pack Size", "Unit Count", the product title, …) and
 * then:
 *
 *   - promotes the image to `verified` when the pack size matches,
 *   - removes the image when the page proves a different pack size, so the
 *     placeholder stage can supply a clearly identified generic image,
 *   - leaves the image untouched when the page carries no usable size.
 *
 * Usage:
 *   node scripts/verify-grocery-image-sizes.mjs [--limit=100] [--force]
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { describeProduct, extractPackSizes, sizesMatch, sleep } from "./lib/grocery-images.mjs";

const ROOT = process.cwd();
const PROGRESS_FILE = path.join(ROOT, "reports", "grocery-size-verification.json");

function parseArgs(argv) {
  const args = { limit: 0, force: false, sleep: 900 };
  for (const raw of argv) {
    const [key, value] = raw.replace(/^--/, "").split("=");
    if (key === "limit") args.limit = Number(value) || 0;
    else if (key === "force") args.force = true;
    else if (key === "sleep") args.sleep = Number(value) || 0;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

function log(...parts) {
  console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...parts);
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(url, {
      headers: { "user-agent": UA, "accept-language": "en-IN,en;q=0.9" },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!response.ok) return { ok: false, error: `http ${response.status}` };
    const html = await response.text();
    if (/bm-verify=|Robot Check/i.test(html.slice(0, 4000))) {
      return { ok: false, error: "bot-challenge" };
    }
    return { ok: true, html };
  } catch (error) {
    return { ok: false, error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

const env = readFileSync(path.resolve(".env.local"), "utf8");
const uri = env.match(/^MONGODB_URI\s*=\s*(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, "");
if (!uri) throw new Error("MONGODB_URI is required.");

await mongoose.connect(uri);
const collection = mongoose.connection.db.collection("products");

const candidates = await collection
  .find({
    categorySlug: "grocery-and-daily-needs",
    "images.0.imageType": { $in: ["licensed", "official"] },
    "images.0.sourceUrl": { $exists: true },
  })
  .toArray();

const todo = candidates.filter((product) => {
  if (args.force) return true;
  return product.images[0].verificationStatus !== "verified";
});
const queue = args.limit ? todo.slice(0, args.limit) : todo;

log(`products with a sourced image: ${candidates.length} | to re-check: ${queue.length}`);

const summary = { checked: 0, confirmed: 0, mismatched: 0, unknown: 0, failed: 0 };

for (const product of queue) {
  const target = describeProduct(product);
  const image = product.images[0];
  const url = image.sourceUrl;
  summary.checked++;

  const page = await fetchPage(url);
  if (args.sleep) await sleep(args.sleep);

  if (!page.ok) {
    summary.failed++;
    log(`  FETCH FAIL ${product.sku}: ${page.error}`);
    continue;
  }

  const sizes = extractPackSizes(page.html);
  if (!sizes.length) {
    summary.unknown++;
    continue;
  }

  const matches = sizes.some((size) => sizesMatch(size, target.size));
  if (matches) {
    summary.confirmed++;
    await collection.updateOne(
      { _id: product._id },
      {
        $set: {
          "images.0.verificationStatus": "verified",
          "images.0.matchStatus": "exact",
          "images.0.verifiedAt": new Date().toISOString(),
        },
      }
    );
    log(`  CONFIRMED ${product.sku} ${product.name} (${target.unit})`);
  } else {
    summary.mismatched++;
    // The listing is a different pack size - drop the image so a clearly
    // identified generic placeholder is used instead.
    await collection.updateOne(
      { _id: product._id },
      { $set: { images: [], updatedAt: new Date() } }
    );
    log(
      `  MISMATCH ${product.sku} ${product.name} (${target.unit}) - page says ${sizes
        .map((s) => `${s.value}${s.unit}`)
        .join("/")} -> image removed`
    );
  }
}

log(
  `done confirmed=${summary.confirmed} mismatch=${summary.mismatched} unknown=${summary.unknown} failed=${summary.failed}`
);
writeFileSync(
  PROGRESS_FILE,
  JSON.stringify({ ...summary, finishedAt: new Date().toISOString() }, null, 2),
  "utf8"
);

await mongoose.disconnect();
