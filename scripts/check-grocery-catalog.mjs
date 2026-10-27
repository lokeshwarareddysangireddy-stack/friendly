import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import { GROCERY_CATEGORIES, groceryGroup } from "../lib/grocery-categories.ts";

const env = readFileSync(".env.local", "utf8");
const uri = env.match(/^MONGODB_URI\s*=\s*(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, "");
if (!uri) throw new Error("MONGODB_URI is required for the read-only catalogue audit.");
await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
try {
  const products = mongoose.connection.db.collection("products");
  const rows = await products.aggregate([
    { $match: { categorySlug: "grocery-and-daily-needs" } },
    { $group: { _id: { $arrayElemAt: ["$tags", 1] }, total: { $sum: 1 }, active: { $sum: { $cond: ["$active", 1, 0] } }, missingImages: { $sum: { $cond: [{ $eq: [{ $size: { $ifNull: ["$images", []] } }, 0] }, 1, 0] } } } },
    { $sort: { _id: 1 } },
  ]).toArray();
  console.table(rows);
  console.log("Stored grocery products:", rows.reduce((sum, row) => sum + row.total, 0));
  console.log("Active grocery products:", rows.reduce((sum, row) => sum + row.active, 0));
  console.log("Image URLs:", await products.distinct("images.url", { categorySlug: "grocery-and-daily-needs" }));
  const groups = new Map();
  let total = 0;
  let conflicts = 0;
  for await (const product of products.find({ categorySlug: "grocery-and-daily-needs" }, { projection: { tags: 1, active: 1 } })) {
    total++;
    const group = groceryGroup(product.tags);
    const count = groups.get(group) || { group, stored: 0, active: 0 };
    count.stored++;
    if (product.active) count.active++;
    groups.set(group, count);
    if (GROCERY_CATEGORIES.filter((category) => product.tags?.includes(category.tag)).length > 1) conflicts++;
  }
  console.table([...groups.values()]);
  if ([...groups.values()].reduce((sum, group) => sum + group.stored, 0) !== total || conflicts) {
    throw new Error(`Catalogue mapping mismatch: ${conflicts} conflicting category assignments.`);
  }
  console.log(`Coverage verified: ${total}/${total} records mapped; ${conflicts} conflicting assignments. No writes performed.`);
} finally {
  await mongoose.disconnect();
}
