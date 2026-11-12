import { newMemory } from "./schedule";
import type { ExcludedPerson, Film, Person, QueueEntry, QueueSource } from "./types";

/** About 20 people are loaded on first launch (spec: Starter set). */
export const STARTER_SIZE = 20;

/** When fewer than this many people are left at level 1, the queue grows (spec: Growth). */
export const GROWTH_THRESHOLD = 5;

/** How many people one growth step adds. */
export const GROWTH_BATCH = 5;

/** A film's director(s) and top-billed cast, without duplicates. */
export function peopleFromFilm(film: Film): number[] {
  return unique([...film.directorIds, ...film.castIds]);
}

export function unique(ids: number[]): number[] {
  return [...new Set(ids)];
}

/** Take people from several lists in turn (e.g. US, French, other), skipping repeats. */
export function interleave(groups: number[][], size: number): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  const longest = Math.max(0, ...groups.map((g) => g.length));
  for (let i = 0; i < longest && out.length < size; i++) {
    for (const group of groups) {
      const id = group[i];
      if (id === undefined || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
      if (out.length >= size) break;
    }
  }
  return out;
}

export function newQueueEntry(personId: number, source: QueueSource, now: Date): QueueEntry {
  return {
    personId,
    level: 1,
    correctInARow: 0,
    lastCorrectDay: null,
    memory: newMemory(now),
    source,
    interested: null,
    addedAt: now.getTime(),
  };
}

/**
 * New queue entries for the given people, skipping anyone already queued or marked
 * "Not for me" (spec AC2, AC8).
 */
export function entriesToAdd(
  personIds: number[],
  source: QueueSource,
  queuedIds: ReadonlySet<number>,
  excludedIds: ReadonlySet<number>,
  now: Date,
): QueueEntry[] {
  return unique(personIds)
    .filter((id) => !queuedIds.has(id) && !excludedIds.has(id))
    .map((id) => newQueueEntry(id, source, now));
}

export function excludeRecord(person: Person, now: Date): ExcludedPerson {
  return {
    personId: person.id,
    country: person.country,
    decade: person.decade,
    at: now.getTime(),
  };
}

export function needsGrowth(queue: QueueEntry[]): boolean {
  return queue.filter((e) => e.level === 1).length < GROWTH_THRESHOLD;
}

interface Taste {
  interested: Person[];
  excluded: ExcludedPerson[];
  /** People from films the user has seen. */
  fromSeenFilms: ReadonlySet<number>;
}

const sameGroup = (a: { country: string | null; decade: number | null }, b: Person) =>
  a.country !== null && a.country === b.country && a.decade !== null && a.decade === b.decade;

/**
 * Order growth candidates by the user's taste (spec: Growth and Taste signal):
 * people from seen films first, then those like the people marked "Interested";
 * people like those marked "Not for me" go last.
 */
export function rankCandidates(candidates: Person[], taste: Taste): Person[] {
  const score = (p: Person) => {
    let s = 0;
    if (taste.fromSeenFilms.has(p.id)) s += 4;
    if (taste.interested.some((i) => i.country !== null && i.country === p.country)) s += 2;
    if (taste.interested.some((i) => i.decade !== null && i.decade === p.decade)) s += 1;
    if (taste.excluded.some((x) => sameGroup(x, p))) s -= 3;
    return s;
  };
  return [...candidates].sort((a, b) => score(b) - score(a) || b.popularity - a.popularity);
}
