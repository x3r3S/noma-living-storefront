import { expect, test } from "@playwright/test";

const sourceUrl = "https://github.com/x3r3S/noma-living-storefront";
const ciUrl = `${sourceUrl}/actions`;
const runtimeErrorsByPage = new WeakMap();

test.beforeEach(async ({ page }) => {
  const runtimeErrors = [];
  runtimeErrorsByPage.set(page, runtimeErrors);
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => runtimeErrors.push(`page: ${error.message}`));

  await page.goto("/", { waitUntil: "networkidle" });
});

test.afterEach(async ({ page }) => {
  const runtimeErrors = runtimeErrorsByPage.get(page) ?? [];
  expect(runtimeErrors, runtimeErrors.join("\n")).toEqual([]);
});

test("renders the truthful project boundary without horizontal overflow", async ({ page }) => {
  const boundary = page.getByRole("note", { name: "Project boundary" });

  await expect(boundary).toBeVisible();
  await expect(boundary.getByText("Personal Demonstration Project", { exact: true })).toBeVisible();
  await expect(boundary.getByText("Fictional product records · No checkout", { exact: true })).toBeVisible();

  const overflow = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    root: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));
  expect(overflow.root).toBeLessThanOrEqual(overflow.viewport);
  expect(overflow.body).toBeLessThanOrEqual(overflow.viewport);
});

test("skip link is first, visible on focus and moves focus to main", async ({ page }) => {
  const skipLink = page.getByRole("link", { name: "Skip to main content" });

  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await expect(skipLink).toHaveCSS("outline-style", "solid");
  await expect(skipLink).toHaveCSS("outline-width", "3px");

  const box = await skipLink.boundingBox();
  expect(box).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize().height);

  await page.keyboard.press("Enter");
  await expect(page.locator("main#main")).toBeFocused();
  await expect(page).toHaveURL(/#main$/);
});

test("source evidence links are exact, keyboard-visible and at least 44 by 44", async ({ page }) => {
  const source = page.getByRole("link", { name: "Source", exact: true });
  const ci = page.getByRole("link", { name: "CI", exact: true });

  for (const [link, href] of [[source, sourceUrl], [ci, ciUrl]]) {
    await expect(link).toHaveAttribute("href", href);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer");

    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);

    await link.focus();
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS("outline-style", "solid");
    await expect(link).toHaveCSS("outline-width", "3px");
  }
});
