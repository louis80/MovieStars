import type { Film, Person } from "../learning/types";
import { toFilm, toPerson } from "./map";
import type {
  TmdbMovieDetails,
  TmdbMovieSummary,
  TmdbPage,
  TmdbPersonDetails,
  TmdbPersonSummary,
} from "./types";

export const TMDB_API_BASE = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type ImageSize = "w92" | "w185" | "w342" | "w500" | "h632" | "original";

export function imageUrl(path: string | null, size: ImageSize = "w342"): string | null {
  return path ? `${TMDB_IMAGE_BASE}/${size}${path}` : null;
}

/** A key/value store for raw TMDB responses. The data layer provides a persistent one. */
export interface ResponseCache {
  get(key: string): Promise<{ value: unknown; storedAt: number } | undefined>;
  set(key: string, value: unknown, storedAt: number): Promise<void>;
}

export function memoryCache(): ResponseCache {
  const store = new Map<string, { value: unknown; storedAt: number }>();
  return {
    get: async (key) => store.get(key),
    set: async (key, value, storedAt) => {
      store.set(key, { value, storedAt });
    },
  };
}

export class TmdbError extends Error {
  constructor(
    readonly status: number,
    readonly path: string,
  ) {
    super(`TMDB request failed (${status}) for ${path}`);
    this.name = "TmdbError";
  }
}

export interface TmdbClientOptions {
  /** TMDB API Read Access Token. Omit when baseUrl points at a proxy that adds it. */
  token?: string;
  baseUrl?: string;
  fetchFn?: typeof fetch;
  cache?: ResponseCache;
  /** How long a cached response stays fresh. Defaults to 7 days. */
  maxAgeMs?: number;
  now?: () => number;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export class TmdbClient {
  private readonly token: string | undefined;
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly cache: ResponseCache;
  private readonly maxAgeMs: number;
  private readonly now: () => number;

  constructor(options: TmdbClientOptions = {}) {
    this.token = options.token;
    this.baseUrl = options.baseUrl ?? TMDB_API_BASE;
    this.fetchFn = options.fetchFn ?? ((...args) => fetch(...args));
    this.cache = options.cache ?? memoryCache();
    this.maxAgeMs = options.maxAgeMs ?? WEEK_MS;
    this.now = options.now ?? Date.now;
  }

  async popularPeople(page = 1): Promise<TmdbPage<TmdbPersonSummary>> {
    return this.get(`/person/popular`, { page: String(page) });
  }

  async person(id: number): Promise<Person> {
    const raw = await this.get<TmdbPersonDetails>(`/person/${id}`, {
      append_to_response: "movie_credits",
    });
    return toPerson(raw);
  }

  async film(id: number): Promise<Film> {
    const raw = await this.get<TmdbMovieDetails>(`/movie/${id}`, {
      append_to_response: "credits",
    });
    return toFilm(raw);
  }

  async nowPlaying(page = 1): Promise<TmdbPage<TmdbMovieSummary>> {
    return this.get(`/movie/now_playing`, { page: String(page) });
  }

  async trendingFilms(): Promise<TmdbPage<TmdbMovieSummary>> {
    return this.get(`/trending/movie/week`);
  }

  /** Popular films from one country of origin, e.g. "FR". */
  async popularFilmsFrom(country: string, page = 1): Promise<TmdbPage<TmdbMovieSummary>> {
    return this.get(`/discover/movie`, {
      with_origin_country: country,
      sort_by: "popularity.desc",
      page: String(page),
    });
  }

  async searchPeople(query: string): Promise<TmdbPage<TmdbPersonSummary>> {
    return this.get(`/search/person`, { query });
  }

  async searchFilms(query: string): Promise<TmdbPage<TmdbMovieSummary>> {
    return this.get(`/search/movie`, { query });
  }

  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const query = new URLSearchParams({ language: "en-US", ...params });
    const key = `${path}?${query.toString()}`;

    const cached = await this.cache.get(key);
    if (cached && this.now() - cached.storedAt < this.maxAgeMs) {
      return cached.value as T;
    }

    const headers: Record<string, string> = { accept: "application/json" };
    if (this.token) headers.authorization = `Bearer ${this.token}`;

    let response: Response;
    try {
      response = await this.fetchFn(`${this.baseUrl}${key}`, { headers });
    } catch (error) {
      // Offline: fall back to a stale cached copy if there is one.
      if (cached) return cached.value as T;
      throw error;
    }

    if (!response.ok) {
      if (cached) return cached.value as T;
      throw new TmdbError(response.status, path);
    }

    const value = (await response.json()) as T;
    await this.cache.set(key, value, this.now());
    return value;
  }
}
