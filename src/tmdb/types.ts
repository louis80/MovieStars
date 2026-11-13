// Shapes of the TMDB API v3 responses this app reads. Only the fields we use are listed.

export interface TmdbPage<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

/** TMDB gender codes: 0 not set, 1 female, 2 male, 3 non-binary. */
export type TmdbGender = 0 | 1 | 2 | 3;

export interface TmdbPersonSummary {
  id: number;
  name: string;
  gender?: TmdbGender;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
}

export interface TmdbMovieSummary {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  popularity: number;
  vote_count: number;
  original_language?: string;
}

export interface TmdbCastCredit extends TmdbMovieSummary {
  character: string;
  order: number;
}

export interface TmdbCrewCredit extends TmdbMovieSummary {
  job: string;
  department: string;
}

export interface TmdbPersonDetails {
  id: number;
  name: string;
  gender: TmdbGender;
  profile_path: string | null;
  known_for_department: string;
  place_of_birth: string | null;
  birthday: string | null;
  popularity: number;
  movie_credits: {
    cast: TmdbCastCredit[];
    crew: TmdbCrewCredit[];
  };
}

export interface TmdbCastMember {
  id: number;
  name: string;
  profile_path: string | null;
  character: string;
  order: number;
  known_for_department: string;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  profile_path: string | null;
  job: string;
  department: string;
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  popularity: number;
  vote_count: number;
  origin_country?: string[];
  credits: {
    cast: TmdbCastMember[];
    crew: TmdbCrewMember[];
  };
}
