/**
 * Shared helpers for grocery product-image enrichment.
 *
 * Sources (retailer catalogues that publish the real manufacturer packshot):
 *   - Flipkart India  https://www.flipkart.com/search?q=...
 *   - Amazon India    https://www.amazon.in/s?k=...
 *   - BigBasket       https://www.bigbasket.com (when a public catalogue endpoint responds)
 *
 * AI generation (generic / unbranded products and category covers):
 *   - Pollinations text-to-image (no API key required)
 *
 * Permanent storage: Cloudinary (the app's approved image storage system).
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

export const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/* ------------------------------------------------------------------ env --- */

export function readEnvFile(file = ".env.local") {
  try {
    const raw = readFileSync(path.resolve(file), "utf8");
    const out = {};
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z_0-9]*)\s*=\s*(.*)$/);
      if (!m) continue;
      let value = m[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      out[m[1]] = value;
    }
    return out;
  } catch {
    return {};
  }
}

export function configureCloudinary() {
  const env = readEnvFile();
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  return {
    ok: Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET),
    cloudName: env.CLOUDINARY_CLOUD_NAME,
  };
}

/* --------------------------------------------------------- normalisation --- */

const STOPWORDS = new Set(["of", "and", "the", "a", "an", "with", "in", "for", "by", "pack", "packed", "pouch", "box", "jar", "bottle", "can", "bag"]);

export function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/** Tokens that actually carry product identity (brand + product type). */
export function contentTokens(value) {
  return tokenize(value).filter((token) => !STOPWORDS.has(token));
}

/* ------------------------------------------------------------- pack size --- */

const UNIT_ALIASES = {
  gm: "g",
  gram: "g",
  grams: "g",
  gramme: "g",
  grammes: "g",
  kilogram: "kg",
  kilograms: "kg",
  kgs: "kg",
  kilo: "kg",
  kilos: "kg",
  litre: "l",
  liter: "l",
  litres: "l",
  liters: "l",
  lt: "l",
  ml: "ml",
  millilitre: "ml",
  milliliter: "ml",
  millilitres: "ml",
  milliliters: "ml",
  piece: "pc",
  pieces: "pc",
  pcs: "pc",
  pkt: "pack",
  packet: "pack",
  packets: "pack",
};

const SIZE_TOKEN =
  "kg|kgs|kilo|kilos|kilogram|kilograms|g|gms|gm|gram|grams|gramme|grammes|l|ltr|litre|litres|liter|liters|ml|millilitre|milliliter|millilitres|milliliters";

const SIZE_RX = new RegExp(
  `(\\d+(?:\\.\\d+)?)\\s*(${SIZE_TOKEN})\\b`,
  "gi"
);

export function parsePackSize(unit) {
  const text = String(unit || "").toLowerCase();
  const match = text.match(
    new RegExp(
      `(\\d+(?:\\.\\d+)?)\\s*(${SIZE_TOKEN}|piece|pieces|pc|pkt|packet|pack)\\b`
    )
  );
  if (!match) return null;
  const raw = match[2];
  const normalized = UNIT_ALIASES[raw] || raw;
  // Loose packs ("Pack", "1 piece") carry no reliable size signal.
  if (normalized === "pack" || normalized === "pc") return { value: Number(match[1]), unit: normalized, loose: true };
  return { value: Number(match[1]), unit: normalized, loose: false };
}

/** Canonical base-unit comparison so "1 kg" == "1000 g" and "1 L" == "1000 ml". */
const MASS_TO_GRAMS = { kg: 1000, g: 1 };
const VOLUME_TO_ML = { l: 1000, ml: 1 };

export function canonicalSize(size) {
  if (!size) return null;
  if (MASS_TO_GRAMS[size.unit] != null) {
    return { family: "mass", amount: Number((size.value * MASS_TO_GRAMS[size.unit]).toFixed(3)) };
  }
  if (VOLUME_TO_ML[size.unit] != null) {
    return { family: "volume", amount: Number((size.value * VOLUME_TO_ML[size.unit]).toFixed(3)) };
  }
  return null;
}

export function sizesMatch(a, b) {
  const ca = canonicalSize(a);
  const cb = canonicalSize(b);
  if (!ca || !cb) return false;
  return ca.family === cb.family && Math.abs(ca.amount - cb.amount) < 0.001;
}

/** True when the candidate title advertises exactly this pack size. */
export function titleHasPackSize(title, size) {
  if (!size || size.loose) return null; // unknown, neither a match nor a mismatch
  const unitPattern = { kg: "kg", g: "g", l: "l|lt|ltr|litre|liter", ml: "ml" }[size.unit];
  if (!unitPattern) return null;
  const value = String(size.value).replace(/\.0$/, "");
  const rx = new RegExp(`(?<![\\d.])${value}\\s*(?:${unitPattern})(?![\\d])`, "i");
  if (rx.test(String(title || ""))) return true;

  // Fall back to a canonical comparison across unit families (1 kg == 1000 g).
  const mentions = [...String(title || "").matchAll(SIZE_RX)];
  if (!mentions.length) return null;
  const canonical = canonicalSize(size);
  for (const mention of mentions) {
    const unit = UNIT_ALIASES[mention[2].toLowerCase()] || mention[2].toLowerCase();
    const candidate = { value: Number(mention[1]), unit };
    if (sizesMatch(candidate, size)) return true;
  }
  return canonical ? false : null;
}

/** "2.5 kg, Pack of 5" -> 2.5 kg (the single pack that the photo shows). */
export function parsePackField(value) {
  const text = String(value || "").split(",")[0].trim();
  return parsePackSize(text);
}

/* -------------------------------------------------------------- matching --- */

function tokenPresent(targetToken, titleTokens) {
  if (titleTokens.includes(targetToken)) return true;
  // Allow "24mantra" to match brand token "24" + "mantra" and vice versa.
  return titleTokens.some((candidate) => candidate.startsWith(targetToken) && targetToken.length >= 4);
}

/**
 * Words that carry little discriminating power on their own ("flour" matches
 * dozens of flours). A candidate must still satisfy every *distinctive* token
 * of the product type, otherwise it is a different product.
 */
export const GENERIC_TYPE_TOKENS = new Set([
  "flour", "atta", "rice", "chawal", "oil", "ghee", "sugar", "salt", "dal", "pulses",
  "masala", "masale", "spice", "spices", "biscuit", "biscuits", "cookie", "cookies",
  "namkeen", "snack", "snacks", "mixture", "mix", "powder", "sauce", "pickle", "tea",
  "coffee", "beverage", "chocolate", "sweets", "nut", "nuts", "seed", "seeds", "cereal",
  "cereals", "oats", "grain", "grains", "noodles", "pasta", "cheese", "butter", "curd",
  "milk", "yogurt", "jam", "jelly", "spread", "frozen", "canned", "baking", "cooking",
  "breakfast", "fruit", "juice", "syrup", "honey", "millet", "corn", "rusk", "crackers",
  "cracker", "wafer", "toffee", "candy", "lollipop", "vermicelli", "poha", "sattu", "sev",
  "papdi", "murukku", "chakli", "khakhra", "bhujia", "chips", "nachos", "popcorn", "gelatin",
  "gelatine", "yeast", "soda", "colour", "essence", "ketchup", "mayonnaise", "vinegar",
  "soy", "mustard", "flakes", "slices", "spread", "juice", "drink", "pack", "pieces",
]);

/** Alternative spellings used by different retailers for the same product. */
export const TYPE_SYNONYMS = {
  flour: ["flour", "atta"],
  atta: ["atta", "flour"],
  rice: ["rice", "chawal"],
  dalia: ["dalia", "daliya", "broken wheat"],
  ragi: ["ragi", "nachni", "mandua", "finger millet"],
  bajra: ["bajra", "pearl millet", "kuthli"],
  jowar: ["jowar", "sorghum", "cholam"],
  besan: ["besan", "gram flour", "chana flour"],
  jeera: ["jeera", "cumin"],
  poha: ["poha", "flattened rice"],
  soan: ["soan", "soan papdi"],
  papdi: ["papdi"],
  sev: ["sev"],
  murukku: ["murukku", "murmur"],
  namkeen: ["namkeen", "mixture", "snack", "bhujia", "savoury"],
  biscuit: ["biscuit", "biscuits", "cookie", "cookies"],
  cookies: ["cookie", "cookies", "biscuit", "biscuits"],
  masoori: ["masoori", "masuri"],
  sona: ["sona", "sona masoori"],
  rusk: ["rusk", "rusks"],
  papad: ["papad", "papadum"],
  chips: ["chips", "crisps"],
  dhokla: ["dhokla"],
  idli: ["idli"],
  dosa: ["dosa"],
  upma: ["upma", "upma"],
  rava: ["rava", "sooji", "semolina"],
  vermicelli: ["vermicelli", "sevai"],
  macaroni: ["macaroni"],
  penne: ["penne"],
  fusilli: ["fusilli"],
  spaghetti: ["spaghetti"],
  lasi: ["lassi", "lassi"],
  kheer: ["kheer"],
  gulab: ["gulab", "jamun"],
  jamun: ["jamun", "gulab"],
  rasgulla: ["rasgulla", "rasgula"],
  hing: ["hing"],
  haldi: ["haldi", "turmeric"],
  adrak: ["adrak", "ginger"],
  methi: ["methi", "fenugreek"],
  dhania: ["dhania", "coriander"],
  kalonji: ["kalonji", "nigella"],
  elaichi: ["elaichi", "cardamom"],
  laung: ["laung"],
  dalchini: ["dalchini", "cinnamon"],
  lodh: ["lodh", "star anise"],
  jeera: ["jeera", "cumin"],
  hing: ["hing"],
  namak: ["namak", "salt"],
  gud: ["gud", "jaggery"],
  chini: ["chini", "sugar"],
  sarson: ["sarson", "mustard"],
  til: ["til", "sesame"],
  methi: ["methi", "fenugreek"],
};

function tokenSatisfied(token, titleTokens) {
  if (tokenPresent(token, titleTokens)) return true;
  const alternatives = TYPE_SYNONYMS[token];
  if (!alternatives) return false;
  return alternatives.some((alt) => {
    if (alt.includes(" ")) {
      const parts = tokenize(alt);
      return parts.length > 1 && parts.every((part) => tokenPresent(part, titleTokens));
    }
    return tokenPresent(alt, titleTokens);
  });
}

/**
 * Score a retailer candidate against the catalogue product.
 * Returns null when the candidate must be rejected outright.
 */
export function scoreCandidate(target, candidate, { ignoreSize = false, relaxed = false } = {}) {
  const title = candidate.title || "";
  const titleTokens = tokenize(title);
  const titleContent = contentTokens(title);

  const brandTokens = contentTokens(target.brand).filter(
    (token) => token.length > 1 || /^\d+$/.test(token)
  );
  if (!brandTokens.length) return null;

  const brandHits = brandTokens.filter((token) => tokenPresent(token, titleTokens));
  if (brandHits.length !== brandTokens.length) return null; // different brand -> reject

  const typeTokens = contentTokens(target.productType).filter(
    (token) => !brandTokens.includes(token)
  );
  if (!typeTokens.length) return null;

  const satisfied = typeTokens.filter((token) => tokenSatisfied(token, titleTokens));
  const typeCoverage = satisfied.length / typeTokens.length;

  // Every distinctive (non-generic) token of the product type must be present,
  // otherwise this is a different product (e.g. wheat atta instead of ragi flour).
  const distinctive = typeTokens.filter((token) => !GENERIC_TYPE_TOKENS.has(token));
  const distinctiveMissed = distinctive.filter((token) => !tokenSatisfied(token, titleTokens));
  if (!relaxed) {
    if (distinctiveMissed.length) return null;
    if (typeCoverage < 0.75) return null;
  } else {
    if (typeCoverage < 0.5) return null;
  }

  // --- pack size -----------------------------------------------------------
  const signals = [];
  const titleSize = titleHasPackSize(title, target.size);
  if (titleSize !== null) signals.push(titleSize);
  const packSize = parsePackField(candidate.packText);
  if (packSize && !packSize.loose) {
    signals.push(sizesMatch(packSize, target.size));
  }

  let sizeState = "unknown";
  if (ignoreSize) {
    sizeState = "ignored";
  } else if (!target.size || target.size.loose) sizeState = "unknown";
  else if (signals.some(Boolean)) sizeState = "match";
  else if (signals.length) sizeState = "mismatch";

  if (sizeState === "mismatch") return null; // right product, wrong pack size -> reject

  const sizeScore = sizeState === "match" ? 1 : sizeState === "ignored" ? 0.5 : 0.4;
  const brandScore = brandHits.length / brandTokens.length;
  const titleCoverage = titleContent.length
    ? titleContent.filter((token) => tokenPresent(token, titleTokens)).length / titleContent.length
    : 0;

  const score = 0.4 * typeCoverage + 0.3 * sizeScore + 0.2 * brandScore + 0.1 * titleCoverage;
  const exact = sizeState === "match" && typeCoverage >= 0.75 && brandScore === 1;

  return {
    score: Number(score.toFixed(4)),
    typeCoverage: Number(typeCoverage.toFixed(3)),
    sizeState,
    sizeConfirmed: sizeState === "match",
    brandMatched: true,
    exact,
  };
}

/* ---------------------------------------------------------------- sources --- */

/** Shared cookie jar so retailers keep serving us instead of re-challenging. */
const cookieJars = new Map();

function cookieHeader(host) {
  const jar = cookieJars.get(host);
  if (!jar || !jar.size) return undefined;
  return [...jar].map(([key, value]) => `${key}=${value}`).join("; ");
}

function storeCookies(host, response) {
  let jar = cookieJars.get(host);
  if (!jar) {
    jar = new Map();
    cookieJars.set(host, jar);
  }
  const raw = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  for (const entry of raw) {
    const [pair] = entry.split(";");
    const index = pair.indexOf("=");
    if (index > 0) jar.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
  }
}

export async function fetchText(url, headers = {}, timeout = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const host = new URL(url).hostname;
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": UA,
        "accept-language": "en-IN,en;q=0.9",
        ...(cookieHeader(host) ? { cookie: cookieHeader(host) } : {}),
        ...headers,
      },
      signal: controller.signal,
      redirect: "follow",
    });
    storeCookies(host, response);
    return { status: response.status, text: await response.text() };
  } finally {
    clearTimeout(timer);
  }
}

/** Per-source concurrency limiter (retailers tolerate different request rates). */
const limiters = new Map();

export function createLimiter(concurrency) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= concurrency || !queue.length) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    fn().then(resolve, reject).finally(() => {
      active--;
      next();
    });
  };
  return (fn) =>
    new Promise((resolve, reject) => {
      const run = () =>
        Promise.resolve()
          .then(fn)
          .then(resolve, reject);
      queue.push({ fn: run, resolve, reject });
      next();
    });
}

export function sourceLimiter(sourceId, concurrency) {
  const key = `${sourceId}:${concurrency}`;
  if (!limiters.has(key)) limiters.set(key, createLimiter(concurrency));
  return limiters.get(key);
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value) {
  return decodeEntities(String(value || "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

/** Flipkart: search result cards carry the title, pack size, price and packshot. */
export async function searchFlipkart(query, { limit = 30 } = {}) {
  const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
  const { status, text } = await fetchText(url, { accept: "text/html,application/xhtml+xml" });
  if (status !== 200) return { candidates: [], site: "flipkart", error: `status ${status}` };

  const candidates = [];
  const seen = new Set();
  const chunks = text.split(/<div\s+data-id="/).slice(1);
  for (const chunk of chunks) {
    if (candidates.length >= limit) break;
    const imgTag = chunk.match(/<img\b[^>]*\bclass="UCc1lI"[^>]*>/)?.[0];
    if (!imgTag) continue;
    const src = imgTag.match(/\bsrc="([^"]+)"/)?.[1];
    const alt = decodeEntities(imgTag.match(/\balt="([^"]*)"/)?.[1] || "");
    if (!src || !src.startsWith("https://rukminim")) continue;
    if (seen.has(src)) continue;
    seen.add(src);

    const href = chunk.match(/<a\b[^>]*class="GnxRXv"[^>]*href="([^"]+)"/)?.[1];
    const productUrl = href ? `https://www.flipkart.com${href.split("?")[0]}` : null;
    const packText = decodeEntities(chunk.match(/<div\b[^>]*class="U_GKRr"[^>]*>([^<]*)</)?.[1] || "").trim();
    const priceText = decodeEntities(chunk.match(/<div\b[^>]*class="hZ3P6w"[^>]*>([^<]*)</)?.[1] || "").trim();
    candidates.push({
      title: alt,
      imageUrl: src.split("?")[0],
      productUrl,
      packText,
      priceText,
      site: "flipkart",
    });
  }
  return { candidates, site: "flipkart" };
}

/** Amazon India: each search-result block carries the packshot and its alt title. */
export async function searchAmazon(query, { limit = 30 } = {}) {
  const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
  const { status, text } = await fetchText(url, { accept: "text/html,application/xhtml+xml" });
  if (status !== 200) return { candidates: [], site: "amazon", error: `status ${status}` };
  if (/bm-verify=|Robot Check/i.test(text.slice(0, 4000))) {
    return { candidates: [], site: "amazon", error: "bot-challenge" };
  }

  const candidates = [];
  const seen = new Set();
  const blocks = text.split('data-component-type="s-search-result"').slice(1);
  for (const block of blocks) {
    if (candidates.length >= limit) break;
    const asin = block.match(/data-asin="([A-Z0-9]{10})"/)?.[1];
    const imgMatch = block.match(/<img\b[^>]*\bsrc="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
    if (!imgMatch) continue;
    const raw = imgMatch[1].replace(/&amp;/g, "&");
    // Upgrade the 320px catalogue thumbnail to the full-resolution asset.
    const imageUrl = raw.replace(/\._[A-Za-z0-9_]+_\./, ".");
    if (seen.has(imageUrl)) continue;

    const imgTags = block.match(/<img\b[^>]*>/g) || [];
    const imgTag =
      imgTags.find((tag) => tag.includes(imgMatch[1].replace(/&amp;/g, "&"))) ||
      imgTags.find((tag) => tag.includes("m.media-amazon.com/images/I/")) ||
      "";
    const alt = decodeEntities(imgTag.match(/\balt="([^"]*)"/)?.[1] || "");
    const heading = block.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/);
    const headingText = heading ? stripTags(heading[1]) : "";
    let title = alt && alt.length > 6 ? alt : headingText;
    title = title.replace(/^Sponsored Ad\s*[-–]\s*/i, "").trim();
    if (!title) continue;

    seen.add(imageUrl);
    const priceText = decodeEntities(
      block.match(/<span class="a-offscreen">([^<]*)<\/span>/)?.[1] ||
        block.match(/<span class="a-price-whole">([^<]*)<\/span>/)?.[1] ||
        ""
    ).trim();
    candidates.push({
      title,
      imageUrl,
      productUrl: asin ? `https://www.amazon.in/dp/${asin}` : null,
      packText: "",
      priceText,
      site: "amazon",
    });
  }
  return { candidates, site: "amazon" };
}

/** BigBasket public catalogue search (best effort). */
export async function searchBigBasket(query, { limit = 24 } = {}) {
  const url = `https://www.bigbasket.com/api/v1/products/?page=1&sort_by=popularity&filters=ps&q=${encodeURIComponent(query)}`;
  try {
    const { status, text } = await fetchText(url, { accept: "application/json" });
    if (status !== 200 || !text.trim().startsWith("{")) {
      return { candidates: [], site: "bigbasket", error: `status ${status}` };
    }
    const payload = JSON.parse(text);
    const products = payload?.products || payload?.data || [];
    const candidates = [];
    for (const product of products) {
      const image = product?.image_url || product?.image || product?.url;
      if (!image) continue;
      candidates.push({
        title: [product.brand, product.name, product.pack_size].filter(Boolean).join(" "),
        imageUrl: image,
        productUrl: product.url || null,
        site: "bigbasket",
      });
      if (candidates.length >= limit) break;
    }
    return { candidates, site: "bigbasket" };
  } catch (error) {
    return { candidates: [], site: "bigbasket", error: error.message };
  }
}

export const SEARCH_SOURCES = [
  { id: "flipkart", label: "Flipkart", limit: 4, run: searchFlipkart },
  { id: "amazon", label: "Amazon India", limit: 2, run: searchAmazon },
  { id: "bigbasket", label: "BigBasket", limit: 2, run: searchBigBasket },
];

/**
 * Every pack size a retailer product page states.
 *
 * Retailer detail pages put the pack size in a table ("Net Quantity",
 * "Pack Size", "Unit Count", "Selected Quantity", …) separated by markup, so
 * the page is flattened to text before the fields are read.
 */
const PAGE_SIZE_FIELDS = [
  /\bNet\s*Quantity\b\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:kg|kgs|g|gms|grams?|l|ltr|litres?|liters?|ml|milliliters?)\b)/i,
  /\bNet\s*Weight\b\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:kg|kgs|g|gms|grams?|l|ltr|litres?|liters?|ml|milliliters?)\b)/i,
  /\bUnit\s*Count\b\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:kg|kgs|g|gms|grams?|l|ltr|litres?|liters?|ml|milliliters?)\b)/i,
  /\bPack\s*Size\b\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:kg|kgs|g|gms|grams?|l|ltr|litres?|liters?|ml|milliliters?)\b)/i,
  /\bPackage\s*Dimensions\b[^.]{0,60}?(\d+(?:\.\d+)?\s*(?:kg|kgs|g|gms|grams?|l|ltr|litres?|liters?|ml|milliliters?)\b)/i,
  /\bSpecial\s*Size\b\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:kg|kgs|g|gms|grams?|l|ltr|litres?|liters?|ml|milliliters?)\b)/i,
  /\bSelected\s*Quantity\b\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:kg|kgs|g|gms|grams?|l|ltr|litres?|liters?|ml|milliliters?)\b)/i,
  /\bQuantity\b\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:kg|kgs|g|gms|grams?|l|ltr|litres?|liters?|ml|milliliters?)\b)/i,
  /\bSize\b\s*[:\-]?\s*(\d+(?:\.\d+)?\s*(?:kg|kgs|g|gms|grams?|l|ltr|litres?|liters?|ml|milliliters?)\b)/i,
];

export function extractPackSizes(html) {
  const text = String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ");

  const found = [];
  const push = (value) => {
    const parsed = parsePackSize(value);
    if (parsed && !parsed.loose) found.push(parsed);
  };

  for (const rx of PAGE_SIZE_FIELDS) {
    const match = text.match(rx);
    if (match) push(match[1]);
  }

  const headings = [
    html.match(/<span[^>]+id="productTitle"[^>]*>([\s\S]*?)<\/span>/)?.[1] || "",
    html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] || "",
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "",
  ];
  for (const heading of headings) {
    if (!heading) continue;
    const titleText = heading.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ");
    for (const match of titleText.matchAll(
      /(\d+(?:\.\d+)?)\s*(kg|kgs|g|gms|grams?|l|ltr|litres?|liters?|ml|milliliters?)\b/gi
    )) {
      push(match[0]);
    }
  }
  return found;
}

/**
 * Second-pass verification: open the retailer's product page and read the
 * authoritative pack size so a product whose thumbnail carries no size label
 * can still be confirmed.
 */
export async function verifyPackSizeOnPage(productUrl, target) {
  if (!productUrl || !target.size || target.size.loose) return null;
  let text = "";
  try {
    const response = await fetchText(productUrl, { accept: "text/html,application/xhtml+xml" });
    if (response.status !== 200) return null;
    text = response.text;
  } catch {
    return null;
  }

  const sizes = extractPackSizes(text);
  if (!sizes.length) return null;
  return sizes.some((size) => sizesMatch(size, target.size)) ? "match" : "mismatch";
}

/* --------------------------------------------------------------- download --- */

function sniffImageType(buffer) {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "png";
  if (buffer.slice(0, 4).toString("ascii") === "RIFF" && buffer.slice(8, 12).toString("ascii") === "WEBP") return "webp";
  if (buffer.slice(4, 8).toString("ascii") === "ftyp" && buffer.slice(8, 12).toString("ascii").includes("avif")) return "avif";
  return null;
}

/** Reads intrinsic pixel dimensions without pulling in an image library. */
export function imageDimensions(buffer, type) {
  try {
    if (type === "png") {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (type === "jpeg") {
      let offset = 2;
      while (offset < buffer.length - 9) {
        if (buffer[offset] !== 0xff) { offset++; continue; }
        const marker = buffer[offset + 1];
        const length = buffer.readUInt16BE(offset + 2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
        }
        offset += 2 + length;
      }
    }
    if (type === "webp") {
      const chunk = buffer.slice(12, 16).toString("ascii");
      if (chunk === "VP8X") return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
      if (chunk === "VP8 ") return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
      if (chunk === "VP8L") {
        const bits = buffer.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
    }
  } catch {
    /* fall through */
  }
  return { width: 0, height: 0 };
}

export async function downloadImage(url, { timeout = 30000, referer } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": UA,
        accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        ...(referer ? { referer } : {}),
      },
      signal: controller.signal,
      redirect: "follow",
    });
    if (!response.ok) return { ok: false, error: `http ${response.status}` };
    const type = response.headers.get("content-type") || "";
    if (!type.startsWith("image/")) return { ok: false, error: `content-type ${type || "unknown"}` };
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 2048) return { ok: false, error: "payload too small" };
    if (buffer.length > 12 * 1024 * 1024) return { ok: false, error: "payload too large" };
    const sniffed = sniffImageType(buffer);
    if (!sniffed) return { ok: false, error: "not a recognised image" };
    const { width, height } = imageDimensions(buffer, sniffed);
    if (width < 180 || height < 180) return { ok: false, error: `resolution too low (${width}x${height})` };
    return { ok: true, buffer, type: sniffed, width, height, bytes: buffer.length };
  } catch (error) {
    return { ok: false, error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------- cloudinary --- */

export async function uploadToCloudinary(buffer, folder, filename, { overwrite = false } = {}) {
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        public_id: filename,
        overwrite,
        unique_filename: !overwrite,
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, response) => (error ? reject(error) : resolve(response))
    );
    stream.end(buffer);
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    format: result.format,
  };
}

export function contentHash(value) {
  return createHash("sha1").update(String(value)).digest("hex").slice(0, 10);
}

/* ------------------------------------------------------------- generation --- */

const POLLINATIONS = "https://image.pollinations.ai/prompt";

/**
 * Generates a photorealistic packshot for generic / unbranded grocery items.
 * Returns a buffer or null. Never used for branded products.
 *
 * The public endpoint allows one free render per 45 seconds and answers with
 * HTTP 402 while the quota is exhausted, so callers must pace their requests.
 */
export async function generateImage(prompt, { width = 1024, height = 1024, seed, timeout = 120000 } = {}) {
  const params = new URLSearchParams({ width: String(width), height: String(height), nologo: "true" });
  if (seed != null) params.set("seed", String(seed));
  params.set("model", "flux");
  const url = `${POLLINATIONS}/${encodeURIComponent(prompt)}?${params.toString()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      headers: { "user-agent": UA, accept: "image/*" },
      signal: controller.signal,
    });
    if (response.status === 402) return { ok: false, error: "rate-limited", retryAfterMs: 46000 };
    if (!response.ok) return { ok: false, error: `http ${response.status}` };
    const buffer = Buffer.from(await response.arrayBuffer());
    const type = sniffImageType(buffer);
    if (!type) return { ok: false, error: "generated payload is not an image" };
    if (buffer.length < 2048) return { ok: false, error: "generated payload too small" };
    const { width: w, height: h } = imageDimensions(buffer, type);
    return { ok: true, buffer, type, width: w, height: h, bytes: buffer.length, prompt, seed };
  } catch (error) {
    return { ok: false, error: error.message };
  } finally {
    clearTimeout(timer);
  }
}

/** Pollinations stamps its mark in the bottom-right corner; crop it away. */
export async function cropWatermark(buffer, { bottomPercent = 0.1 } = {}) {
  const probe = sniffImageType(buffer);
  if (!probe) return buffer;
  const { width, height } = imageDimensions(buffer, probe);
  if (!width || !height) return buffer;
  const cropBottom = Math.round(height * bottomPercent);
  return { buffer, width, height, crop: { top: 0, left: 0, width, height: height - cropBottom } };
}

/* ------------------------------------------------------------------ misc --- */

/**
 * Recovers the brand / product type / pack size of a catalogue product.
 * Imported grocery rows carry "<product type> by <brand>." in the description
 * and "<brand> <product type> - <pack size>" in the name.
 */
export function describeProduct(product) {
  const rawDescription = String(product.description || "");
  const name = String(product.name || "");
  const unit = String(product.unit || "").trim();

  let brand = "";
  let productType = "";

  // Imported rows read "<product type> by <brand>. Price pending verification."
  const description = rawDescription
    .replace(/\.\s*Price pending verification\.?\s*$/i, "")
    .replace(/\s*Price pending verification\.?$/i, "")
    .trim();
  const byMatch = description.match(/^(.+?)\s+by\s+(.+?)\s*$/);
  if (byMatch) {
    productType = byMatch[1].trim();
    brand = byMatch[2].trim().replace(/\s*\.$/, "");
  }

  if (!brand) {
    // Fall back to "<brand> <product type> - <pack size>" used by the catalogue import.
    const head = name.split(/\s+-\s+/)[0].trim();
    if (head !== name) {
      const tokens = tokenize(head);
      const categoryTag = (product.tags || [])[1];
      const brandTag = (product.tags || []).find(
        (tag) =>
          tag &&
          tag !== "grocery" &&
          tag !== categoryTag &&
          !contentTokens(tag).every((token) => tokens.includes(token)) &&
          tokens.some((token) => contentTokens(tag).includes(token))
      );
      if (brandTag) brand = titleCase(brandTag.replace(/-/g, " "));
    }
  }

  if (!productType) {
    const head = name.split(/\s+-\s+/)[0].trim();
    productType = head;
    if (brand && productType.toLowerCase().startsWith(brand.toLowerCase())) {
      productType = productType.slice(brand.length).trim();
    }
  }

  const size = parsePackSize(unit);
  const query = [brand, productType, unit].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

  return {
    brand,
    productType: productType || name,
    size,
    unit,
    query,
    isGeneric: !brand,
  };
}

export function titleCase(value) {
  return String(value || "")
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
