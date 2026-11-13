import Dexie, { type EntityTable } from "dexie";
import type { ResponseCache } from "../tmdb/client";
import {
  DEFAULT_PROFILE,
  type ExcludedPerson,
  type Film,
  type Person,
  type Profile,
  type QueueEntry,
  type ReviewLogEntry,
  type SeenFilm,
} from "../learning/types";

interface CachedResponse {
  key: string;
  value: unknown;
  storedAt: number;
}

export class MovieStarsDb extends Dexie {
  queue!: EntityTable<QueueEntry, "personId">;
  reviewLog!: EntityTable<ReviewLogEntry, "id">;
  seenFilms!: EntityTable<SeenFilm, "filmId">;
  excluded!: EntityTable<ExcludedPerson, "personId">;
  people!: EntityTable<Person, "id">;
  films!: EntityTable<Film, "id">;
  profile!: EntityTable<Profile, "id">;
  tmdbCache!: EntityTable<CachedResponse, "key">;

  constructor(name = "moviestars") {
    super(name);
    this.version(1).stores({
      queue: "personId, level, memory.due",
      reviewLog: "++id, personId, at",
      seenFilms: "filmId, addedAt",
      excluded: "personId",
      people: "id, role, country, decade",
      films: "id",
      profile: "id",
      tmdbCache: "key",
    });
  }
}

export async function loadProfile(db: MovieStarsDb): Promise<Profile> {
  return (await db.profile.get("me")) ?? { ...DEFAULT_PROFILE };
}

export async function saveProfile(db: MovieStarsDb, profile: Profile): Promise<void> {
  await db.profile.put(profile);
}

/** A persistent cache for TMDB responses, so people already seen work offline. */
export function dbResponseCache(db: MovieStarsDb): ResponseCache {
  return {
    get: async (key) => {
      const row = await db.tmdbCache.get(key);
      return row ? { value: row.value, storedAt: row.storedAt } : undefined;
    },
    set: async (key, value, storedAt) => {
      await db.tmdbCache.put({ key, value, storedAt });
    },
  };
}
