import { applyAnswer, isMastered, localDay } from "./levels";
import { isDue, newMemory, review } from "./schedule";
import type { Level, QueueEntry } from "./types";

/** Noon local time on a day in November 2026, so tests do not depend on the time zone. */
const day = (d: number, hour = 12) => new Date(2026, 10, d, hour);

const entry = (level: Level = 1): QueueEntry => ({
  personId: 1,
  level,
  correctInARow: 0,
  lastCorrectDay: null,
  memory: newMemory(day(1)),
  source: "starter",
  interested: null,
  addedAt: 0,
});

describe("localDay", () => {
  it("formats the local calendar day", () => {
    expect(localDay(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});

// AC4: two correct answers in a row on different days move a person up exactly one level;
// a wrong answer moves them down one level, never below 1.
describe("levels (AC4)", () => {
  it("moves up one level after 2 correct answers on different days", () => {
    let e = applyAnswer(entry(1), "good", day(1));
    expect(e.level).toBe(1);
    e = applyAnswer(e, "good", day(2));
    expect(e.level).toBe(2);
    expect(e.correctInARow).toBe(0);
  });

  it("does not count two correct answers on the same day", () => {
    let e = applyAnswer(entry(1), "good", day(1, 9));
    e = applyAnswer(e, "good", day(1, 18));
    expect(e.level).toBe(1);
    expect(e.correctInARow).toBe(1);
  });

  it("moves up only one level at a time", () => {
    let e = entry(1);
    for (const d of [1, 2, 3, 4]) e = applyAnswer(e, "good", day(d));
    expect(e.level).toBe(3);
  });

  it("moves down one level after a wrong answer and resets the streak", () => {
    let e = applyAnswer(entry(3), "good", day(1));
    e = applyAnswer(e, "again", day(2));
    expect(e.level).toBe(2);
    expect(e.correctInARow).toBe(0);
  });

  it("never drops below level 1", () => {
    expect(applyAnswer(entry(1), "again", day(1)).level).toBe(1);
  });

  it("never rises above level 4", () => {
    let e = entry(4);
    for (const d of [1, 2, 3, 4]) e = applyAnswer(e, "good", day(d));
    expect(e.level).toBe(4);
  });
});

// AC7: next review dates come from FSRS: after Good the next interval is longer than the
// previous one; after Again the person comes back (the session repeats them, see session.ts).
describe("FSRS scheduling (AC7)", () => {
  it("schedules longer intervals after each Good answer", () => {
    let memory = newMemory(day(1));
    const intervals: number[] = [];
    let now = day(1);
    for (let i = 0; i < 4; i++) {
      memory = review(memory, "good", now);
      intervals.push(memory.scheduled_days);
      now = memory.due;
    }
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThan(intervals[i - 1] ?? 0);
    }
    expect(intervals[0]).toBeGreaterThanOrEqual(1);
  });

  it("shortens the interval after an Again answer", () => {
    let memory = newMemory(day(1));
    memory = review(memory, "good", day(1));
    memory = review(memory, "good", memory.due);
    const before = memory.scheduled_days;
    memory = review(memory, "again", memory.due);
    expect(memory.scheduled_days).toBeLessThan(before);
    expect(memory.lapses).toBe(1);
  });

  it("marks a new person as due straight away", () => {
    expect(isDue(newMemory(day(1)), day(1))).toBe(true);
  });

  it("keeps a reviewed person off the list until their due date", () => {
    const memory = review(newMemory(day(1)), "good", day(1));
    expect(isDue(memory, day(1, 18))).toBe(false);
    expect(isDue(memory, memory.due)).toBe(true);
  });
});

describe("isMastered", () => {
  it("needs level 4 and a memory stable for over 30 days", () => {
    const strong = { ...entry(4), memory: { ...entry(4).memory, stability: 45 } };
    const weak = { ...entry(4), memory: { ...entry(4).memory, stability: 10 } };
    const notLevel4 = { ...entry(3), memory: { ...entry(3).memory, stability: 45 } };
    expect(isMastered(strong)).toBe(true);
    expect(isMastered(weak)).toBe(false);
    expect(isMastered(notLevel4)).toBe(false);
  });
});
