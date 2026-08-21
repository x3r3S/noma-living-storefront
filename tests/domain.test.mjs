import test from "node:test";
import assert from "node:assert/strict";
import { auditCatalog, buildRedirectMap, cartSummary, filterProducts, safeSlug, updateCart } from "../src/domain.mjs";

const fixture = [
  { sku: "A-1", name: "Desk Lamp", category: "Lighting", price: "45", slug: "Desk Lamp", image: "lamp" },
  { sku: "B-2", name: "Side Table", category: "Furniture", price: 90, slug: "side-table", image: "table" }
];

test("normalizes a valid legacy catalog", () => {
  const result = auditCatalog(fixture);
  assert.equal(result.summary.ready, 2);
  assert.equal(result.summary.errors, 0);
  assert.equal(result.products[0].slug, "desk-lamp");
  assert.equal(result.externalWrites, false);
});

test("reports duplicate SKU, slug and invalid price", () => {
  const result = auditCatalog([...fixture, { sku: "A-1", name: "Broken", price: -1, slug: "side-table" }]);
  assert.ok(result.findings.some((item) => item.code === "duplicate_sku"));
  assert.ok(result.findings.some((item) => item.code === "duplicate_slug"));
  assert.ok(result.findings.some((item) => item.code === "invalid_price"));
  assert.equal(result.products[2].available, false);
  assert.equal(result.summary.ready, 2);
});

test("redirect map permits only local safe paths", () => {
  const products = auditCatalog(fixture).products;
  const redirects = buildRedirectMap([{ from: "/old/lamp", sku: "A-1" }, { from: "//evil.test/x", sku: "B-2" }, { from: "/../private-file", sku: "B-2" }], products);
  assert.deepEqual(redirects.map((item) => item.status), [301, 0, 0]);
  assert.equal(redirects[0].to, "/products/desk-lamp");
});

test("filters products and maintains a sandbox cart", () => {
  const products = auditCatalog(fixture).products;
  assert.equal(filterProducts(products, { query: "lamp" }).length, 1);
  const cart = updateCart({}, products[0], 2);
  assert.deepEqual(cartSummary(cart, products), { items: 2, total: 90 });
  assert.equal(safeSlug("  Über table / new  "), "uber-table-new");
});

test("duplicate SKU is blocked even when its price is valid", () => {
  const result = auditCatalog([...fixture, { ...fixture[0], name: "Duplicate Lamp", price: 55 }]);
  assert.equal(result.products[2].available, false);
  assert.equal(filterProducts(result.products).length, 2);
});

test("duplicate legacy paths do not create ambiguous redirects", () => {
  const products = auditCatalog(fixture).products;
  const redirects = buildRedirectMap([{ from: "/old", sku: "A-1" }, { from: "/old", sku: "B-2" }], products);
  assert.deepEqual(redirects.map((item) => item.valid), [true, false]);
});

test("a blocked duplicate SKU cannot replace the approved redirect target", () => {
  const products = auditCatalog([
    ...fixture,
    { ...fixture[0], name: "Blocked duplicate", price: 55, slug: "blocked-duplicate" }
  ]).products;

  const [redirect] = buildRedirectMap([{ from: "/old/lamp", sku: "A-1" }], products);
  assert.equal(redirect.valid, true);
  assert.equal(redirect.status, 301);
  assert.equal(redirect.to, "/products/desk-lamp");
});

test("redirects fail closed if callers provide two approved targets for one SKU", () => {
  const [redirect] = buildRedirectMap(
    [{ from: "/old/lamp", sku: "A-1" }],
    [
      { sku: "A-1", slug: "desk-lamp", available: true },
      { sku: "A-1", slug: "other-lamp", available: true }
    ]
  );

  assert.equal(redirect.valid, false);
  assert.equal(redirect.status, 0);
  assert.equal(redirect.to, "");
});
