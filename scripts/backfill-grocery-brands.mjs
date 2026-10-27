#!/usr/bin/env node
/**
 * Backfills the explicit `brand` field on grocery products.
 *
 * Imported catalogue rows keep "<product type> by <brand>." in the
 * description and "<brand> <product type> - <pack size>" in the name, so the
 * brand can be recovered without changing any other field.
 *
 * Usage: node scripts/backfill-grocery-brands.mjs
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { describeProduct } from "./lib/grocery-images.mjs";

const env = readFileSync(path.resolve(".env.local"), "utf8");
const uri = env.match(/^MONGODB_URI\s*=\s*(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, "");
if (!uri) throw new Error("MONGODB_URI is required.");

await mongoose.connect(uri);
const collection = mongoose.connection.db.collection("products");
const products = await collection.find({ categorySlug: "grocery-and-daily-needs" }).toArray();

const operations = [];
for (const product of products) {
  const target = describeProduct(product);
  if (!target.brand) continue;
  if (product.brand === target.brand) continue;
  operations.push({
    updateOne: {
      filter: { _id: product._id },
      update: { $set: { brand: target.brand } },
    },
  });
}

if (operations.length) {
  const result = await collection.bulkWrite(operations);
  console.log(`Backfilled brand on ${result.modifiedCount}/${operations.length} grocery products.`);
} else {
  console.log("All grocery products already carry a brand.");
}

await mongoose.disconnect();
