import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const prices = new Map([
  [483, 70], [484, 180], [485, 45], [486, 75], [487, 170], [488, 35],
  [489, 80], [490, 150], [491, 50], [492, 80], [493, 200], [494, 40],
  [495, 60], [496, 120], [497, 30], [498, 55], [499, 150], [500, 35],
  [501, 60], [502, 150], [503, 35], [504, 40], [505, 80], [506, 25],
  [507, 90], [508, 200], [509, 45], [510, 75], [511, 160], [512, 35],
  [513, 80], [514, 170], [515, 50], [516, 100], [517, 300], [518, 50],
]);

const env = readFileSync(path.resolve(".env.local"), "utf8");
const uri = env
  .match(/^MONGODB_URI\s*=\s*(.+)$/m)?.[1]
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
        update: { $set: { price: price * 100, active: true, available: true, updatedAt: now } },
      },
    }))
  );

  if (result.matchedCount !== prices.size) {
    throw new Error(`Updated ${result.matchedCount}/${prices.size} products. Run the catalog import first.`);
  }

  console.log(`Updated and published ${result.modifiedCount} pickle, sauce, and spread products.`);
} finally {
  await mongoose.disconnect();
}
