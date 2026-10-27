// Run against a production build. Playwright may be supplied from an external install.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import mongoose from "mongoose";
import { GROCERY_CATEGORIES, GROCERY_SLUG, OTHER_GROCERY, groceryGroup } from "../lib/grocery-categories.ts";

const require = createRequire(process.env.PLAYWRIGHT_PACKAGE || import.meta.url);
const { chromium } = require("playwright");
const port = 3217;
const origin = `http://localhost:${port}`;
const base = `/services/${GROCERY_SLUG}`;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], { stdio: "pipe" });
server.stderr.on("data", (data) => process.stderr.write(data));
server.stdout.on("data", () => {});
let browser;
try {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(`${origin}/api/payments/verify`)).status) break; } catch { /* waiting */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  const env = readFileSync(".env.local", "utf8");
  const uri = env.match(/^MONGODB_URI\s*=\s*(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, "");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const collection = mongoose.connection.db.collection("products");
  const all = await collection.find({ categorySlug: GROCERY_SLUG }).toArray();
  const active = all.filter((product) => product.active);
  const before = JSON.stringify(all);
  browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "chrome", headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const [width, columns] of [[390, 2], [768, 3], [1440, 5]]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(origin + base);
    await page.waitForLoadState("networkidle");
    const grid = page.locator('section[aria-labelledby="grocery-categories"] > div.grid');
    assert.equal(await grid.locator("a").count(), 18);
    assert.equal(await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length), columns);
    assert.equal(await page.locator("article").count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    console.log(`Landing verified at ${width}px: ${columns} columns; no products rendered.`);
  }
  let seen = 0;
  for (const group of [...GROCERY_CATEGORIES, OTHER_GROCERY]) {
    const expected = active.filter((product) => groceryGroup(product.tags) === group.tag);
    const found = new Set();
    for (let number = 1; number <= Math.max(1, Math.ceil(expected.length / 24)); number++) {
      await page.goto(`${origin}${base}/${group.slug}?page=${number}`);
      assert.equal(await page.locator("h1").innerText(), group.name);
      const links = await page.locator("article a[href^='/product/']").evaluateAll((elements) => elements.map((element) => element.getAttribute("href")));
      for (const link of links) {
        assert.ok(expected.some((product) => link === `/product/${product.slug}`), `Unrelated product: ${link}`);
        assert.ok(!found.has(link), `Repeated product: ${link}`);
        found.add(link);
      }
      for (const image of await page.locator("article img").all()) {
        await image.scrollIntoViewIfNeeded();
        await image.evaluate((element) => element.decode());
        assert.equal(await image.evaluate((element) => getComputedStyle(element).objectFit), "contain");
      }
    }
    assert.equal(found.size, expected.length);
    seen += found.size;
    console.log(`${group.name}: ${found.size}/${expected.length} products verified.`);
  }
  assert.equal(seen, active.length);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}${base}/rice-and-rice-products`);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.getByRole("button", { name: "Add to Cart", exact: true }).first().click();
  await page.getByRole("button", { name: "Increase quantity" }).first().click();
  await page.getByRole("button", { name: "Decrease quantity" }).first().click();
  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem("fb_cart_v1")));
  assert.equal(cart[0].quantity, 1);
  await page.goto(`${origin}${base}/dals-and-pulses`);
  await page.goBack();
  await page.reload();
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("fb_cart_v1"))), cart);
  await page.goto(`${origin}${base}/rice-and-rice-products?q=Toor`);
  assert.equal(await page.locator("article").count(), 0);
  await page.goto(`${origin}${base}?q=Toor`);
  assert.ok(await page.locator("article").count() > 0);
  await page.goto(`${origin}${base}/rice-and-rice-products?sort=price-asc`);
  const names = await page.locator("article h3").allTextContents();
  const prices = names.map((name) => active.find((product) => product.name === name).price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  await page.goto(`${origin}/checkout`);
  await page.getByLabel("Full name", { exact: true }).waitFor();
  assert.equal(await page.locator("text=Order summary").count(), 1);
  const quote = await page.request.post(`${origin}/api/checkout/quote`, { data: { items: cart.map(({ productId, quantity }) => ({ productId, quantity })) } });
  assert.equal(quote.status(), 200);
  const json = await quote.json();
  assert.equal(json.data.priced.subtotal, cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
  assert.equal(JSON.stringify(await collection.find({ categorySlug: GROCERY_SLUG }).toArray()), before);
  assert.deepEqual(errors, []);
  console.log(`PASS: all ${seen} active products, category isolation, images, responsive layout, cart persistence, checkout quote; all ${all.length} database records unchanged.`);
} finally {
  await browser?.close();
  await mongoose.disconnect();
  server.kill();
}
