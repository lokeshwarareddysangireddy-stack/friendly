import { inflateRawSync } from "node:zlib";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const workbookPath = path.resolve(process.argv[2] || "DMart_718_Updated_With_Online_Price_References-1.xlsx");
const outputPath = path.resolve(process.argv[3] || "reports/grocery-image-audit.csv");

function decodeXml(value = "") {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function readZipEntry(zip, name) {
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw new Error("Invalid XLSX archive");
  let offset = zip.readUInt32LE(end + 16);
  const entries = zip.readUInt16LE(end + 10);
  for (let i = 0; i < entries; i += 1) {
    const method = zip.readUInt16LE(offset + 10);
    const size = zip.readUInt32LE(offset + 20);
    const nameLength = zip.readUInt16LE(offset + 28);
    const extraLength = zip.readUInt16LE(offset + 30);
    const commentLength = zip.readUInt16LE(offset + 32);
    const localOffset = zip.readUInt32LE(offset + 42);
    const entryName = zip.subarray(offset + 46, offset + 46 + nameLength).toString("utf8");
    if (entryName === name) {
      const start = localOffset + 30 + zip.readUInt16LE(localOffset + 26) + zip.readUInt16LE(localOffset + 28);
      const data = zip.subarray(start, start + size);
      return (method === 8 ? inflateRawSync(data) : data).toString("utf8");
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`Workbook entry not found: ${name}`);
}

function readRows(zip) {
  const sharedXml = readZipEntry(zip, "xl/sharedStrings.xml");
  const shared = [...sharedXml.matchAll(/<(?:x:)?si>([\s\S]*?)<\/(?:x:)?si>/g)].map(([, value]) =>
    decodeXml([...value.matchAll(/<(?:x:)?t[^>]*>([\s\S]*?)<\/(?:x:)?t>/g)].map(([, text]) => text).join("")));
  return [...readZipEntry(zip, "xl/worksheets/sheet1.xml").matchAll(/<(?:x:)?row[^>]*>([\s\S]*?)<\/(?:x:)?row>/g)].map(([, row]) => {
    const cells = {};
    for (const [, attrs, content] of row.matchAll(/<(?:x:)?c([^>]*)>([\s\S]*?)<\/(?:x:)?c>/g)) {
      const ref = attrs.match(/r="([A-Z]+)\d+"/)?.[1];
      if (!ref) continue;
      const value = content.match(/<(?:x:)?v>([\s\S]*?)<\/(?:x:)?v>/)?.[1] ?? "";
      cells[ref] = attrs.includes('t="s"') ? shared[Number(value)] : decodeXml(value);
    }
    return cells;
  });
}

const rows = readRows(readFileSync(workbookPath));
const headers = rows.shift() || {};
const columns = Object.fromEntries(Object.entries(headers).map(([col, header]) => [header, col]));
const values = rows.map((row) => Object.fromEntries(Object.entries(columns).map(([header, col]) => [header, row[col] || ""])));
const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const output = [["Product ID", "Product Name", "Brand", "Category", "Size", "Image URL", "Image Source", "Match Status", "Verification Status", "Usage Permission", "Search Query"]];

for (const item of values) {
  const productName = item["Catalogue Product Name"]?.trim() || "";
  const brand = item.Brand?.trim() || "";
  const size = item["Pack Size"]?.trim() || "";
  const query = [productName, size && !productName.toLowerCase().includes(size.toLowerCase()) ? size : ""]
    .filter(Boolean).join(" ");
  output.push([item.ID, productName, brand, item.Category, size, "", "", "Review Required", "Unverified", "Unknown", query]);
}

const csv = output.map((row) => row.map(escape).join(",")).join("\r\n") + "\r\n";
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, csv, "utf8");
console.log(`Examined ${values.length} products; created review queue at ${outputPath}. No images were claimed as verified.`);
