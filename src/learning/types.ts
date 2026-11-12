// Domain types shared across the app. Pure data, no TMDB-specific fields.

export type Role = "actor" | "director";

export interface FilmRef {
  id: number;
  title: string;
  year: number | null;
  posterPath: string | null;
  /** The character played, for actors. */
  character?: string;
}

export interface Person {
  id: number;
  name: string;
  role: Role;
  photoPath: string | null;
  /** ISO 3166-1 alpha-2 code when known (e.g. "FR", "US"), otherwise null. */
  country: string | null;
  /** Decade of the person's main films, e.g. 2000. Null when unknown. */
  decade: number | null;
  popularity: number;
  /** Best-known films, most notable first. */
  knownFor: FilmRef[];
}

export interface Film {
  id: number;
  title: string;
  year: number | null;
  posterPath: string | null;
  directorIds: number[];
  /** Top-billed cast, in billing order. */
  castIds: number[];
}
