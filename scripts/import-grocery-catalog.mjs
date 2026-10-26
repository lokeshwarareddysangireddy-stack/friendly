import { inflateRawSync } from "node:zlib";
import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const workbookPath = path.resolve(
  "DMart_718_Updated_With_Online_Price_References-1.xlsx"
);

const FRESH_PRODUCTS = [
  ["Fresh Tomato", "1 kg", "vegetable"],
  ["Fresh Onion", "1 kg", "vegetable"],
  ["Fresh Potato", "1 kg", "vegetable"],
  ["Fresh Green Chilli", "250 g", "vegetable"],
  ["Fresh Ginger", "250 g", "vegetable"],
  ["Fresh Garlic", "250 g", "vegetable"],
  ["Fresh Brinjal", "500 g", "vegetable"],
  ["Fresh Ladies Finger", "500 g", "vegetable"],
  ["Fresh Carrot", "500 g", "vegetable"],
  ["Fresh Beetroot", "500 g", "vegetable"],
  ["Fresh Cabbage", "1 piece", "vegetable"],
  ["Fresh Cauliflower", "1 piece", "vegetable"],
  ["Fresh Bottle Gourd", "1 piece", "vegetable"],
  ["Fresh Bitter Gourd", "500 g", "vegetable"],
  ["Fresh Ridge Gourd", "500 g", "vegetable"],
  ["Fresh Cucumber", "500 g", "vegetable"],
  ["Fresh Banana", "1 kg", "fruit"],
  ["Fresh Apple", "1 kg", "fruit"],
  ["Fresh Orange", "1 kg", "fruit"],
  ["Fresh Sweet Lime", "1 kg", "fruit"],
  ["Fresh Papaya", "1 kg", "fruit"],
  ["Fresh Watermelon", "1 kg", "fruit"],
  ["Fresh Pomegranate", "1 kg", "fruit"],
  ["Fresh Guava", "1 kg", "fruit"],
  ["Fresh Green Grapes", "500 g", "fruit"],
];

function decodeXml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function readZipEntry(zip, name) {
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw new Error("Invalid XLSX archive.");
  let offset = zip.readUInt32LE(end + 16);
  const entries = zip.readUInt16LE(end + 10);

  for (let index = 0; index < entries; index += 1) {
    if (zip.readUInt32LE(offset) !== 0x02014b50) throw new Error("Invalid ZIP entry.");
    const method = zip.readUInt16LE(offset + 10);
    const compressedSize = zip.readUInt32LE(offset + 20);
    const nameLength = zip.readUInt16LE(offset + 28);
    const extraLength = zip.readUInt16LE(offset + 30);
    const commentLength = zip.readUInt16LE(offset + 32);
    const localOffset = zip.readUInt32LE(offset + 42);
    const entryName = zip.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");

    if (entryName === name) {
      const localNameLength = zip.readUInt16LE(localOffset + 26);
      const localExtraLength = zip.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const data = zip.subarray(start, start + compressedSize);
      return (method === 8 ? inflateRawSync(data) : data).toString("utf8");
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`Workbook entry not found: ${name}`);
}

function readSheetRows(workbook) {
  const sharedXml = readZipEntry(workbook, "xl/sharedStrings.xml");
  const shared = [...sharedXml.matchAll(/<(?:x:)?si>([\s\S]*?)<\/(?:x:)?si>/g)].map(([, value]) =>
    decodeXml(
      [...value.matchAll(/<(?:x:)?t[^>]*>([\s\S]*?)<\/(?:x:)?t>/g)]
        .map(([, text]) => text)
        .join("")
    )
  );
  const sheetXml = readZipEntry(workbook, "xl/worksheets/sheet1.xml");

  return [...sheetXml.matchAll(/<(?:x:)?row[^>]*>([\s\S]*?)<\/(?:x:)?row>/g)].map(([, row]) => {
    const cells = {};
    for (const [, attributes, content] of row.matchAll(
      /<(?:x:)?c([^>]*)>([\s\S]*?)<\/(?:x:)?c>/g
    )) {
      const ref = attributes.match(/r="([A-Z]+)\d+"/)?.[1];
      const value = content.match(/<(?:x:)?v>([\s\S]*?)<\/(?:x:)?v>/)?.[1] ?? "";
      if (!ref) continue;
      cells[ref] = attributes.includes('t="s"') ? shared[Number(value)] : decodeXml(value);
    }
    return cells;
  });
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const workbook = readFileSync(workbookPath);
const rows = readSheetRows(workbook);
const headers = rows.shift();
const columns = Object.fromEntries(Object.entries(headers).map(([key, value]) => [value, key]));
const products = rows.map((row) =>
  Object.fromEntries(Object.entries(columns).map(([name, column]) => [name, row[column] ?? ""]))
);
const env = readFileSync(path.resolve(".env.local"), "utf8");
const uri = env
  .match(/^MONGODB_URI\s*=\s*(.+)$/m)?.[1]
  ?.trim()
  .replace(/^['"]|['"]$/g, "");

if (!uri) throw new Error("MONGODB_URI is required to import the catalog.");

await mongoose.connect(uri);
try {
  const category = await mongoose.connection.db
    .collection("categories")
    .findOne({ slug: "grocery-and-daily-needs" });
  if (!category) throw new Error("Grocery and Daily Needs category was not found.");

  const now = new Date();
  const operations = products.map((product) => {
    const id = product.ID.trim();
    const categoryName = product.Category.trim();
    const productType = product["Product Type"].trim();
    const brand = product.Brand.trim();
    const name = product["Catalogue Product Name"].trim();
    const isSnack = /snack|biscuit|beverage|drink|tea|coffee/i.test(`${categoryName} ${productType}`);
    return {
      updateOne: {
        filter: { sku: `DMART-XLSX-${id}` },
        update: {
          $setOnInsert: {
            name,
            slug: `grocery-${id}-${slugify(name)}`,
            description: `${productType} by ${brand}. Price pending verification.`,
            categoryId: String(category._id),
            categorySlug: "grocery-and-daily-needs",
            images: [
              {
                url: isSnack
                  ? "/images/products/snacks-beverages.jpg"
                  : "/images/products/grocery-essentials.jpg",
                alt: name,
              },
            ],
            price: 0,
            mrp: null,
            available: false,
            stockQty: null,
            trackStock: false,
            featured: false,
            sku: `DMART-XLSX-${id}`,
            active: false,
            orderingMethod: "both",
            requiresPrescription: false,
            unit: product["Pack Size"].trim(),
            tags: ["grocery", slugify(categoryName), slugify(productType), slugify(brand)],
            sortOrder: 10000 + Number(id),
            createdAt: now,
            updatedAt: now,
          },
        },
        upsert: true,
      },
    };
  });
  const freshOperations = FRESH_PRODUCTS.map(([name, unit, type], index) => ({
    updateOne: {
      filter: { sku: `FRESH-TARGET-${index + 1}` },
      update: {
        $setOnInsert: {
          name,
          slug: `fresh-target-${index + 1}-${slugify(name)}`,
          description: "Fresh produce. Price pending verification.",
          categoryId: String(category._id),
          categorySlug: "grocery-and-daily-needs",
          images: [{ url: `/images/products/fresh-${type}s.jpg`, alt: name }],
          price: 0,
          mrp: null,
          available: false,
          stockQty: null,
          trackStock: false,
          featured: false,
          sku: `FRESH-TARGET-${index + 1}`,
          active: false,
          orderingMethod: "both",
          requiresPrescription: false,
          unit,
          tags: ["grocery", "fresh-produce", type, "fresh"],
          sortOrder: 11000 + index,
          createdAt: now,
          updatedAt: now,
        },
      },
      upsert: true,
    },
  }));

  const result = await mongoose.connection.db
    .collection("products")
    .bulkWrite([...operations, ...freshOperations]);
  console.log(`Imported ${result.upsertedCount} products; ${result.matchedCount} were already present.`);
  const categoryCounts = await mongoose.connection.db
    .collection("products")
    .aggregate([
      { $match: { sku: { $regex: "^DMART-XLSX-" } } },
      { $group: { _id: { $arrayElemAt: ["$tags", 1] }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();
  const freshCount = await mongoose.connection.db
    .collection("products")
    .countDocuments({ sku: { $regex: "^FRESH-TARGET-" } });
  console.table(categoryCounts.map(({ _id, count }) => ({ category: _id, count })));
  console.log(`Fresh fruit and vegetable targets: ${freshCount}/25.`);
} finally {
  await mongoose.disconnect();
}
