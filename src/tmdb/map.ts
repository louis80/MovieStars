import type { Film, FilmRef, Person, Role } from "../learning/types";
import type {
  TmdbCastCredit,
  TmdbCrewCredit,
  TmdbMovieDetails,
  TmdbMovieSummary,
  TmdbPersonDetails,
} from "./types";

const KNOWN_FOR_COUNT = 3;
const TOP_CAST_COUNT = 5;

const COUNTRY_CODES: Record<string, string> = {
  usa: "US",
  "u.s.a.": "US",
  "u.s.": "US",
  us: "US",
  "united states": "US",
  "united states of america": "US",
  uk: "GB",
  "united kingdom": "GB",
  england: "GB",
  scotland: "GB",
  wales: "GB",
  "northern ireland": "GB",
  france: "FR",
  canada: "CA",
  australia: "AU",
  "new zealand": "NZ",
  ireland: "IE",
  germany: "DE",
  "west germany": "DE",
  "east germany": "DE",
  italy: "IT",
  spain: "ES",
  portugal: "PT",
  belgium: "BE",
  switzerland: "CH",
  netherlands: "NL",
  sweden: "SE",
  denmark: "DK",
  norway: "NO",
  mexico: "MX",
  brazil: "BR",
  argentina: "AR",
  japan: "JP",
  "south korea": "KR",
  korea: "KR",
  china: "CN",
  india: "IN",
};

/** Country code from TMDB's free-text place of birth, e.g. "Paris, France" → "FR". */
export function countryFromPlaceOfBirth(place: string | null): string | null {
  if (!place) return null;
  const parts = place.split(",").map((p) => p.trim().toLowerCase());
  const last = parts.at(-1);
  if (!last) return null;
  return COUNTRY_CODES[last] ?? null;
}

export function yearFromDate(date: string | null | undefined): number | null {
  if (!date || date.length < 4) return null;
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) && year > 1800 ? year : null;
}

/** Decade of the median year of the given films, e.g. [2007, 2010, 2012] → 2010. */
export function decadeOf(films: FilmRef[]): number | null {
  const years = films
    .map((f) => f.year)
    .filter((y): y is number => y !== null)
    .sort((a, b) => a - b);
  const median = years[Math.floor((years.length - 1) / 2)];
  if (median === undefined) return null;
  return Math.floor(median / 10) * 10;
}

function toFilmRef(movie: TmdbMovieSummary, character?: string): FilmRef {
  return {
    id: movie.id,
    title: movie.title,
    year: yearFromDate(movie.release_date),
    posterPath: movie.poster_path,
    ...(character ? { character } : {}),
  };
}

function mostNotable<T extends TmdbMovieSummary>(credits: T[]): T[] {
  const seen = new Set<number>();
  return [...credits]
    .filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    })
    .sort((a, b) => b.vote_count - a.vote_count);
}

export function roleFromDepartment(department: string): Role {
  return department === "Directing" ? "director" : "actor";
}

export function toPerson(details: TmdbPersonDetails): Person {
  const role = roleFromDepartment(details.known_for_department);
  const knownFor =
    role === "director"
      ? mostNotable(details.movie_credits.crew.filter((c: TmdbCrewCredit) => c.job === "Director"))
          .slice(0, KNOWN_FOR_COUNT)
          .map((c) => toFilmRef(c))
      : mostNotable(details.movie_credits.cast)
          .slice(0, KNOWN_FOR_COUNT)
          .map((c: TmdbCastCredit) => toFilmRef(c, c.character));

  return {
    id: details.id,
    name: details.name,
    role,
    photoPath: details.profile_path,
    country: countryFromPlaceOfBirth(details.place_of_birth),
    decade: decadeOf(knownFor),
    popularity: details.popularity,
    knownFor,
  };
}

export function toFilm(details: TmdbMovieDetails): Film {
  return {
    id: details.id,
    title: details.title,
    year: yearFromDate(details.release_date),
    posterPath: details.poster_path,
    directorIds: details.credits.crew.filter((c) => c.job === "Director").map((c) => c.id),
    castIds: [...details.credits.cast]
      .sort((a, b) => a.order - b.order)
      .slice(0, TOP_CAST_COUNT)
      .map((c) => c.id),
  };
}

export { toFilmRef };
