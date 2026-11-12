import { expect, test } from "@playwright/test";

test("app loads on a phone-sized screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "MovieStars" })).toBeVisible();
});
