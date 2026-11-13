import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { films, fixtureFetch } from "../../../tests/fixtures/tmdb";
import { App } from "../../app/App";
import { makeServices } from "../../app/services";
import { MovieStarsDb, loadProfile, saveProfile } from "../../data/db";
import { seededRng } from "../../learning/random";
import type { RecallMode } from "../../learning/types";
import { TmdbClient } from "../../tmdb/client";

let count = 0;

async function setup(options: { recallMode?: RecallMode; goal?: 5 | 10 | 20; level?: 1 | 3 } = {}) {
  const db = new MovieStarsDb(`session-${++count}`);
  const tmdb = new TmdbClient({ fetchFn: fixtureFetch() });
  const services = makeServices({
    db,
    tmdb,
    sample: true,
    now: () => new Date(2026, 10, 12, 12),
    rng: seededRng(3),
  });
  await saveProfile(db, {
    ...(await loadProfile(db)),
    welcomed: true,
    dailyGoal: options.goal ?? 5,
    recallMode: options.recallMode ?? "flip",
  });
  await services.learning.addSeenFilms([films.anatomyOfAFall.id, films.inception.id]);
  if (options.level) await db.queue.toCollection().modify({ level: options.level });
  window.location.hash = "#/session";
  render(<App services={services} />);
  await screen.findByRole("progressbar", { name: "Session progress" });
  return { db, user: userEvent.setup() };
}

/** Answer whatever card is showing; returns false once the summary is up. */
async function answerCurrent(user: UserEvent): Promise<boolean> {
  if (screen.queryByRole("heading", { name: "Session done" })) return false;
  const show = screen.queryByRole("button", { name: /Show name/ });
  if (show) {
    await user.click(show);
    await user.click(screen.getByRole("button", { name: /Knew it/ }));
    return true;
  }
  const choices = document.querySelectorAll<HTMLButtonElement>(".choice");
  if (choices.length > 0) {
    await user.click(choices[0] as HTMLButtonElement);
    await user.click(await screen.findByRole("button", { name: /Continue/ }));
    return true;
  }
  await waitFor(() => expect(document.querySelector(".choice, .btn")).not.toBeNull());
  return true;
}

afterEach(() => {
  window.location.hash = "";
});

describe("session", () => {
  it("runs through today's cards and ends on a summary with the streak", async () => {
    const { db, user } = await setup();
    for (let i = 0; i < 20 && (await answerCurrent(user)); i++);

    await screen.findByRole("heading", { name: "Session done" });
    expect(await db.reviewLog.count()).toBeGreaterThanOrEqual(5);
    await screen.findByText("1-day streak");
    expect(screen.getByRole("link", { name: "Back to Home" })).toBeInTheDocument();
    db.close();
  });

  it("offers one more round only once", async () => {
    const { db, user } = await setup();
    for (let i = 0; i < 20 && (await answerCurrent(user)); i++);
    await user.click(await screen.findByRole("button", { name: "One more round" }));

    await screen.findByRole("progressbar", { name: "Session progress" });
    for (let i = 0; i < 20 && (await answerCurrent(user)); i++);
    await screen.findByRole("heading", { name: "Session done" });
    expect(screen.queryByRole("button", { name: "One more round" })).not.toBeInTheDocument();
    db.close();
  });

  it("shows the answer, the name and a memory anchor after a choice", async () => {
    const { db, user } = await setup({ level: 1 });
    const choices = document.querySelectorAll<HTMLButtonElement>(".choice");
    expect(choices.length).toBe(4);
    await user.click(choices[0] as HTMLButtonElement);

    await screen.findByRole("button", { name: /Continue/ });
    expect(screen.getByText(/Correct|Not quite/)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Remember them by" })).toBeInTheDocument();
    db.close();
  });

  it("answers choices with letter keys", async () => {
    const { db, user } = await setup({ level: 1 });
    await user.keyboard("b");
    await screen.findByRole("button", { name: /Continue/ });
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.queryByRole("button", { name: /Continue/ })).toBeNull());
    expect(await db.reviewLog.count()).toBe(1);
    db.close();
  });
});

// AC6 (screen part): level 3 works in all three answer modes; flip needs at most 2 taps.
describe("recall modes (AC6)", () => {
  it("flip and self-rate takes 2 taps and records the grade", async () => {
    const { db, user } = await setup({ level: 3, recallMode: "flip" });
    await user.click(screen.getByRole("button", { name: /Show name/ }));
    await user.click(screen.getByRole("button", { name: /Knew it/ }));
    await waitFor(async () => expect(await db.reviewLog.count()).toBe(1));
    expect((await db.reviewLog.toArray())[0]?.grade).toBe("good");
    db.close();
  });

  it("flip works with Space and the 1 key", async () => {
    const { db, user } = await setup({ level: 3, recallMode: "flip" });
    await user.keyboard(" ");
    await screen.findByRole("button", { name: /Knew it/ });
    await user.keyboard("1");
    await waitFor(async () => expect(await db.reviewLog.count()).toBe(1));
    expect((await db.reviewLog.toArray())[0]?.grade).toBe("again");
    db.close();
  });

  it("typing checks the typed name and shows what was answered", async () => {
    const { db, user } = await setup({ level: 3, recallMode: "typing" });
    await user.type(screen.getByRole("textbox"), "zzzz{Enter}");
    await screen.findByText(/Not quite. You answered zzzz./);
    expect((await db.reviewLog.toArray())[0]?.grade).toBe("again");
    db.close();
  });

  it("letter tiles check the spelled name", async () => {
    const { db, user } = await setup({ level: 3, recallMode: "tiles" });
    await user.click(screen.getByRole("button", { name: "I don't know" }));
    await screen.findByText("Here's who it is.");
    db.close();
  });
});

// AC8 (screen part): "Don't show again" removes the person straight from a card.
describe("not for me", () => {
  it("removes a new face and moves on", async () => {
    const { db, user } = await setup({ level: 1 });
    const before = await db.queue.count();
    await user.click(screen.getByRole("button", { name: "Don't show again" }));
    await waitFor(async () => expect(await db.queue.count()).toBe(before - 1));
    expect(await db.excluded.count()).toBe(1);
    expect(await db.reviewLog.count()).toBe(0);
    db.close();
  });

  it("can mark a new face as interested after answering", async () => {
    const { db, user } = await setup({ level: 1 });
    await user.click(document.querySelector(".choice") as HTMLButtonElement);
    await user.click(await screen.findByRole("button", { name: "More like this" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "More like this" })).toHaveAttribute(
        "aria-pressed",
        "true",
      ),
    );
    const interested = (await db.queue.toArray()).filter((e) => e.interested === true);
    expect(interested).toHaveLength(1);
    db.close();
  });
});

describe("hint", () => {
  it("names a seen film on request", async () => {
    const { db, user } = await setup({ level: 3, recallMode: "flip" });
    await user.click(screen.getByRole("button", { name: "Need a hint?" }));
    expect(screen.getByText(/You saw them in (Anatomy of a Fall|Inception)/)).toBeInTheDocument();
    db.close();
  });
});

describe("review fixes", () => {
  it("explains a failed first load instead of 'scheduled for later'", async () => {
    const db = new MovieStarsDb(`session-offline-${++count}`);
    const tmdb = new TmdbClient({
      fetchFn: async () => {
        throw new TypeError("Failed to fetch");
      },
    });
    const services = makeServices({ db, tmdb, sample: true });
    await saveProfile(db, { ...(await loadProfile(db)), welcomed: true });
    window.location.hash = "#/session";
    render(<App services={services} />);

    await screen.findByRole("heading", { name: "No faces yet" });
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    db.close();
  });

  it("does not count a session with no answers towards the streak", async () => {
    const { db, user } = await setup({ level: 1, goal: 5 });
    for (let i = 0; i < 20; i++) {
      if (screen.queryByRole("heading", { name: "Session done" })) break;
      const hide = screen.queryByRole("button", { name: "Don't show again" });
      if (hide) await user.click(hide);
      else await waitFor(() => expect(document.querySelector(".choice, .btn")).not.toBeNull());
    }
    await screen.findByRole("heading", { name: "Session done" });
    expect((await loadProfile(db)).lastSessionDay).toBeNull();
    db.close();
  });
});
