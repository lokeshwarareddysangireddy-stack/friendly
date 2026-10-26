import assert from "node:assert/strict";
import test from "node:test";
import { resolveCoupon } from "../lib/cart/coupons.ts";

const config = JSON.stringify([
  { code: "SAVE50", amount: 50, minOrder: 500, expiresAt: "2027-01-01T00:00:00Z" },
]);
const now = Date.parse("2026-10-26T00:00:00Z");

test("normalizes a configured code and converts rupees to integer paise", () => {
  assert.deepEqual(resolveCoupon(" save50 ", 50000, config, now), {
    code: "SAVE50", discount: 5000, error: null,
  });
});

test("rejects unknown, expired and below-minimum coupons without a discount", () => {
  for (const result of [
    resolveCoupon("FORGED", 50000, config, now),
    resolveCoupon("SAVE50", 49999, config, now),
    resolveCoupon("SAVE50", 50000, config, Date.parse("2027-01-01T00:00:00Z")),
  ]) {
    assert.equal(result.discount, 0);
    assert.equal(result.code, null);
    assert.ok(result.error);
  }
});

test("no coupon leaves the cart unchanged, including when config is unavailable", () => {
  assert.deepEqual(resolveCoupon("", 50000, "invalid"), {
    code: null, discount: 0, error: null,
  });
});

test("invalid or absent configuration never grants a discount", () => {
  for (const value of ["invalid", "[]", '[{"code":"SAVE50","amount":-50}]']) {
    const result = resolveCoupon("SAVE50", 50000, value, now);
    assert.equal(result.discount, 0);
    assert.ok(result.error);
  }
});

test("caps a large discount to preserve a positive gateway payment", () => {
  const result = resolveCoupon("BIG", 2500, '[{"code":"BIG","amount":100}]');
  assert.equal(result.discount, 2400);
  assert.equal(result.error, null);
  assert.ok(resolveCoupon("BIG", 100, '[{"code":"BIG","amount":100}]').error);
});
