import { MovieStarsDb, dbResponseCache } from "../data/db";
import { TmdbClient, imageUrl, type ImageSize } from "../tmdb/client";
import type { Rng } from "../learning/random";
import { LearningService } from "./learningService";

export interface Services {
  db: MovieStarsDb;
  learning: LearningService;
  /** Full image URL for a TMDB path, or null when there is no image to show. */
  image: (path: string | null, size?: ImageSize) => string | null;
  /** True when running on built-in sample data instead of TMDB (preview builds). */
  sample: boolean;
  /** Randomness for cards; tests pass a seeded one. */
  rng: Rng;
}

export function makeServices(options: {
  db: MovieStarsDb;
  tmdb: TmdbClient;
  sample: boolean;
  now?: () => Date;
  rng?: Rng;
}): Services {
  return {
    db: options.db,
    learning: new LearningService(options.db, options.tmdb, options.now),
    // Sample data has no real images, so placeholders are shown instead.
    image: options.sample ? () => null : imageUrl,
    sample: options.sample,
    rng: options.rng ?? Math.random,
  };
}

/**
 * Real TMDB when a token (or a proxy URL) is configured; otherwise the built-in sample
 * data, so the app can be previewed without a TMDB account.
 */
export async function createServices(): Promise<Services> {
  const db = new MovieStarsDb();
  const token = import.meta.env.VITE_TMDB_TOKEN as string | undefined;
  const baseUrl = import.meta.env.VITE_TMDB_BASE_URL as string | undefined;

  if (token || baseUrl) {
    const tmdb = new TmdbClient({
      ...(token ? { token } : {}),
      ...(baseUrl ? { baseUrl } : {}),
      cache: dbResponseCache(db),
    });
    return makeServices({ db, tmdb, sample: false });
  }

  const { fixtureFetch } = await import("../../tests/fixtures/tmdb");
  const tmdb = new TmdbClient({ fetchFn: fixtureFetch(), cache: dbResponseCache(db) });
  return makeServices({ db, tmdb, sample: true });
}
