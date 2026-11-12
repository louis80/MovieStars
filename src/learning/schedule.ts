import { createEmptyCard, fsrs, generatorParameters, Rating, type Card } from "ts-fsrs";
import type { Grade, MemoryState } from "./types";

/** Target probability of still remembering a person when they come back (spec: 90%). */
export const TARGET_RETENTION = 0.9;

// Learning steps are off: a session already repeats a missed person once, and
// otherwise people come back on whole days, which suits a once-a-day habit.
const scheduler = fsrs(
  generatorParameters({
    request_retention: TARGET_RETENTION,
    learning_steps: [],
    relearning_steps: [],
  }),
);

export function newMemory(now: Date): MemoryState {
  return createEmptyCard(now) as MemoryState;
}

/** Update a person's memory state after an answer and schedule their next review. */
export function review(memory: MemoryState, grade: Grade, now: Date): MemoryState {
  const rating = grade === "good" ? Rating.Good : Rating.Again;
  const { card } = scheduler.next(memory as Card, now, rating);
  return card as MemoryState;
}

export function isDue(memory: MemoryState, now: Date): boolean {
  return memory.due.getTime() <= now.getTime();
}

/** Days until the next review, as scheduled by FSRS. */
export function intervalDays(memory: MemoryState): number {
  return memory.scheduled_days;
}
