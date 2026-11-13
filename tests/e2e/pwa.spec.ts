import { expect, test } from "@playwright/test";

// AC10: the app can be installed to a phone's home screen and opens full-screen.
test("has an installable manifest with home-screen icons (AC10)", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();

  const manifestUrl = new URL(href ?? "", page.url());
  const manifest = await (await request.get(manifestUrl.href)).json();
  expect(manifest).toMatchObject({
    name: "MovieStars",
    display: "standalone",
    start_url: "./",
  });
  const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);

  for (const icon of manifest.icons) {
    expect((await request.get(new URL(icon.src, manifestUrl).href)).status()).toBe(200);
  }
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
});

// AC9: progress survives closing and reopening, and the app works offline for people already cached.
test("keeps progress and works offline once loaded (AC9)", async ({ page, context }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /tap films i've seen/i }).click();
  await page.getByRole("button", { name: /Anatomy of a Fall/ }).click();
  await page.getByRole("button", { name: "Add 1 film" }).click();
  await expect(page.getByRole("heading", { name: "Ready for today's faces?" })).toBeVisible();

  // Wait until the service worker controls the page, then go offline and reopen.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Ready for today's faces?" })).toBeVisible();
  await expect(page.getByRole("link", { name: /6 people/ })).toBeVisible();

  await page.getByRole("link", { name: /Start/ }).click();
  await expect(page.getByRole("progressbar", { name: "Session progress" })).toBeVisible();
  await context.setOffline(false);
});
