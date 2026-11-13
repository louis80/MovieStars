import { expect, test } from "@playwright/test";

test("first launch shows the Welcome screen on a phone", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /put a name to every face/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start" })).toBeVisible();
});
