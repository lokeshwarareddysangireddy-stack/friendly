import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const prices = new Map([
  [91, 65], [92, 28], [93, 250], [94, 75], [95, 40], [96, 230],
  [97, 45], [98, 20], [99, 180], [100, 100], [101, 48], [102, 650],
  [103, 55], [104, 45], [105, 300], [106, 100], [107, 45], [108, 350],
  [109, 90], [110, 45], [111, 350], [112, 65], [113, 30], [114, 250],
  [115, 65], [116, 35], [117, 250], [118, 55], [119, 25], [120, 220],
  [121, 50], [122, 25], [123, 350], [124, 55], [125, 45], [126, 300],
  [127, 180], [128, 80], [129, 650], [130, 120], [131, 65], [132, 400],
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

  console.log(`Updated and published ${result.modifiedCount} flour and grain products.`);
} finally {
  await mongoose.disconnect();
}
