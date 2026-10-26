import { inflateRawSync } from "node:zlib";
import { readFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

const workbookPath = path.resolve(
  "Vijayawada_718_Five_Store_Price_Comparison_Plus_10.xlsx"
);

const VERIFIED_AVERAGE_PRICES = new Map([
  [1, 98], [2, 53], [3, 425], [4, 93], [5, 45], [6, 375], [7, 93], [8, 45],
  [9, 375], [10, 78], [11, 43], [12, 450], [13, 95], [14, 75], [15, 750],
  [16, 80], [17, 55], [18, 625], [19, 140], [20, 83], [21, 550], [22, 110],
  [23, 55], [24, 400], [25, 85], [26, 45], [27, 350], [28, 105], [29, 50],
  [30, 400], [31, 105], [32, 50], [33, 350], [34, 110], [35, 45], [36, 400],
  [37, 70], [38, 38], [39, 300],
  [40, 170], [41, 85], [42, 650], [43, 140], [44, 65], [45, 600],
  [46, 120], [47, 60], [48, 750], [49, 145], [50, 100], [51, 800],
  [52, 160], [53, 90], [54, 700], [55, 140], [56, 65], [57, 550],
  [58, 120], [59, 65], [60, 500], [61, 120], [62, 55], [63, 450],
  [64, 180], [65, 80], [66, 750], [67, 170], [68, 75], [69, 900],
  [70, 120], [71, 90], [72, 800], [73, 130], [74, 75], [75, 600],
  [76, 150], [77, 65], [78, 600], [79, 110], [80, 55], [81, 450],
  [82, 130], [83, 60], [84, 500], [85, 150], [86, 70], [87, 600],
  [88, 140], [89, 65], [90, 750],
  [172, 75], [173, 180], [174, 35], [175, 100], [176, 200], [177, 45],
  [178, 110], [179, 280], [180, 65], [181, 65], [182, 140], [183, 40],
  [184, 100], [185, 280], [186, 65], [187, 50], [188, 130], [189, 25],
  [190, 220], [191, 450], [192, 120], [193, 100], [194, 300], [195, 75],
  [196, 100], [197, 300], [198, 45], [199, 90], [200, 180], [201, 45],
  [202, 80], [203, 200], [204, 40], [205, 100], [206, 250], [207, 55],
  [208, 100], [209, 280], [210, 60], [211, 110], [212, 280], [213, 45],
  [214, 90], [215, 180], [216, 45], [217, 70], [218, 180], [219, 40],
  [220, 45], [221, 110], [222, 25], [223, 700], [224, 1600], [225, 350],
  [226, 130], [227, 350], [228, 75], [229, 200], [230, 500], [231, 120],
  [232, 150], [233, 400], [234, 80], [235, 250], [236, 700], [237, 120],
  [238, 28], [239, 15], [240, 125], [241, 10], [242, 60], [243, 35],
  [244, 250], [245, 15], [246, 100], [247, 55], [248, 450], [249, 45],
  [250, 50], [251, 25], [252, 350], [253, 15], [254, 100], [255, 65],
  [256, 450], [257, 25], [258, 100], [259, 45], [260, 400], [261, 20],
  [262, 70], [263, 40], [264, 300], [265, 20], [266, 80], [267, 40],
  [268, 350], [269, 20], [270, 70], [271, 40], [272, 300], [273, 35],
  [400, 220], [401, 100], [402, 50], [403, 130], [404, 250], [405, 120],
  [406, 60], [407, 180], [408, 300], [409, 150], [410, 100], [411, 180],
  [412, 180], [413, 100], [414, 45], [415, 110], [416, 200], [417, 90],
  [418, 45], [419, 130], [420, 350], [421, 150], [422, 90], [423, 200],
  [424, 250], [425, 120], [426, 70], [427, 150], [428, 250], [429, 120],
  [430, 70], [431, 150], [432, 220], [433, 100], [434, 50], [435, 130],
  [436, 180], [437, 90], [438, 45], [439, 130], [440, 250], [441, 130],
  [442, 70], [443, 140],
  [519, 58], [520, 30], [521, 7], [522, 16], [523, 70], [524, 36],
  [525, 8], [526, 20], [527, 95], [528, 45], [529, 15], [530, 30],
  [531, 60], [532, 35], [533, 10], [534, 20], [535, 360], [536, 200],
  [537, 45], [538, 110], [539, 900], [540, 285], [541, 60], [542, 150],
  [543, 850], [544, 400], [545, 100], [546, 230], [547, 500], [548, 300],
  [549, 70], [550, 170], [551, 120], [552, 65], [553, 25], [554, 40],
  [555, 100], [556, 70], [557, 20], [558, 35], [559, 180], [560, 100],
  [561, 25], [562, 45],
  [563, 450], [564, 280], [565, 60], [566, 160], [567, 450], [568, 300],
  [569, 75], [570, 150], [571, 700], [572, 400], [573, 150], [574, 300],
  [575, 1000], [576, 900], [577, 300], [578, 600], [579, 700], [580, 1000],
  [581, 180], [582, 250], [583, 1000], [584, 600], [585, 90], [586, 160],
  [587, 1000], [588, 280], [589, 80], [590, 180], [591, 600], [592, 300],
  [593, 100], [594, 180], [595, 150], [596, 100], [597, 25], [598, 40],
  [599, 100], [600, 80], [601, 20], [602, 35], [603, 20], [604, 10],
  [605, 5], [606, 7],
  [607, 100], [608, 450], [609, 100], [610, 400], [611, 150], [612, 500],
  [613, 200], [614, 450], [615, 80], [616, 900], [617, 120], [618, 180],
  [619, 180], [620, 650], [621, 50], [622, 120], [623, 120], [624, 200],
  [625, 50], [626, 150], [627, 50], [628, 180], [629, 50], [630, 120],
  [631, 50], [632, 250], [633, 50], [634, 150], [635, 60], [636, 250],
  [637, 60], [638, 200], [639, 50], [640, 180], [641, 100], [642, 120],
  [643, 50], [644, 200], [645, 100], [646, 100],
  [647, 30], [648, 100], [649, 35], [650, 65], [651, 30], [652, 140],
  [653, 35], [654, 60], [655, 35], [656, 150], [657, 30], [658, 80],
  [659, 40], [660, 150], [661, 40], [662, 80], [663, 40], [664, 220],
  [665, 35], [666, 120], [667, 35], [668, 130], [669, 35], [670, 75],
  [671, 35], [672, 180], [673, 40], [674, 90], [675, 45], [676, 220],
  [677, 40], [678, 100],
  [679, 50], [680, 180], [681, 40], [682, 100], [683, 30], [684, 100],
  [685, 35], [686, 45], [687, 100], [688, 350], [689, 90], [690, 200],
  [691, 120], [692, 450], [693, 100], [694, 250], [695, 35], [696, 150],
  [697, 35], [698, 80], [699, 30], [700, 130], [701, 25], [702, 70],
  [703, 60], [704, 250], [705, 70], [706, 120], [707, 80], [708, 300],
  [709, 60], [710, 150], [711, 100], [712, 400], [713, 90], [714, 200],
  [715, 30], [716, 150], [717, 35], [718, 70],
]);

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
    const averagePrice = VERIFIED_AVERAGE_PRICES.get(Number(id));
    const categoryName = product.Category.trim();
    const productType = product["Product Type"].trim();
    const brand = product.Brand.trim();
    const name = product["Catalogue Product Name"].trim();
    const isSnack = /snack|biscuit|beverage|drink|tea|coffee/i.test(`${categoryName} ${productType}`);
    return {
      updateOne: {
        filter: { sku: `DMART-XLSX-${id}` },
        update: averagePrice
          ? {
              $set: {
                price: (averagePrice + 10) * 100,
                available: true,
                active: true,
                updatedAt: now,
              },
            }
          : {
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
        upsert: !averagePrice,
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
  const livePricedCount = await mongoose.connection.db.collection("products").countDocuments({
    sku: { $regex: "^DMART-XLSX-" },
    active: true,
    available: true,
    price: { $gt: 0 },
  });
  console.table(categoryCounts.map(({ _id, count }) => ({ category: _id, count })));
  console.log(`Fresh fruit and vegetable targets: ${freshCount}/25.`);
  console.log(`Live products with supplied prices: ${livePricedCount}.`);
} finally {
  await mongoose.disconnect();
}
