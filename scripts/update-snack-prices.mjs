import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const prices = new Map([
  [355, 80], [356, 180], [357, 40], [358, 100], [359, 220], [360, 50],
  [361, 60], [362, 150], [363, 30], [364, 70], [365, 180], [366, 35],
  [367, 65], [368, 180], [369, 35], [370, 70], [371, 160], [372, 25],
  [373, 65], [374, 130], [375, 35], [376, 60], [377, 180], [378, 35],
  [379, 75], [380, 200], [381, 35], [382, 55], [383, 120], [384, 30],
  [385, 80], [386, 180], [387, 40], [388, 90], [389, 200], [390, 40],
  [391, 60], [392, 160], [393, 30], [394, 70], [395, 150], [396, 25],
  [397, 80], [398, 180], [399, 40],
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

  console.log(`Updated and published ${result.modifiedCount} snack products.`);
} finally {
  await mongoose.disconnect();
}
