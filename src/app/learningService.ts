import { loadProfile, saveProfile, type MovieStarsDb } from "../data/db";
import { applyAnswer, isMastered, localDay } from "../learning/levels";
import { completeSessionDay, currentStreak, planSession } from "../learning/session";
import type { TmdbMovieSummary, TmdbPersonSummary } from "../tmdb/types";

export interface HomeSummary {
  streak: number;
  /** People answered today, capped at the goal. */
  done: number;
  goal: number;
  /** People at each level, not counting mastered ones. */
  levels: Record<1 | 2 | 3 | 4, number>;
  mastered: number;
  /** Cards today's session would hold right now. */
  planned: number;
  /** Everyone in the queue. */
  total: number;
  /** People at level 3 or above ("you know well"). */
  knownWell: number;
  /** Faces for the Home row: best known first, at most FACE_ROW_SIZE. */
  faces: FaceSummary[];
}

export interface FaceSummary {
  id: number;
  name: string;
  photoPath: string | null;
  level: 1 | 2 | 3 | 4;
  mastered: boolean;
}

export const FACE_ROW_SIZE = 12;

export interface MyPerson {
  person: Person;
  level: 1 | 2 | 3 | 4;
  mastered: boolean;
}

export interface PersonPage {
  person: Person;
  /** Null when the person is not in the learning queue. */
  entry: QueueEntry | null;
  mastered: boolean;
  excluded: boolean;
}

export interface FilmPage {
  film: Film;
  directors: Person[];
  cast: Person[];
  seen: boolean;
}

export interface PreparedSession {
  order: number[];
  entries: Map<number, QueueEntry>;
  people: Map<number, Person>;
  pool: Person[];
  films: Film[];
  seenFilmIds: Set<number>;
  recallMode: RecallMode;
}
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
import type { Film, Grade, Person, Profile, QueueEntry, RecallMode } from "../learning/types";
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

  /** "Add" on a person page: an explicit choice, so it also undoes "Don't show again". */
  async addPerson(personId: number): Promise<number> {
    const person = await this.person(personId);
    if (!person) return 0;
    await this.db.excluded.delete(person.id);
    return this.add([person.id], "added");
  }

  /** Everyone in the learning queue, for My people. */
  async myPeople(): Promise<MyPerson[]> {
    const queue = await this.queue();
    const list: MyPerson[] = [];
    for (const entry of queue) {
      const person = await this.db.people.get(entry.personId);
      if (person) list.push({ person, level: entry.level, mastered: isMastered(entry) });
    }
    return list.sort((a, b) => a.person.name.localeCompare(b.person.name));
  }

  async personPage(id: number): Promise<PersonPage | undefined> {
    const person = await this.person(id);
    if (!person) return undefined;
    const entry = (await this.db.queue.get(id)) ?? null;
    const excluded = (await this.db.excluded.get(id)) !== undefined;
    return { person, entry, mastered: entry ? isMastered(entry) : false, excluded };
  }

  async filmPage(id: number): Promise<FilmPage | undefined> {
    const film = await this.film(id);
    if (!film) return undefined;
    const directors = await this.people(film.directorIds);
    const cast = await this.people(film.castIds);
    const seen = (await this.db.seenFilms.get(id)) !== undefined;
    return { film, directors, cast, seen };
  }

  /** People on TMDB matching a name who are not in the queue yet. */
  async findNewPeople(query: string): Promise<TmdbPersonSummary[]> {
    if (query.trim().length < 2) return [];
    try {
      const queued = new Set((await this.queue()).map((e) => e.personId));
      const page = await this.tmdb.searchPeople(query.trim());
      return page.results.filter((p) => !queued.has(p.id));
    } catch {
      return [];
    }
  }

  async updateSettings(
    change: Partial<Pick<Profile, "dailyGoal" | "recallMode">>,
  ): Promise<Profile> {
    // One transaction per change, so quick successive changes cannot overwrite each other.
    return this.db.transaction("rw", this.db.profile, async () => {
      const profile = { ...(await loadProfile(this.db)), ...change };
      await saveProfile(this.db, profile);
      return profile;
    });
  }

  /** "Don't show again": remove the person and never re-add them automatically (spec AC8). */
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

  /** Save one answer: new level and FSRS state, plus a review-log row. Returns the new entry. */
  async recordAnswer(personId: number, grade: Grade): Promise<QueueEntry | undefined> {
    const now = this.now();
    return this.db.transaction("rw", this.db.queue, this.db.reviewLog, async () => {
      const entry = await this.db.queue.get(personId);
      if (!entry) return undefined;
      const updated = applyAnswer(entry, grade, now);
      await this.db.queue.put(updated);
      await this.db.reviewLog.add({ personId, at: now.getTime(), level: entry.level, grade });
      return updated;
    });
  }

  async profile(): Promise<Profile> {
    return loadProfile(this.db);
  }

  async markWelcomed(): Promise<void> {
    await saveProfile(this.db, { ...(await loadProfile(this.db)), welcomed: true });
  }

  /** What the Home screen shows: streak, today's progress and people per level. */
  async homeSummary(): Promise<HomeSummary> {
    const now = this.now();
    const profile = await loadProfile(this.db);
    const queue = await this.queue();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayIds = new Set(
      (await this.db.reviewLog.where("at").aboveOrEqual(startOfDay).toArray()).map(
        (r) => r.personId,
      ),
    );
    const mastered = queue.filter(isMastered);
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const e of queue) if (!isMastered(e)) counts[e.level] += 1;
    return {
      streak: currentStreak(profile, localDay(now)),
      done: Math.min(todayIds.size, profile.dailyGoal),
      goal: profile.dailyGoal,
      levels: counts,
      mastered: mastered.length,
      planned: planSession(queue, profile.dailyGoal, now).length,
      total: queue.length,
      knownWell: queue.filter((e) => e.level >= 3).length,
      faces: await this.faces(queue),
    };
  }

  private async faces(queue: QueueEntry[]): Promise<FaceSummary[]> {
    const ranked = [...queue].sort(
      (a, b) =>
        Number(isMastered(b)) - Number(isMastered(a)) ||
        b.level - a.level ||
        b.memory.stability - a.memory.stability ||
        a.addedAt - b.addedAt,
    );
    const faces: FaceSummary[] = [];
    for (const entry of ranked.slice(0, FACE_ROW_SIZE)) {
      const person = await this.db.people.get(entry.personId);
      if (!person) continue;
      faces.push({
        id: person.id,
        name: person.name,
        photoPath: person.photoPath,
        level: entry.level,
        mastered: isMastered(entry),
      });
    }
    return faces;
  }

  /** Posters for "Films I've seen": now playing and trending this week, without repeats. */
  async filmChoices(): Promise<TmdbMovieSummary[]> {
    const lists = await Promise.allSettled([this.tmdb.nowPlaying(), this.tmdb.trendingFilms()]);
    const seen = new Set<number>();
    const films: TmdbMovieSummary[] = [];
    for (const list of lists) {
      if (list.status !== "fulfilled") continue;
      for (const film of list.value.results) {
        if (seen.has(film.id)) continue;
        seen.add(film.id);
        films.push(film);
      }
    }
    return films;
  }

  async searchFilms(query: string): Promise<TmdbMovieSummary[]> {
    if (query.trim().length < 2) return [];
    try {
      return (await this.tmdb.searchFilms(query.trim())).results;
    } catch {
      return [];
    }
  }

  /**
   * Everything a session needs: today's plan (topping up the queue first if it runs low),
   * the queue entries and people involved, and what the card builder draws on.
   */
  async prepareSession(): Promise<PreparedSession> {
    await this.growIfNeeded();
    const now = this.now();
    const profile = await loadProfile(this.db);
    const queue = await this.queue();
    const order = planSession(queue, profile.dailyGoal, now);
    const entries = new Map(queue.map((e) => [e.personId, e]));
    const people = new Map((await this.people(order)).map((p) => [p.id, p]));
    return {
      order: order.filter((id) => people.has(id)),
      entries,
      people,
      pool: await this.db.people.toArray(),
      films: await this.db.films.toArray(),
      seenFilmIds: new Set((await this.db.seenFilms.toArray()).map((s) => s.filmId)),
      recallMode: profile.recallMode,
    };
  }

  /** Mark today's session as done and update the streak. */
  async finishSession(): Promise<Profile> {
    const profile = completeSessionDay(await loadProfile(this.db), localDay(this.now()));
    await saveProfile(this.db, profile);
    return profile;
  }

  private async add(ids: number[], source: QueueEntry["source"]): Promise<number> {
    const queued = new Set((await this.db.queue.toArray()).map((e) => e.personId));
    const excluded = new Set((await this.db.excluded.toArray()).map((x) => x.personId));
    const entries = entriesToAdd(ids, source, queued, excluded, this.now());
    await this.db.queue.bulkPut(entries);
    return entries.length;
  }
}
