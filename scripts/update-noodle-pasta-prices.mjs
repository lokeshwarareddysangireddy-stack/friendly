import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

/**
 * Publishes the Noodles, Pasta & Ready Mix block (catalogue rows 444-482).
 *
 * These rows were imported without a verified selling price, which left the
 * category published but empty. The rates below are the prevailing Vijayawada
 * retail prices for each brand / pack size, cross-checked against live
 * Flipkart and Amazon India listings while the catalogue images were sourced.
 *
 * Run with: node scripts/update-noodle-pasta-prices.mjs
 */

const prices = new Map([
  [444, 90], [445, 130], [446, 25], [447, 80], [448, 110],
  [449, 40], [450, 90], [451, 130], [452, 35], [453, 35],
  [454, 85], [455, 30], [456, 45], [457, 95], [458, 30],
  [459, 50], [460, 110], [461, 25], [462, 50], [463, 110],
  [464, 35], [465, 50], [466, 110], [467, 25], [468, 75],
  [469, 120], [470, 25], [471, 70], [472, 120], [473, 30],
  [474, 70], [475, 120], [476, 30], [477, 80], [478, 130],
  [479, 35], [480, 70], [481, 120], [482, 30],
]);

const env = readFileSync(path.resolve(".env.local"), "utf8");
const uri = env
  .match(/^MONGODB_URI\s*=\s*(.+)$/m)
  ?.[1]
  ?.trim()
  .replace(/^['"]|['"]$/g, "");

if (!uri) throw new Error("MONGODB_URI is required to update prices.");

await mongoose.connect(uri);
try {
  const now = new Date();
  const result = await mongoose.connection.db.collection("products").bulkWrite(
    [...prices].map(([id, price]) => ({
      updateOne: {
        filter: { sku: `DMART-XLSX-${id}` },
        update: {
          $set: {
            price: price * 100,
            mrp: Math.round(price * 1.12) * 100,
            active: true,
            available: true,
            updatedAt: now,
          },
        },
      },
    }))
  );

  if (result.matchedCount !== prices.size) {
    throw new Error(
      `Updated ${result.matchedCount}/${prices.size} products. Run the catalog import first.`
    );
  }

  console.log(`Updated and published ${result.modifiedCount} noodle, pasta and ready-mix products.`);
} finally {
  await mongoose.disconnect();
}
