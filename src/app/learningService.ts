import type { MovieStarsDb } from "../data/db";
import {
  GROWTH_BATCH,
  STARTER_SIZE,
  entriesToAdd,
  excludeRecord,
  interleave,
  needsGrowth,
  peopleFromFilm,
  rankCandidates,
  unique,
} from "../learning/queue";
import type { Film, Person, QueueEntry } from "../learning/types";
import type { TmdbClient } from "../tmdb/client";

/** Countries whose popular films seed the starter set, besides the global popular list. */
const STARTER_COUNTRIES = ["FR", "GB", "ES"];
const FILMS_PER_COUNTRY = 3;

/**
 * Wires TMDB, on-device storage and the pure learning rules together.
 * Network failures for single people or films are skipped, never fatal.
 */
export class LearningService {
  constructor(
    private readonly db: MovieStarsDb,
    private readonly tmdb: TmdbClient,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async queue(): Promise<QueueEntry[]> {
    return this.db.queue.toArray();
  }

  async person(id: number): Promise<Person | undefined> {
    const stored = await this.db.people.get(id);
    if (stored) return stored;
    try {
      const person = await this.tmdb.person(id);
      await this.db.people.put(person);
      return person;
    } catch {
      return undefined;
    }
  }

  async people(ids: number[]): Promise<Person[]> {
    const found: Person[] = [];
    for (const id of unique(ids)) {
      const person = await this.person(id);
      if (person) found.push(person);
    }
    return found;
  }

  async film(id: number): Promise<Film | undefined> {
    const stored = await this.db.films.get(id);
    if (stored) return stored;
    try {
      const film = await this.tmdb.film(id);
      await this.db.films.put(film);
      return film;
    } catch {
      return undefined;
    }
  }

  /** First launch: fill the queue with about 20 well-known people from several countries. */
  async seedStarter(): Promise<number> {
    if ((await this.db.queue.count()) > 0) return 0;

    const groups: number[][] = [];
    try {
      const popular = await this.tmdb.popularPeople();
      groups.push(popular.results.map((p) => p.id));
    } catch {
      // Carry on with the country lists.
    }

    for (const country of STARTER_COUNTRIES) {
      const ids: number[] = [];
      try {
        const page = await this.tmdb.popularFilmsFrom(country);
        for (const summary of page.results.slice(0, FILMS_PER_COUNTRY)) {
          const film = await this.film(summary.id);
          if (film) ids.push(...peopleFromFilm(film));
        }
      } catch {
        // Skip this country.
      }
      groups.push(ids);
    }

    const picked = interleave(groups, STARTER_SIZE);
    const people = await this.people(picked);
    return this.add(
      people.map((p) => p.id),
      "starter",
    );
  }

  /** "I've seen this": add each film's director and top 5 cast (spec AC2). */
  async addSeenFilms(filmIds: number[]): Promise<number> {
    let added = 0;
    for (const filmId of unique(filmIds)) {
      const film = await this.film(filmId);
      if (!film) continue;
      await this.db.seenFilms.put({ filmId, addedAt: this.now().getTime() });
      const people = await this.people(peopleFromFilm(film));
      added += await this.add(
        people.map((p) => p.id),
        "film",
      );
    }
    return added;
  }

  async addPerson(personId: number): Promise<number> {
    const person = await this.person(personId);
    return person ? this.add([person.id], "added") : 0;
  }

  /** "Not for me": remove the person and never re-add them automatically (spec AC8). */
  async notForMe(personId: number): Promise<void> {
    const person = await this.person(personId);
    await this.db.transaction("rw", this.db.queue, this.db.excluded, async () => {
      await this.db.queue.delete(personId);
      await this.db.excluded.put(
        person
          ? excludeRecord(person, this.now())
          : { personId, country: null, decade: null, at: this.now().getTime() },
      );
    });
  }

  async markInterested(personId: number): Promise<void> {
    await this.db.queue.update(personId, { interested: true });
  }

  /** When fewer than 5 people are left at level 1, add more that match the user's taste. */
  async growIfNeeded(): Promise<number> {
    const queue = await this.queue();
    if (!needsGrowth(queue)) return 0;

    const queued = new Set(queue.map((e) => e.personId));
    const excluded = await this.db.excluded.toArray();
    const excludedIds = new Set(excluded.map((x) => x.personId));
    const interested = await this.people(
      queue.filter((e) => e.interested === true).map((e) => e.personId),
    );

    const fromSeenFilms = new Set<number>();
    for (const seen of await this.db.seenFilms.toArray()) {
      const film = await this.film(seen.filmId);
      if (film) peopleFromFilm(film).forEach((id) => fromSeenFilms.add(id));
    }

    const candidateIds = [...fromSeenFilms];
    try {
      const popular = await this.tmdb.popularPeople();
      candidateIds.push(...popular.results.map((p) => p.id));
    } catch {
      // Growth can still use seen films.
    }

    const fresh = unique(candidateIds).filter((id) => !queued.has(id) && !excludedIds.has(id));
    const candidates = await this.people(fresh);
    const ranked = rankCandidates(candidates, { interested, excluded, fromSeenFilms });
    return this.add(
      ranked.slice(0, GROWTH_BATCH).map((p) => p.id),
      "growth",
    );
  }

  private async add(ids: number[], source: QueueEntry["source"]): Promise<number> {
    const queued = new Set((await this.db.queue.toArray()).map((e) => e.personId));
    const excluded = new Set((await this.db.excluded.toArray()).map((x) => x.personId));
    const entries = entriesToAdd(ids, source, queued, excluded, this.now());
    await this.db.queue.bulkPut(entries);
    return entries.length;
  }
}
