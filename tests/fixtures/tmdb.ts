// Hand-written fixtures in the exact shape of TMDB API v3 responses.
// Names and films are real; IDs, popularity and vote counts are illustrative.
// Replace with recorded responses once a TMDB token is available (see plan T1).

import type {
  TmdbMovieDetails,
  TmdbMovieSummary,
  TmdbPage,
  TmdbPersonDetails,
  TmdbPersonSummary,
} from "../../src/tmdb/types";

const movie = (
  id: number,
  title: string,
  release_date: string,
  vote_count: number,
): TmdbMovieSummary => ({
  id,
  title,
  release_date,
  poster_path: `/poster-${id}.jpg`,
  popularity: vote_count / 100,
  vote_count,
});

export const films = {
  inception: movie(27205, "Inception", "2010-07-15", 37000),
  laVieEnRose: movie(1407, "La Vie en Rose", "2007-02-14", 2100),
  darkKnightRises: movie(49026, "The Dark Knight Rises", "2012-07-17", 22000),
  anatomyOfAFall: movie(915935, "Anatomy of a Fall", "2023-08-23", 2600),
  sybil: movie(553604, "Sybil", "2019-05-24", 300),
  blueIsTheWarmestColor: movie(152584, "Blue Is the Warmest Colour", "2013-10-09", 2400),
  spectre: movie(206647, "Spectre", "2015-10-26", 10500),
  theDevilWearsPrada: movie(350, "The Devil Wears Prada", "2006-06-29", 13000),
  mammaMia: movie(11631, "Mamma Mia!", "2008-07-02", 7000),
  oppenheimer: movie(872585, "Oppenheimer", "2023-07-19", 9000),
  toniErdmann: movie(359940, "Toni Erdmann", "2016-07-14", 900),
};

const person = (
  id: number,
  name: string,
  known_for_department: string,
  place_of_birth: string | null,
  cast: { film: TmdbMovieSummary; character: string }[],
  directed: TmdbMovieSummary[] = [],
): TmdbPersonDetails => ({
  id,
  name,
  profile_path: `/profile-${id}.jpg`,
  known_for_department,
  place_of_birth,
  birthday: null,
  popularity: 20,
  movie_credits: {
    cast: cast.map(({ film, character }, order) => ({ ...film, character, order })),
    crew: directed.map((film) => ({ ...film, job: "Director", department: "Directing" })),
  },
});

export const people = {
  marionCotillard: person(8293, "Marion Cotillard", "Acting", "Paris, France", [
    { film: films.laVieEnRose, character: "Édith Piaf" },
    { film: films.inception, character: "Mal" },
    { film: films.darkKnightRises, character: "Miranda Tate" },
  ]),
  leaSeydoux: person(121529, "Léa Seydoux", "Acting", "Paris, France", [
    { film: films.blueIsTheWarmestColor, character: "Emma" },
    { film: films.spectre, character: "Madeleine Swann" },
  ]),
  merylStreep: person(5064, "Meryl Streep", "Acting", "Summit, New Jersey, USA", [
    { film: films.theDevilWearsPrada, character: "Miranda Priestly" },
    { film: films.mammaMia, character: "Donna" },
  ]),
  sandraHuller: person(16736, "Sandra Hüller", "Acting", "Suhl, Thuringia, East Germany", [
    { film: films.anatomyOfAFall, character: "Sandra Voyter" },
    { film: films.toniErdmann, character: "Ines Conradi" },
  ]),
  justineTriet: person(
    1257441,
    "Justine Triet",
    "Directing",
    "Fécamp, Seine-Maritime, France",
    [],
    [films.anatomyOfAFall, films.sybil],
  ),
  christopherNolan: person(
    525,
    "Christopher Nolan",
    "Directing",
    "Westminster, London, England, UK",
    [],
    [films.inception, films.darkKnightRises, films.oppenheimer],
  ),
};

const castMember = (p: TmdbPersonDetails, character: string, order: number) => ({
  id: p.id,
  name: p.name,
  profile_path: p.profile_path,
  character,
  order,
  known_for_department: p.known_for_department,
});

const extra = (id: number, name: string, order: number) => ({
  id,
  name,
  profile_path: `/profile-${id}.jpg`,
  character: "",
  order,
  known_for_department: "Acting",
});

const director = (p: TmdbPersonDetails) => ({
  id: p.id,
  name: p.name,
  profile_path: p.profile_path,
  job: "Director",
  department: "Directing",
});

export const filmDetails: Record<number, TmdbMovieDetails> = {
  [films.anatomyOfAFall.id]: {
    ...films.anatomyOfAFall,
    origin_country: ["FR"],
    credits: {
      cast: [
        castMember(people.sandraHuller, "Sandra Voyter", 0),
        extra(1015825, "Swann Arlaud", 1),
        extra(3184472, "Milo Machado-Graner", 2),
        extra(1271003, "Antoine Reinartz", 3),
        extra(1661451, "Samuel Theis", 4),
        extra(2312345, "Jehnny Beth", 5),
      ],
      crew: [director(people.justineTriet)],
    },
  },
  [films.inception.id]: {
    ...films.inception,
    origin_country: ["US", "GB"],
    credits: {
      cast: [
        extra(6193, "Leonardo DiCaprio", 0),
        extra(24045, "Joseph Gordon-Levitt", 1),
        extra(27578, "Elliot Page", 2),
        extra(2524, "Tom Hardy", 3),
        extra(3899, "Ken Watanabe", 4),
        castMember(people.marionCotillard, "Mal", 5),
      ],
      crew: [director(people.christopherNolan)],
    },
  },
};

const page = <T>(results: T[]): TmdbPage<T> => ({
  page: 1,
  results,
  total_pages: 1,
  total_results: results.length,
});

const summary = (p: TmdbPersonDetails): TmdbPersonSummary => ({
  id: p.id,
  name: p.name,
  profile_path: p.profile_path,
  known_for_department: p.known_for_department,
  popularity: p.popularity,
});

export const popularPeople = page([
  summary(people.merylStreep),
  summary(people.christopherNolan),
  summary(people.marionCotillard),
]);

export const nowPlaying = page([films.anatomyOfAFall, films.oppenheimer]);
export const trending = page([films.inception, films.anatomyOfAFall]);
export const discoverFr = page([films.anatomyOfAFall, films.blueIsTheWarmestColor]);

/** A fetch replacement that answers TMDB paths from these fixtures. */
export function fixtureFetch(log: string[] = []): typeof fetch {
  return async (input) => {
    const url = new URL(String(input));
    const path = url.pathname.replace(/^\/3/, "");
    log.push(`${path}${url.search}`);

    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
    const personMatch = path.match(/^\/person\/(\d+)$/);
    const movieMatch = path.match(/^\/movie\/(\d+)$/);

    if (path === "/person/popular") return json(popularPeople);
    if (path === "/movie/now_playing") return json(nowPlaying);
    if (path === "/trending/movie/week") return json(trending);
    if (path === "/discover/movie") return json(discoverFr);
    if (personMatch) {
      const found = Object.values(people).find((p) => p.id === Number(personMatch[1]));
      return found ? json(found) : new Response("{}", { status: 404 });
    }
    if (movieMatch) {
      const found = filmDetails[Number(movieMatch[1])];
      return found ? json(found) : new Response("{}", { status: 404 });
    }
    if (path === "/search/person") {
      const q = (url.searchParams.get("query") ?? "").toLowerCase();
      return json(
        page(
          Object.values(people)
            .filter((p) => p.name.toLowerCase().includes(q))
            .map(summary),
        ),
      );
    }
    if (path === "/search/movie") {
      const q = (url.searchParams.get("query") ?? "").toLowerCase();
      return json(page(Object.values(films).filter((f) => f.title.toLowerCase().includes(q))));
    }
    return new Response("{}", { status: 404 });
  };
}
