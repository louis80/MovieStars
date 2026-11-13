// End-to-end acceptance suite: one test per acceptance criterion in spec/spec.md (AC1–AC11),
// run in a phone-sized browser on the built app with its sample data (TMDB is never called).
// AC9 and AC10 (offline, installable) live in pwa.spec.ts because they need a service worker.
import { expect, test, type Page } from "@playwright/test";

const DAY = 24 * 60 * 60 * 1000;
const START = new Date("2026-11-12T10:00:00");

async function firstLaunch(page: Page) {
  await page.clock.install({ time: START });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /put a name to every face/i })).toBeVisible();
}

/** Welcome → films → tap the given titles → Add. */
async function addFilmsFromWelcome(page: Page, titles: RegExp[]) {
  await page.getByRole("button", { name: /tap films i've seen/i }).click();
  for (const title of titles) await page.getByRole("button", { name: title }).click();
  await page
    .getByRole("button", { name: `Add ${titles.length} film${titles.length > 1 ? "s" : ""}` })
    .click();
  await expect(page.getByRole("heading", { name: "Ready for today's faces?" })).toBeVisible();
}

/** Start with nobody, then add one person through My people search. */
async function startWithOnePerson(page: Page, search: string, name: string) {
  await page.getByRole("button", { name: /tap films i've seen/i }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByRole("link", { name: "My people", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search a name" }).fill(search);
  await page.getByRole("region", { name: "Not in your list yet" }).getByText(name).click();
  await page.getByRole("button", { name: "Add to my list" }).click();
  await expect(page.getByText("In your list · Level 1 · Recognise")).toBeVisible();
}

/**
 * Play today's session with flip cards (the setups below keep too few people cached for
 * choice cards). `grade` decides the answer for each name; by default everyone is "Knew it".
 */
async function playSession(page: Page, grade: (name: string) => "good" | "again" = () => "good") {
  // Leave the session route first so a new session is prepared (same-URL visits do not reload).
  await page.goto("/#/");
  await page.goto("/#/session");
  for (let i = 0; i < 40; i++) {
    if (await page.getByRole("heading", { name: "Session done" }).isVisible()) return;
    if (await page.getByRole("heading", { name: "Nothing to review right now" }).isVisible())
      return;
    const show = page.getByRole("button", { name: /Show name/ });
    if (await show.isVisible()) {
      await show.click();
      const name = await page.locator(".answer-name").innerText();
      const rate = grade(name) === "good" ? /Knew it/ : /Didn't/;
      await page.getByRole("button", { name: rate }).click();
      continue;
    }
    await page.waitForTimeout(50);
  }
  throw new Error("Session did not finish");
}

async function onDay(page: Page, day: number) {
  await page.clock.setFixedTime(new Date(START.getTime() + day * DAY));
}

async function levelOf(page: Page, name: string) {
  await page.goto("/#/people");
  await page.getByText(name, { exact: true }).click();
  return page.locator(".status-line").innerText();
}

test("AC1: a first-time user starts a session within 2 taps", async ({ page }) => {
  await firstLaunch(page);
  await page.getByRole("button", { name: "Start" }).click(); // tap 1
  await expect(page.getByRole("progressbar", { name: "Session progress" })).toBeVisible();
});

test("AC2: tapping 3 films adds each director and top 5 cast, without duplicates", async ({
  page,
}) => {
  await firstLaunch(page);
  await addFilmsFromWelcome(page, [/Anatomy of a Fall/, /Oppenheimer/, /Inception/]);
  // Anatomy: Triet + 5. Inception: Nolan + 5. Oppenheimer: Nolan again (once) + 5. Total 17.
  await page.getByRole("link", { name: "My people", exact: true }).click();
  await expect(page.getByText("Recognise · 17")).toBeVisible();
  await expect(page.getByText("Christopher Nolan", { exact: true })).toHaveCount(1);
});

test("AC3: every answer shows the name, a photo and a memory anchor", async ({ page }) => {
  await firstLaunch(page);
  await addFilmsFromWelcome(page, [/Anatomy of a Fall/, /Inception/]);
  await page.getByRole("link", { name: /Start/ }).click();
  await page.locator(".choice").first().click();

  await expect(page.locator(".answer-name")).toBeVisible();
  await expect(page.locator(".photo")).toBeVisible();
  const anchor = page.getByRole("region", { name: "Remember them by" });
  await expect(anchor).toBeVisible();
  // Everyone here came from a film the user marked as seen, so that film is the anchor.
  await expect(anchor).toContainText(/You saw (her|him|them) in (Anatomy of a Fall|Inception)/);
});

test("AC4: two right answers on different days move up one level; a miss moves down", async ({
  page,
}) => {
  await firstLaunch(page);
  await startWithOnePerson(page, "streep", "Meryl Streep");

  await playSession(page); // day 1: first right answer
  expect(await levelOf(page, "Meryl Streep")).toContain("Level 1");

  await onDay(page, 30);
  await playSession(page); // another day: second right answer in a row
  expect(await levelOf(page, "Meryl Streep")).toContain("Level 2");

  await onDay(page, 400);
  await playSession(page, (name) => (name === "Meryl Streep" ? "again" : "good"));
  expect(await levelOf(page, "Meryl Streep")).toContain("Level 1");
});

test("AC5: level-2 choices come from the same country and decade (rule-level)", async () => {
  // Choosing look-alikes depends on who is cached and on randomness, so it is verified where
  // it can be controlled: src/learning/cards.test.ts, "distractors (AC5)". This entry keeps
  // the suite's list complete and points to that evidence.
  test.info().annotations.push({
    type: "covered-by",
    description: "src/learning/cards.test.ts › distractors (AC5)",
  });
});

test("AC6: flip takes 2 taps; typing accepts the family name with a typo", async ({ page }) => {
  await firstLaunch(page);
  await startWithOnePerson(page, "streep", "Meryl Streep");

  // Two right answers per level, on days far enough apart for every review to be due,
  // take her to level 3 (Recall). Each flip answer takes 2 taps: Show name, Knew it.
  for (const day of [0, 30, 120, 400]) {
    await onDay(page, day);
    await playSession(page);
  }
  expect(await levelOf(page, "Meryl Streep")).toContain("Level 3");

  await page.goto("/#/about");
  await page.getByRole("radio", { name: /Typing/ }).check();
  await onDay(page, 1500);
  await page.goto("/#/session");
  for (let i = 0; i < 10; i++) {
    const box = page.getByRole("textbox");
    await expect(box).toBeVisible();
    const label = (await box.getAttribute("id"))
      ? await page.locator("label[for=recall-typing]").innerText()
      : "";
    if (label.endsWith("starts with S")) {
      await box.fill("Strep"); // one letter missing
      await page.keyboard.press("Enter");
      await expect(page.getByText("Correct")).toBeVisible();
      await expect(page.locator(".answer-name")).toHaveText("Meryl Streep");
      return;
    }
    await box.fill("x");
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: /Continue/ }).click();
  }
  throw new Error("Meryl Streep's card never came up");
});

test("AC7: after Didn't, the person comes back in the same session", async ({ page }) => {
  await firstLaunch(page);
  await startWithOnePerson(page, "streep", "Meryl Streep");
  await page.goto("/#/session");

  const total = async () => Number((await page.locator(".session-top").innerText()).split("/")[1]);
  await expect(page.locator(".session-top")).toBeVisible();
  const before = await total();
  await page
    .getByRole("button", { name: /Show name/ })
    .first()
    .click();
  await page.getByRole("button", { name: /Didn't/ }).click();
  await expect.poll(total).toBe(before + 1);
});

test("AC8: Don't show again removes a person for good", async ({ page }) => {
  await firstLaunch(page);
  await addFilmsFromWelcome(page, [/Inception/]);
  await startHiddenCheck(page);
});

async function startHiddenCheck(page: Page) {
  // Add Sandra Hüller by hand, hide her, then mark a film she is in as seen.
  await page.getByRole("link", { name: "My people", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search a name" }).fill("huller");
  await page
    .getByRole("region", { name: "Not in your list yet" })
    .getByText("Sandra Hüller")
    .click();
  await page.getByRole("button", { name: "Add to my list" }).click();
  await page.getByRole("button", { name: "Don't show again" }).click();
  await expect(page.getByRole("heading", { name: "My people" })).toBeVisible();

  await page.goto("/#/films");
  await page.getByRole("button", { name: /Anatomy of a Fall/ }).click();
  await page.getByRole("button", { name: "Add 1 film" }).click();
  await expect(page.getByRole("heading", { name: "Ready for today's faces?" })).toBeVisible();

  await page.goto("/#/people");
  await expect(page.getByText("Justine Triet", { exact: true })).toBeVisible();
  await expect(page.getByText("Sandra Hüller", { exact: true })).toHaveCount(0);
}

test("AC11: About shows the TMDB logo and the required notice", async ({ page }) => {
  await firstLaunch(page);
  await page.goto("/#/about");
  await expect(page.getByRole("img", { name: "The Movie Database (TMDB)" })).toBeVisible();
  await expect(
    page.getByText("This product uses the TMDB API but is not endorsed or certified by TMDB."),
  ).toBeVisible();
});
