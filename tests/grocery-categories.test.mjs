import test from "node:test";
import assert from "node:assert/strict";
import { GROCERY_CATEGORIES, OTHER_GROCERY, groceryGroup } from "../lib/grocery-categories.ts";

test("all 17 categories have unique canonical URLs and existing catalogue tags", () => {
  assert.equal(GROCERY_CATEGORIES.length, 17);
  assert.equal(new Set(GROCERY_CATEGORIES.map((category) => category.slug)).size, 17);
  assert.equal(new Set(GROCERY_CATEGORIES.map((category) => category.tag)).size, 17);
  for (const category of GROCERY_CATEGORIES) {
    assert.equal(groceryGroup(["grocery", category.tag, "brand"]), category.tag);
  }
});
test("legacy tags map to the matching group and explicit mappings take precedence", () => {
  assert.equal(groceryGroup(["grocery", "rice"]), "rice-rice-products");
  assert.equal(groceryGroup(["grocery", "dal"]), "dals-pulses");
  assert.equal(groceryGroup(["tea", "spices-masalas"]), "spices-masalas");
});
test("new and unclassified records are retained without guessing a category", () => {
  assert.equal(groceryGroup(), OTHER_GROCERY.tag);
  assert.equal(groceryGroup(["household"]), OTHER_GROCERY.tag);
});
