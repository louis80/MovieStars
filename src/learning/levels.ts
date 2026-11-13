import { review } from "./schedule";
import type { Grade, Level, QueueEntry } from "./types";

/** Correct answers in a row, on different days, needed to move up a level. */
export const CORRECT_TO_LEVEL_UP = 2;

/** FSRS stability (days) above which a level-4 person counts as mastered. */
export const MASTERED_STABILITY_DAYS = 30;

/** The local calendar day of a moment, as YYYY-MM-DD. */
export function localDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function clampLevel(n: number): Level {
  return Math.min(4, Math.max(1, n)) as Level;
}

/**
 * Apply one answer to a queue entry: update the level (spec "Levels") and the
 * FSRS memory state (spec "Scheduling with FSRS").
 */
export function applyAnswer(entry: QueueEntry, grade: Grade, now: Date): QueueEntry {
  const memory = review(entry.memory, grade, now);

  if (grade === "again") {
    return {
      ...entry,
      memory,
      level: clampLevel(entry.level - 1),
      correctInARow: 0,
      lastCorrectDay: null,
    };
  }

  const today = localDay(now);
  if (entry.lastCorrectDay === today) {
    // A second correct answer on the same day does not count towards levelling.
    return { ...entry, memory };
  }

  const correctInARow = entry.correctInARow + 1;
  if (correctInARow >= CORRECT_TO_LEVEL_UP && entry.level < 4) {
    return {
      ...entry,
      memory,
      level: clampLevel(entry.level + 1),
      correctInARow: 0,
      lastCorrectDay: null,
    };
  }

  return { ...entry, memory, correctInARow, lastCorrectDay: today };
}

export function isMastered(entry: QueueEntry): boolean {
  return entry.level === 4 && entry.memory.stability > MASTERED_STABILITY_DAYS;
}
