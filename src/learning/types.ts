// Domain types shared across the app. Pure data, no TMDB-specific fields.

export type Role = "actor" | "director";

export type Gender = "female" | "male" | "other";

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
  gender: Gender | null;
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

/** The four visible learning levels from the spec. */
export type Level = 1 | 2 | 3 | 4;

export type Grade = "again" | "good";

export type QueueSource = "starter" | "film" | "growth" | "added";

export type RecallMode = "flip" | "tiles" | "typing";

/** FSRS memory state for one person, as stored on the device. */
export interface MemoryState {
  due: Date;
  stability: number;
  difficulty: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  learning_steps: number;
  state: number;
  last_review?: Date;
}

/** One person in the learning queue. */
export interface QueueEntry {
  personId: number;
  level: Level;
  /** Correct answers in a row at the current level. */
  correctInARow: number;
  /** Local calendar day (YYYY-MM-DD) of the last correct answer at this level. */
  lastCorrectDay: string | null;
  memory: MemoryState;
  source: QueueSource;
  /** true = "Interested", false never stored (removed instead), null = not asked yet. */
  interested: boolean | null;
  addedAt: number;
}

export interface ReviewLogEntry {
  id?: number;
  personId: number;
  at: number;
  level: Level;
  grade: Grade;
}

export interface SeenFilm {
  filmId: number;
  addedAt: number;
}

/** Someone marked "Not for me": never re-added automatically. */
export interface ExcludedPerson {
  personId: number;
  country: string | null;
  decade: number | null;
  at: number;
}

export interface Profile {
  id: "me";
  streak: number;
  /** Local calendar day (YYYY-MM-DD) of the last completed session. */
  lastSessionDay: string | null;
  /** Monday (YYYY-MM-DD) of the week whose one forgiven missed day is used, if any. */
  forgivenWeek: string | null;
  dailyGoal: 5 | 10 | 20;
  recallMode: RecallMode;
}

export const DEFAULT_PROFILE: Profile = {
  id: "me",
  streak: 0,
  lastSessionDay: null,
  forgivenWeek: null,
  dailyGoal: 10,
  recallMode: "flip",
};
