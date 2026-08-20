import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const manifestPath = resolve(root, "PUBLIC-MANIFEST.sha256");
const excludedDirectories = new Set([
  ".git",
  ".playwright-output",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results"
]);
const excludedFiles = new Set([".DS_Store", "PUBLIC-MANIFEST.sha256", "Thumbs.db"]);
const publicFiles = [
  ".github/workflows/ci.yml",
  ".gitignore",
  ".nojekyll",
  "ASSET-LICENSES.md",
  "assets/alba-pendant.jpg",
  "assets/kinu-tableware.jpg",
  "assets/linde-console.jpg",
  "assets/mara-knit.jpg",
  "CHANGELOG.md",
  "demo-data/legacy-catalog.json",
  "favicon.svg",
  "index.html",
  "package.json",
  "playwright.config.mjs",
  "pnpm-lock.yaml",
  "PORTFOLIO-REVIEW-LICENSE.md",
  "README.md",
  "screenshots/web-rescue-commerce-mobile.png",
  "screenshots/web-rescue-commerce-wide.png",
  "scripts/capture-screenshots.mjs",
  "scripts/public-manifest.mjs",
  "scripts/serve.mjs",
  "src/app.mjs",
  "src/domain.mjs",
  "styles.css",
  "tests/browser/storefront.spec.mjs",
  "tests/domain.test.mjs",
  "tests/public-links.test.mjs"
];

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    if (entry.isFile() && (excludedFiles.has(entry.name) || entry.name.endsWith(".log"))) continue;

    const absolute = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(absolute));
    else if (entry.isFile()) files.push(absolute);
  }

  return files;
}

async function buildManifest() {
  const files = (await listFiles(root))
    .map((absolute) => ({ absolute, path: relative(root, absolute).replaceAll("\\", "/") }))
    .filter(({ path }) => path !== ".env" && !path.startsWith(".env."))
    .sort((a, b) => a.path.localeCompare(b.path, "en"));
  const discoveredPaths = files.map(({ path }) => path);
  const allowedPaths = [...publicFiles].sort((a, b) => a.localeCompare(b, "en"));
  const missing = allowedPaths.filter((path) => !discoveredPaths.includes(path));
  const unexpected = discoveredPaths.filter((path) => !allowedPaths.includes(path));

  if (missing.length || unexpected.length) {
    const details = [
      missing.length ? `Missing: ${missing.join(", ")}` : "",
      unexpected.length ? `Unexpected: ${unexpected.join(", ")}` : ""
    ].filter(Boolean).join("\n");
    throw new Error(`Public file allowlist does not match the package.\n${details}`);
  }

  const lines = [];

  for (const file of files) {
    const hash = createHash("sha256").update(await readFile(file.absolute)).digest("hex");
    lines.push(`${hash}  ${file.path}`);
  }

  return `${lines.join("\n")}\n`;
}

const expected = await buildManifest();
if (process.argv.includes("--write")) {
  await writeFile(manifestPath, expected, "utf8");
  console.log(`Updated ${relative(root, manifestPath)} with ${expected.trimEnd().split("\n").length} entries.`);
} else if (process.argv.includes("--check")) {
  const actual = await readFile(manifestPath, "utf8");
  if (actual.replaceAll("\r\n", "\n") !== expected) {
    console.error("PUBLIC-MANIFEST.sha256 is stale. Run: pnpm run manifest:update");
    process.exitCode = 1;
  } else {
    console.log("PUBLIC-MANIFEST.sha256 matches the public package.");
  }
} else {
  process.stdout.write(expected);
}
