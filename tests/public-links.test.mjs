import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the live storefront exposes its source and CI history", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /href="https:\/\/github\.com\/x3r3S\/noma-living-storefront"/);
  assert.match(html, /href="https:\/\/github\.com\/x3r3S\/noma-living-storefront\/actions"/);
  assert.match(html, /target="_blank" rel="noreferrer">Source<\/a>/);
  assert.match(html, /target="_blank" rel="noreferrer">CI<\/a>/);
});

test("the bag states its available functionality", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /Shipping and checkout are not available\./);
  assert.doesNotMatch(html, /Delivery calculated at checkout\./);
});

test("the live storefront exposes a main-content bypass target", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /<a class="skip-link" href="#main">Skip to main content<\/a>/);
  assert.match(html, /<main id="main" tabindex="-1">/);
});
