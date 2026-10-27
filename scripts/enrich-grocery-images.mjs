#!/usr/bin/env node
/**
 * Grocery product image enrichment.
 *
 * For every grocery product in the catalogue this script:
 *   1. finds the product on approved retailer catalogues (Flipkart, Amazon India, BigBasket),
 *   2. verifies that brand, product type and pack size all match,
 *   3. downloads the packshot and stores it permanently in Cloudinary,
 *   4. writes the image URL plus full provenance back onto the product record,
 *   5. generates AI imagery for generic / unbranded groceries when nothing is found,
 *   6. leaves a clearly identified generic placeholder when a branded image cannot be found.
 *
 * The run is resumable: progress is checkpointed to reports/grocery-image-progress.json and
 * verified images are never overwritten with a less accurate one.
 *
 * Usage:
 *   node scripts/enrich-grocery-images.mjs [--limit=50] [--batch-size=10] [--sleep=900]
 *                                          [--sources=flipkart,amazon,bigbasket] [--force]
 *                                          [--generic] [--dry-run] [--only-missing] [--report]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import {
  readEnvFile,
  configureCloudinary,
  describeProduct,
  scoreCandidate,
  verifyPackSizeOnPage,
  downloadImage,
  uploadToCloudinary,
  contentHash,
  slugify,
  sleep,
  sourceLimiter,
  SEARCH_SOURCES,
} from "./lib/grocery-images.mjs";

const ROOT = process.cwd();
const REPORTS = path.join(ROOT, "reports");
const PROGRESS_FILE = path.join(REPORTS, "grocery-image-progress.json");
const MAPPING_FILE = path.join(REPORTS, "grocery-product-images.json");
const GROCERY_SLUG = "grocery-and-daily-needs";
const CLOUD_FOLDER = "friendlybasket/grocery/products";

/* ------------------------------------------------------------------ args --- */

function parseArgs(argv) {
  const args = {
    limit: 0,
    batchSize: 10,
    sleep: 900,
    sources: ["flipkart", "amazon"],
    force: false,
    generic: false,
    dryRun: false,
    onlyMissing: false,
    report: false,
    verbose: false,
    verifyPages: false,
    retry: false,
    concurrency: 3,
  };
  for (const raw of argv) {
    const [key, value] = raw.replace(/^--/, "").split("=");
    switch (key) {
      case "limit": args.limit = Number(value) || 0; break;
      case "batch-size": args.batchSize = Math.max(1, Number(value) || 10); break;
      case "sleep": args.sleep = Math.max(0, Number(value) || 0); break;
      case "sources": args.sources = String(value).split(",").map((s) => s.trim()).filter(Boolean); break;
      case "concurrency": args.concurrency = Math.max(1, Number(value) || 1); break;
      case "force": args.force = true; break;
      case "generic": args.generic = true; break;
      case "dry-run": args.dryRun = true; break;
      case "only-missing": args.onlyMissing = true; break;
      case "report": args.report = true; break;
      case "verbose": args.verbose = true; break;
      case "verify-pages": args.verifyPages = true; break;
      case "retry": args.retry = true; break;
      default: break;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

/* --------------------------------------------------------------- helpers --- */

function log(...parts) {
  console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...parts);
}

function loadProgress() {
  if (!existsSync(PROGRESS_FILE)) return { products: {}, startedAt: new Date().toISOString() };
  try {
    return JSON.parse(readFileSync(PROGRESS_FILE, "utf8"));
  } catch {
    return { products: {}, startedAt: new Date().toISOString() };
  }
}

function saveProgress(progress) {
  if (!existsSync(REPORTS)) mkdirSync(REPORTS, { recursive: true });
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), "utf8");
}

function loadMapping() {
  if (!existsSync(MAPPING_FILE)) return {};
  try {
    return JSON.parse(readFileSync(MAPPING_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveMapping(mapping) {
  if (!existsSync(REPORTS)) mkdirSync(REPORTS, { recursive: true });
  writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2), "utf8");
}

/** Queries used to find a product, most specific first. */
function buildQueries(target) {
  const brand = target.brand;
  const type = target.productType;
  const unit = target.unit.replace(/\s*pack$/i, "").trim();
  const compact = unit.replace(/\s+/g, "");
  const queries = [];
  const push = (value) => {
    const clean = value.replace(/\s+/g, " ").trim();
    if (clean && !queries.includes(clean)) queries.push(clean);
  };
  if (brand) {
    push(`${brand} ${type} ${unit}`.trim());
    if (compact !== unit) push(`${brand} ${type} ${compact}`.trim());
    push(`${brand} ${type}`.trim());
  } else {
    push(`${type} ${unit}`.trim());
    push(type);
  }
  return queries;
}

async function fetchWithRetry(fn, { retries = 3, backoff = 2000 } = {}) {
  let lastError = "";
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fn();
      if (result && !result.error) return result;
      lastError = result?.error || "unknown error";
    } catch (error) {
      lastError = error.message;
    }
    if (attempt < retries) await sleep(backoff * 2 ** attempt + Math.floor(Math.random() * 800));
  }
  return { candidates: [], error: lastError };
}

/* ------------------------------------------------------------------ main --- */

const env = readEnvFile();
const uri = env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is required (see .env.local).");
  process.exit(1);
}

const cloud = configureCloudinary();
if (!cloud.ok) {
  console.error("Cloudinary is not configured; images cannot be stored permanently.");
  process.exit(1);
}

await mongoose.connect(uri);
const collection = mongoose.connection.db.collection("products");

const sources = SEARCH_SOURCES.filter((source) => args.sources.includes(source.id));

const progress = loadProgress();
const mapping = loadMapping();

const all = await collection
  .find({ categorySlug: GROCERY_SLUG })
  .sort({ sku: 1 })
  .toArray();

log(`catalogue: ${all.length} grocery products`);

const targets = [];
for (const doc of all) {
  const target = describeProduct(doc);
  const existing = doc.images?.[0] || null;
  const alreadyVerified =
    existing &&
    existing.verificationStatus === "verified" &&
    ["official", "licensed"].includes(existing.imageType);
  if (alreadyVerified && !args.force) continue;
  // "--only-missing" treats the legacy shared placeholder and any locally
  // hosted image as missing, because those are not product specific.
  const isSourced = existing && ["licensed", "official"].includes(existing.imageType);
  if (args.onlyMissing && isSourced && !args.force) continue;
  if (progress.products[doc._id]?.status === "done" && !args.force && !args.retry) continue;
  targets.push({ doc, target, existing });
}

const queue = args.limit ? targets.slice(0, args.limit) : targets;
log(`queue: ${queue.length} products to process${args.force ? " (forced re-run)" : ""}`);

const summary = {
  startedAt: new Date().toISOString(),
  processed: 0,
  verified: 0,
  reviewRequired: 0,
  generated: 0,
  placeholder: 0,
  failed: 0,
  skipped: 0,
  genericSkipped: 0,
  bySource: {},
};

async function storeImage(buffer, slug, { overwrite = false } = {}) {
  const publicId = `${slugify(slug)}-${contentHash(buffer)}`;
  return uploadToCloudinary(buffer, CLOUD_FOLDER, publicId, { overwrite });
}

async function updateProduct(doc, image, brand) {
  const now = new Date().toISOString();
  const update = {
    images: [image],
    updatedAt: now,
  };
  if (brand) update.brand = brand;
  await collection.updateOne({ _id: doc._id }, { $set: update });
}

/** Find the best verified candidate across every configured source and query. */
const queryCache = new Map();

async function cachedSearch(source, query) {
  const key = `${source.id}::${query}`;
  if (!queryCache.has(key)) {
    const promise = sourceLimiter(source.id, source.limit || 2)(() =>
      fetchWithRetry(() => source.run(query))
    )
      .catch((error) => ({ candidates: [], error: error.message }))
      .then((result) => {
        // Never cache a failed lookup - a later product should be allowed to retry.
        if (result.error) queryCache.delete(key);
        if (args.verbose) {
          log(
            `  search ${source.id} "${query}" -> ${result.candidates?.length ?? 0} hits ${result.error ? `(${result.error})` : ""}`
          );
        }
        return result;
      });
    queryCache.set(key, promise);
  }
  return queryCache.get(key);
}

async function findCandidate(target) {
  const queries = buildQueries(target);
  const canVerify = args.verifyPages;
  let fallback = null;
  let pageChecks = 0;

  // Stage 1: try each source in order and stop as soon as an exact match
  // (brand + product type + pack size all confirmed) is found.
  for (const source of sources) {
    const results = await Promise.all(queries.map((query) => cachedSearch(source, query)));

    const ranked = [];
    const seenImages = new Set();
    for (const result of results) {
      for (const candidate of result.candidates || []) {
        if (seenImages.has(candidate.imageUrl)) continue;
        seenImages.add(candidate.imageUrl);
        const scored = scoreCandidate(target, candidate);
        if (!scored) continue;
        ranked.push({ ...candidate, ...scored });
      }
    }
    if (!ranked.length) continue;
    ranked.sort((a, b) => {
      if (a.exact !== b.exact) return a.exact ? -1 : 1;
      return b.score - a.score;
    });

    for (const candidate of ranked) {
      if (candidate.exact) return candidate;
      // A candidate whose pack size could not be read from the search result
      // is checked on the product page. A proven mismatch moves on to the next
      // candidate so a correctly sized listing can still be found.
      if (!candidate.sizeConfirmed && candidate.productUrl && canVerify && pageChecks < 3) {
        pageChecks++;
        const verified = await sourceLimiter(source.id, 1)(() =>
          verifyPackSizeOnPage(candidate.productUrl, target)
        );
        if (verified === "match") {
          candidate.sizeState = "match";
          candidate.sizeConfirmed = true;
          candidate.exact = true;
          candidate.score = Number((candidate.score + 0.2).toFixed(4));
          return candidate;
        }
        if (verified === "mismatch") continue;
      }
      if (!fallback) fallback = candidate;
      break;
    }
    if (fallback) return fallback;
  }
  return fallback;
}

async function processProduct({ doc, target }) {
  const result = { id: doc._id, sku: doc.sku, name: doc.name };

  if (!target.brand) {
    // Generic / unbranded grocery: no brand to match, so no retailer lookup.
    result.status = "skipped";
    result.reason = "generic-product";
    return result;
  }

  const candidate = await findCandidate(target);
  if (!candidate) {
    result.status = "no-match";
    if (args.verbose) log(`  no-match: ${doc.sku} ${doc.name}`);
    return result;
  }

  result.source = candidate.site;
  result.sourceUrl = candidate.productUrl || candidate.imageUrl;
  result.candidateTitle = candidate.title;
  result.score = candidate.score;
  result.sizeState = candidate.sizeState;

  const download = await downloadImage(candidate.imageUrl, {
    referer: candidate.site === "flipkart" ? "https://www.flipkart.com/" : "https://www.amazon.in/",
  });
  if (!download.ok) {
    result.status = "download-failed";
    result.error = download.error;
    if (args.verbose) log(`  download-failed: ${doc.sku} ${doc.name} (${download.error})`);
    return result;
  }
  result.bytes = download.bytes;
  result.dimensions = `${download.width}x${download.height}`;

  if (args.dryRun) {
    result.status = "dry-run";
    if (args.verbose) {
      log(
        `  dry-run ${candidate.exact ? "EXACT" : "review"}: ${doc.sku} ${doc.name} <- ${candidate.site} | ${String(candidate.title).slice(0, 55)} | size=${candidate.sizeState} | ${download.width}x${download.height}`
      );
    }
    return result;
  }

  const slug = `${doc.slug || slugify(doc.name)}`;
  let stored;
  try {
    stored = await storeImage(download.buffer, slug);
  } catch (error) {
    result.status = "upload-failed";
    result.error = error.message;
    return result;
  }

  const verified = Boolean(candidate.exact);
  const image = {
    url: stored.url,
    publicId: stored.publicId,
    alt: doc.name,
    sourceUrl: candidate.productUrl || candidate.imageUrl,
    sourceSite: candidate.site,
    sourceProductId: candidate.productUrl ? candidate.productUrl.split("/").pop() : undefined,
    imageType: "licensed",
    matchStatus: verified ? "exact" : "review_required",
    verificationStatus: verified ? "verified" : "unverified",
    usagePermission: candidate.site === "bigbasket" ? "confirmed" : "unknown",
    verifiedAt: new Date().toISOString(),
  };
  await updateProduct(doc, image, target.brand);

  result.status = verified ? "verified" : "review-required";
  result.imageUrl = stored.url;
  result.matchStatus = image.matchStatus;
  if (args.verbose) {
    log(
      `  ${result.status}: ${doc.sku} ${doc.name} <- ${candidate.site} | ${String(candidate.title).slice(0, 60)} | size=${candidate.sizeState} | ${download.width}x${download.height}`
    );
  }
  return result;
}

async function run() {
  let batch = [];
  let index = 0;

  const worker = async () => {
    while (index < queue.length) {
      const item = queue[index++];
      let result;
      try {
        result = await processProduct(item);
      } catch (error) {
        result = { id: item.doc._id, sku: item.doc.sku, name: item.doc.name, status: "error", error: error.message };
        log(`  ERROR ${item.doc.sku}: ${error.message}`);
      }
      summary.processed++;
      summary.bySource[result.source || "none"] = (summary.bySource[result.source || "none"] || 0) + 1;
      if (result.status === "verified") summary.verified++;
      else if (result.status === "review-required") summary.reviewRequired++;
      else if (result.status === "no-match") summary.skipped++;
      else if (result.status === "skipped") summary.genericSkipped++;
      else summary.failed++;

      if (result.status === "verified" || result.status === "review-required") {
        progress.products[item.doc._id] = {
          status: "done",
          sku: item.doc.sku,
          name: item.doc.name,
          brand: item.target.brand,
          imageUrl: result.imageUrl,
          source: result.source,
          sourceUrl: result.sourceUrl,
          matchStatus: result.matchStatus,
          score: result.score,
          sizeState: result.sizeState,
          at: new Date().toISOString(),
        };
        mapping[item.doc._id] = {
          productId: item.doc._id,
          sku: item.doc.sku,
          name: item.doc.name,
          brand: item.target.brand,
          category: item.target.productType,
          packSize: item.target.unit,
          imageUrl: result.imageUrl,
          source: result.source,
          sourceUrl: result.sourceUrl,
          matchStatus: result.matchStatus,
          verificationStatus: result.matchStatus === "exact" ? "verified" : "unverified",
          imageType: "licensed",
          at: new Date().toISOString(),
        };
      } else if (result.status === "no-match") {
        progress.products[item.doc._id] = {
          status: "no-match",
          sku: item.doc.sku,
          name: item.doc.name,
          brand: item.target.brand,
          at: new Date().toISOString(),
        };
      }

      batch.push(result);
      if (batch.length >= args.batchSize) {
        saveProgress(progress);
        saveMapping(mapping);
        log(
          `progress ${summary.processed}/${queue.length} | verified ${summary.verified} | review ${summary.reviewRequired} | no-match ${summary.skipped} | failed ${summary.failed}`
        );
        batch = [];
      }
    }
  };

  const workers = Array.from({ length: args.concurrency }, () => worker());
  await Promise.all(workers);

  saveProgress(progress);
  saveMapping(mapping);
  log("done", JSON.stringify(summary));
}

await run();
await mongoose.disconnect();
