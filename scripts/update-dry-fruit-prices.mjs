import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const prices = new Map([
  [274, 450], [275, 200], [276, 100], [277, 550], [278, 220], [279, 100],
  [280, 200], [281, 90], [282, 40], [283, 300], [284, 120], [285, 60],
  [286, 650], [287, 280], [288, 150], [289, 600], [290, 280], [291, 130],
  [292, 200], [293, 100], [294, 60], [295, 650], [296, 300], [297, 150],
  [298, 650], [299, 240], [300, 120], [301, 120], [302, 55], [303, 25],
  [304, 350], [305, 130], [306, 70], [307, 220], [308, 90], [309, 60],
  [310, 300], [311, 140], [312, 75], [313, 180], [314, 80], [315, 50],
  [316, 200], [317, 90], [318, 45],
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

  console.log(`Updated and published ${result.modifiedCount} dry fruit products.`);
} finally {
  await mongoose.disconnect();
}
