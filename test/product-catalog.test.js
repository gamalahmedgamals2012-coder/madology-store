const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getProducts,
  findProductById,
  filterProducts,
  getFilterOptions,
  getRelatedProducts
} = require("../src/data/products");

test("product catalog exposes every storefront product with required metadata", () => {
  const products = getProducts();

  assert.ok(products.length >= 20);
  products.forEach((product) => {
    assert.ok(product.id);
    assert.ok(product.displayName);
    assert.ok(product.image.startsWith("/ascets/clothes/"));
    assert.ok(product.price > 0);
    assert.ok(product.category);
    assert.ok(product.type);
    assert.ok(product.colors.length > 0);
    assert.ok(product.sizes.length > 0);
  });
});

test("filterProducts supports search, category, color, size, and price filters", () => {
  const matches = filterProducts({
    q: "football",
    category: "limited",
    color: "black",
    size: "L",
    maxPrice: 1300
  });

  assert.ok(matches.length > 0);
  matches.forEach((product) => {
    assert.equal(product.category, "limited");
    assert.ok(product.colors.includes("Black"));
    assert.ok(product.sizes.includes("L"));
    assert.ok(product.price <= 1300);
  });
});

test("getFilterOptions returns safe selectable filter values", () => {
  const filters = getFilterOptions();

  assert.ok(filters.categories.includes("essentials"));
  assert.ok(filters.types.includes("hoodie"));
  assert.ok(filters.colors.includes("Black"));
  assert.ok(filters.sizes.includes("M"));
  assert.equal(filters.price.min, 650);
  assert.equal(filters.price.max, 1300);
});

test("getRelatedProducts never returns the source product", () => {
  const product = findProductById("air-jordan");
  const related = getRelatedProducts(product.id, 4);

  assert.equal(related.length, 4);
  assert.equal(related.some((entry) => entry.id === product.id), false);
});
