#!/usr/bin/env node
/**
 * Produces the grocery image verification report.
 *
 * Reads the live catalogue and reports, for every grocery product:
 *   - the image currently stored,
 *   - where it came from (source site + original URL),
 *   - the verification status and image type,
 *   - which category the product belongs to.
 *
 * Writes:
 *   reports/grocery-image-audit.csv    (one row per product)
 *   reports/grocery-image-report.md     (summary + per-category breakdown)
 *
 * Usage: node scripts/report-grocery-images.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { describeProduct } from "./lib/grocery-images.mjs";
import {
  GROCERY_CATEGORIES,
  GROCERY_SLUG,
  GROCERY_TAGS,
  OTHER_GROCERY,
} from "../lib/grocery-categories.ts";

const ROOT = process.cwd();
const REPORTS = path.join(ROOT, "reports");
const CSV_PATH = path.join(REPORTS, "grocery-image-audit.csv");
const MD_PATH = path.join(REPORTS, "grocery-image-report.md");

const env = readFileSync(path.resolve(".env.local"), "utf8");
const uri = env.match(/^MONGODB_URI\s*=\s*(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, "");
if (!uri) throw new Error("MONGODB_URI is required.");

await mongoose.connect(uri);
const products = await mongoose.connection.db
  .collection("products")
  .find({ categorySlug: GROCERY_SLUG })
  .sort({ sku: 1 })
  .toArray();

function categoryOf(product) {
  const tag = (product.tags || []).find((t) => GROCERY_TAGS.includes(t));
  if (tag) {
    const found = GROCERY_CATEGORIES.find((c) => c.tag === tag);
    if (found) return found;
  }
  if ((product.tags || []).some((t) => ["rice", "dal", "oil", "tea", "biscuits"].includes(t))) {
    return GROCERY_CATEGORIES.find((c) => c.tag === "rice-rice-products");
  }
  return OTHER_GROCERY;
}

const rows = products.map((product) => {
  const target = describeProduct(product);
  const image = product.images?.[0] || null;
  const category = categoryOf(product);
  return {
    id: String(product._id),
    sku: product.sku || "",
    name: product.name,
    brand: product.brand || target.brand || "",
    category: category.name,
    categoryTag: category.tag,
    size: product.unit || "",
    active: product.active ? "yes" : "no",
    price: product.price,
    imageUrl: image?.url || "",
    imageType: image?.imageType || "missing",
    sourceSite: image?.sourceSite || "",
    sourceUrl: image?.sourceUrl || "",
    matchStatus: image?.matchStatus || "not_found",
    verificationStatus: image?.verificationStatus || "unverified",
    usagePermission: image?.usagePermission || "unknown",
    verifiedAt: image?.verifiedAt || "",
  };
});

/* ------------------------------------------------------------------ csv --- */

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const header = [
  "Product ID",
  "SKU",
  "Product Name",
  "Brand",
  "Category",
  "Pack Size",
  "Listed",
  "Selling Price INR",
  "Image URL",
  "Image Type",
  "Source Site",
  "Source URL",
  "Match Status",
  "Verification Status",
  "Usage Permission",
  "Verified At",
];
const csv = [
  header.map(csvCell).join(","),
  ...rows.map((row) =>
    [
      row.id,
      row.sku,
      row.name,
      row.brand,
      row.category,
      row.size,
      row.active,
      row.price > 0 ? (row.price / 100).toFixed(2) : "",
      row.imageUrl,
      row.imageType,
      row.sourceSite,
      row.sourceUrl,
      row.matchStatus,
      row.verificationStatus,
      row.usagePermission,
      row.verifiedAt,
    ]
      .map(csvCell)
      .join(",")
  ),
].join("\n");

if (!existsSync(REPORTS)) mkdirSync(REPORTS, { recursive: true });
writeFileSync(CSV_PATH, csv, "utf8");

/* ------------------------------------------------------------------ md --- */

const count = (predicate) => rows.filter(predicate).length;
const verified = count((row) => row.verificationStatus === "verified");
const review = count(
  (row) => row.imageType !== "missing" && row.verificationStatus !== "verified"
);
const generated = count((row) => row.imageType === "generated");
const placeholder = count((row) => row.imageType === "placeholder");
const missing = count((row) => row.imageType === "missing" || !row.imageUrl);

const bySource = new Map();
for (const row of rows) {
  if (!row.sourceSite) continue;
  bySource.set(row.sourceSite, (bySource.get(row.sourceSite) || 0) + 1);
}

const categoryStats = new Map();
for (const row of rows) {
  if (!categoryStats.has(row.categoryTag)) {
    categoryStats.set(row.categoryTag, {
      name: row.category,
      total: 0,
      verified: 0,
      review: 0,
      generated: 0,
      placeholder: 0,
      missing: 0,
    });
  }
  const stat = categoryStats.get(row.categoryTag);
  stat.total++;
  if (row.verificationStatus === "verified") stat.verified++;
  else if (row.imageType === "generated") stat.generated++;
  else if (row.imageType === "placeholder") stat.placeholder++;
  else if (row.imageType === "missing" || !row.imageUrl) stat.missing++;
  else stat.review++;
}

const listed = rows.filter((row) => row.active === "yes").length;

const lines = [];
lines.push("# Grocery product image report");
lines.push("");
lines.push(`Generated ${new Date().toISOString().slice(0, 19).replace("T", " ")} UTC`);
lines.push("");
lines.push("## Catalogue");
lines.push("");
lines.push("| Metric | Count |");
lines.push("| --- | ---: |");
lines.push(`| Grocery products in the live database | ${rows.length} |`);
lines.push(`| Products published (active) | ${listed} |`);
lines.push(`| Products with a price | ${count((row) => row.price > 0)} |`);
lines.push(`| Grocery categories | ${GROCERY_CATEGORIES.length} |`);
lines.push("");
lines.push("## Image coverage");
lines.push("");
lines.push("| Image state | Count | Share |");
lines.push("| --- | ---: | ---: |");
const pct = (value) => (rows.length ? `${((value / rows.length) * 100).toFixed(1)}%` : "0%");
lines.push(`| Verified real product image (exact brand + product + pack size) | ${verified} | ${pct(verified)} |`);
lines.push(`| Real retailer image, pack size not independently confirmed | ${review} | ${pct(review)} |`);
lines.push(`| AI generated photorealistic image (generic products) | ${generated} | ${pct(generated)} |`);
lines.push(`| Clearly identified generic placeholder (branded product, no exact image found) | ${placeholder} | ${pct(placeholder)} |`);
lines.push(`| Still using the legacy shared placeholder | ${missing} | ${pct(missing)} |`);
lines.push("");
lines.push("## Source breakdown");
lines.push("");
if (bySource.size) {
  lines.push("| Source | Images |");
  lines.push("| --- | ---: |");
  for (const [site, value] of [...bySource].sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${site} | ${value} |`);
  }
} else {
  lines.push("No sourced images recorded yet.");
}
lines.push("");
lines.push("## Per category");
lines.push("");
lines.push("| Category | Products | Verified | Retail (unconfirmed) | Generated | Placeholder | Missing |");
lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
for (const stat of [...categoryStats.values()].sort((a, b) => b.total - a.total)) {
  lines.push(
    `| ${stat.name} | ${stat.total} | ${stat.verified} | ${stat.review} | ${stat.generated} | ${stat.placeholder} | ${stat.missing} |`
  );
}
lines.push("");
lines.push("## How images are matched");
lines.push("");
lines.push(
  "1. The product's brand, product type and pack size are recovered from the catalogue row."
);
lines.push(
  "2. Each approved retailer catalogue is searched with the full brand + product + pack size query."
);
lines.push(
  "3. A candidate is rejected unless **every** distinctive token of the product type is present (so wheat atta is never shown for ragi flour) and the pack size matches exactly (`1 kg` is accepted for a `1000 g` listing, but a `5 kg` pack is rejected for a `1 kg` row)."
);
lines.push(
  "4. Accepted images are downloaded, checked for type and minimum resolution, cropped free of any generator watermark and stored permanently in Cloudinary."
);
lines.push(
  "5. The product record stores the image URL together with the original source URL, source website, image type, match status, verification status and usage permission."
);
lines.push("");
lines.push("## Re-running");
lines.push("");
lines.push("```bash");
lines.push("npm run enrich:grocery-images -- --force   # re-source every product");
lines.push("npm run enrich:grocery-images -- --limit=50 # work through the catalogue in batches");
lines.push("npm run generate:grocery-images -- --all   # regenerate covers, generics and placeholders");
lines.push("npm run report:grocery-images              # refresh this report");
lines.push("```");
lines.push("");
lines.push(
  "The enrichment run is resumable: verified images are never overwritten with a less accurate one and progress is checkpointed in `reports/grocery-image-progress.json`."
);
lines.push("");

writeFileSync(MD_PATH, lines.join("\n"), "utf8");

console.log(`Products: ${rows.length}`);
console.log(`Verified: ${verified} | Retail unconfirmed: ${review} | Generated: ${generated} | Placeholder: ${placeholder} | Missing: ${missing}`);
console.log(`Report written to ${MD_PATH}`);
console.log(`Audit CSV written to ${CSV_PATH}`);

await mongoose.disconnect();
