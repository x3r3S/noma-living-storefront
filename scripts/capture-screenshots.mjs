import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = 4174;
const baseUrl = `http://127.0.0.1:${port}/`;
const outputDirectory = resolve(root, "screenshots");
const captures = [
  { file: "web-rescue-commerce-wide.png", width: 1440, height: 900 },
  { file: "web-rescue-commerce-mobile.png", width: 390, height: 844 }
];

async function waitForServer() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`Timed out waiting for ${baseUrl}`);
}

await mkdir(outputDirectory, { recursive: true });
const server = spawn(process.execPath, [resolve(root, "scripts/serve.mjs")], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"]
});
let browser;

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });

  for (const capture of captures) {
    const context = await browser.newContext({ viewport: { width: capture.width, height: capture.height } });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.waitForFunction(() => [...document.querySelectorAll(".hero img")].every((image) => image.complete));
    await page.screenshot({ path: resolve(outputDirectory, capture.file), fullPage: false });
    await context.close();
    console.log(`Captured ${capture.file} at ${capture.width}x${capture.height}.`);
  }
} finally {
  if (browser) await browser.close();
  server.kill();
}
