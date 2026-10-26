import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const prices = new Map([
  [133, 150], [134, 80], [135, 20], [136, 200], [137, 105], [138, 25],
  [139, 160], [140, 80], [141, 20], [142, 160], [143, 85], [144, 20],
  [145, 300], [146, 155], [147, 35], [148, 250], [149, 130], [150, 35],
  [151, 150], [152, 80], [153, 20], [154, 650], [155, 350], [156, 80],
  [157, 150], [158, 80], [159, 20], [160, 130], [161, 65], [162, 15],
  [163, 700], [164, 350], [165, 75], [166, 650], [167, 325], [168, 65],
  [169, 150], [170, 75], [171, 18],
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

  console.log(`Updated and published ${result.modifiedCount} cooking oil and ghee products.`);
} finally {
  await mongoose.disconnect();
}
