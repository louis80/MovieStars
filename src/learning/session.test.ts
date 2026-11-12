import { newQueueEntry } from "./queue";
import { review } from "./schedule";
import {
  answer,
  completeSessionDay,
  currentPersonId,
  currentStreak,
  isComplete,
  planSession,
  progress,
  startSession,
  summarize,
  weekOf,
} from "./session";
import { DEFAULT_PROFILE, type QueueEntry } from "./types";

const at = (d: number) => new Date(2026, 10, d, 12);

const fresh = (id: number, addedAt: number): QueueEntry => ({
  ...newQueueEntry(id, "starter", at(1)),
  addedAt,
});

/** An entry reviewed once on the given day, so it is due a few days later. */
const reviewed = (id: number, day: number): QueueEntry => {
  const e = fresh(id, 0);
  return { ...e, memory: review(e.memory, "good", at(day)) };
};

describe("planSession", () => {
  it("puts due reviews first, most overdue first, then new people, up to the goal", () => {
    const olderReview = reviewed(1, 1);
    const newerReview = reviewed(2, 3);
    const notDueYet = reviewed(3, 24);
    const queue = [fresh(10, 2), newerReview, fresh(11, 1), notDueYet, olderReview];

    const plan = planSession(queue, 10, at(25));
    expect(plan).toEqual([1, 2, 11, 10]);
  });

  it("stops at the daily goal", () => {
    const queue = Array.from({ length: 30 }, (_, i) => fresh(i, i));
    expect(planSession(queue, 10, at(1))).toHaveLength(10);
  });
});

// AC7 (session part): after Again, the person reappears in the same session, once.
describe("session flow (AC7)", () => {
  it("repeats a missed person once at the end of the session", () => {
    let s = startSession([1, 2]);
    s = answer(s, "again"); // 1 missed
    s = answer(s, "good"); // 2
    expect(currentPersonId(s)).toBe(1);
    s = answer(s, "again"); // 1 missed again: not repeated a second time
    expect(isComplete(s)).toBe(true);
    expect(s.answers).toHaveLength(3);
  });

  it("reports progress against the cards planned so far", () => {
    let s = startSession([1, 2, 3]);
    s = answer(s, "again");
    expect(progress(s)).toEqual({ done: 1, total: 4 });
  });

  it("ends without an extra round", () => {
    let s = startSession([1]);
    s = answer(s, "good");
    expect(isComplete(s)).toBe(true);
    expect(answer(s, "good")).toBe(s);
  });
});

describe("summarize", () => {
  it("counts people, not repeated answers, and who levelled up", () => {
    let s = startSession([1, 2]);
    s = answer(s, "good");
    s = answer(s, "again"); // 2 missed, comes back once
    s = answer(s, "good"); // 2 right on the repeat: still "to review"
    const before = new Map([
      [1, fresh(1, 0)],
      [2, fresh(2, 0)],
    ]);
    const after = new Map([
      [1, { ...fresh(1, 0), level: 2 as const }],
      [2, fresh(2, 0)],
    ]);
    expect(summarize(s, before, after)).toEqual({ right: 1, wrong: 1, levelledUp: [1] });
  });
});

describe("streak", () => {
  const profile = (
    streak: number,
    lastSessionDay: string | null,
    forgivenWeek: string | null = null,
  ) => ({
    ...DEFAULT_PROFILE,
    streak,
    lastSessionDay,
    forgivenWeek,
  });

  it("knows the Monday of a week", () => {
    expect(weekOf("2026-11-12")).toBe("2026-11-09"); // a Thursday
    expect(weekOf("2026-11-09")).toBe("2026-11-09");
    expect(weekOf("2026-11-15")).toBe("2026-11-09"); // Sunday
  });

  it("starts at 1 and grows by 1 on consecutive days", () => {
    let p = completeSessionDay(profile(0, null), "2026-11-10");
    expect(p.streak).toBe(1);
    p = completeSessionDay(p, "2026-11-11");
    expect(p.streak).toBe(2);
    expect(completeSessionDay(p, "2026-11-11").streak).toBe(2);
  });

  it("forgives one missed day per week", () => {
    const p = completeSessionDay(profile(5, "2026-11-10"), "2026-11-12"); // missed the 11th
    expect(p.streak).toBe(6);
    expect(p.forgivenWeek).toBe("2026-11-09");
  });

  it("does not forgive a second missed day in the same week", () => {
    const p = completeSessionDay(profile(5, "2026-11-12", "2026-11-09"), "2026-11-14");
    expect(p.streak).toBe(1);
  });

  it("forgives again in the next week", () => {
    const p = completeSessionDay(profile(5, "2026-11-16", "2026-11-09"), "2026-11-18");
    expect(p.streak).toBe(6);
  });

  it("resets after two missed days", () => {
    expect(completeSessionDay(profile(5, "2026-11-10"), "2026-11-13").streak).toBe(1);
  });

  it("shows a broken streak as 0 on Home", () => {
    expect(currentStreak(profile(5, "2026-11-10"), "2026-11-11")).toBe(5);
    expect(currentStreak(profile(5, "2026-11-10"), "2026-11-12")).toBe(5);
    expect(currentStreak(profile(5, "2026-11-10"), "2026-11-13")).toBe(0);
    expect(currentStreak(profile(0, null), "2026-11-13")).toBe(0);
  });
});
