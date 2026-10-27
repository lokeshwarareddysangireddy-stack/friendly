import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const prices = new Map([
  [319, 70], [320, 35], [321, 20], [322, 60], [323, 30], [324, 35],
  [325, 100], [326, 80], [327, 40], [328, 200], [329, 80], [330, 35],
  [331, 250], [332, 80], [333, 35], [334, 220], [335, 70], [336, 35],
  [337, 130], [338, 45], [339, 25], [340, 120], [341, 50], [342, 30],
  [343, 100], [344, 45], [345, 40], [346, 100], [347, 60], [348, 35],
  [349, 200], [350, 80], [351, 30], [352, 250], [353, 90], [354, 35],
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

  console.log(`Updated and published ${result.modifiedCount} biscuit products.`);
} finally {
  await mongoose.disconnect();
}
