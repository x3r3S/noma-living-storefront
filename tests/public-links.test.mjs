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
