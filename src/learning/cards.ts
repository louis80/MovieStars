import { pick, shuffle, type Rng } from "./random";
import type { Film, FilmRef, Level, Person } from "./types";

export const CHOICES = 4;
const DISTRACTORS = CHOICES - 1;

/** What the answer screen shows to make a name stick (spec: memory anchor). */
export type MemoryAnchor =
  { kind: "seen"; film: FilmRef } | { kind: "known-for"; film: FilmRef; character?: string };

export type Card =
  | {
      kind: "choose-name";
      level: 1 | 2;
      person: Person;
      choices: Person[];
      hint: FilmRef | null;
    }
  | { kind: "recall"; level: 3; person: Person; hint: FilmRef | null }
  | {
      kind: "film-to-person";
      level: 4;
      person: Person;
      film: FilmRef;
      choices: Person[];
    }
  | {
      kind: "person-to-film";
      level: 4;
      person: Person;
      film: FilmRef;
      choices: FilmRef[];
    };

export interface CardContext {
  /** People cached on the device, used for the wrong choices. */
  pool: Person[];
  /** Films cached on the device. */
  films: Film[];
  seenFilmIds: ReadonlySet<number>;
  rng: Rng;
}

/** A film the user has seen with this person in it, if any. */
export function seenFilmWith(
  person: Person,
  ctx: Pick<CardContext, "films" | "seenFilmIds">,
): FilmRef | null {
  const fromKnownFor = person.knownFor.find((f) => ctx.seenFilmIds.has(f.id));
  if (fromKnownFor) return fromKnownFor;
  const film = ctx.films.find(
    (f) =>
      ctx.seenFilmIds.has(f.id) &&
      (f.castIds.includes(person.id) || f.directorIds.includes(person.id)),
  );
  return film
    ? { id: film.id, title: film.title, year: film.year, posterPath: film.posterPath }
    : null;
}

/**
 * The anchor shown with every answer (spec AC3): a film the user has seen with this
 * person whenever one exists, otherwise their best-known film or role.
 */
export function memoryAnchor(
  person: Person,
  ctx: Pick<CardContext, "films" | "seenFilmIds">,
): MemoryAnchor | null {
  const seen = seenFilmWith(person, ctx);
  if (seen) return { kind: "seen", film: seen };
  const best = person.knownFor[0];
  if (!best) return null;
  return best.character
    ? { kind: "known-for", film: best, character: best.character }
    : { kind: "known-for", film: best };
}

const sameKind = (a: Person, b: Person) =>
  a.role === b.role && (a.gender === null || b.gender === null || a.gender === b.gender);

function fillFromTiers(tiers: Person[][], rng: Rng, target: Person): Person[] {
  const chosen: Person[] = [];
  const names = new Set([target.name]);
  for (const tier of tiers) {
    for (const p of shuffle(tier, rng)) {
      if (chosen.length >= DISTRACTORS) return chosen;
      if (names.has(p.name) || p.id === target.id) continue;
      names.add(p.name);
      chosen.push(p);
    }
  }
  return chosen;
}

/**
 * Wrong choices for a name card.
 * Level 1: people of the same kind who differ in country or era (easier to tell apart).
 * Level 2 (spec AC5): same country and decade whenever 3 such people exist, then the
 * neighbouring decade, then the same country, then anyone of the same kind.
 */
export function distractors(target: Person, pool: Person[], level: 1 | 2 | 4, rng: Rng): Person[] {
  const others = pool.filter((p) => p.id !== target.id);
  const alike = others.filter((p) => sameKind(p, target));
  const sameCountry = (p: Person) => target.country !== null && p.country === target.country;
  const sameDecade = (p: Person) => target.decade !== null && p.decade === target.decade;
  const nearDecade = (p: Person) =>
    target.decade !== null && p.decade !== null && Math.abs(p.decade - target.decade) === 10;

  const tiers =
    level === 2
      ? [
          alike.filter((p) => sameCountry(p) && sameDecade(p)),
          alike.filter((p) => sameCountry(p) && nearDecade(p)),
          alike.filter(sameCountry),
          alike,
          others,
        ]
      : [alike.filter((p) => !sameCountry(p) || !sameDecade(p)), alike, others];

  return fillFromTiers(tiers, rng, target);
}

function chooseNameCard(level: 1 | 2, person: Person, ctx: CardContext): Card | null {
  const wrong = distractors(person, ctx.pool, level, ctx.rng);
  if (wrong.length < DISTRACTORS) return null;
  return {
    kind: "choose-name",
    level,
    person,
    choices: shuffle([person, ...wrong], ctx.rng),
    hint: seenFilmWith(person, ctx),
  };
}

function filmToPersonCard(person: Person, ctx: CardContext): Card | null {
  const film = pick(person.knownFor, ctx.rng);
  if (!film) return null;
  const inFilm = (p: Person) => p.knownFor.some((f) => f.id === film.id);
  const wrong = distractors(
    person,
    ctx.pool.filter((p) => !inFilm(p)),
    4,
    ctx.rng,
  );
  if (wrong.length < DISTRACTORS) return null;
  return {
    kind: "film-to-person",
    level: 4,
    person,
    film,
    choices: shuffle([person, ...wrong], ctx.rng),
  };
}

function personToFilmCard(person: Person, ctx: CardContext): Card | null {
  const film = pick(person.knownFor, ctx.rng);
  if (!film) return null;
  const theirs = new Set(person.knownFor.map((f) => f.id));
  const seen = new Set<number>([film.id]);
  const wrong: FilmRef[] = [];
  for (const other of shuffle(ctx.pool, ctx.rng)) {
    for (const f of other.knownFor) {
      if (wrong.length >= DISTRACTORS) break;
      if (theirs.has(f.id) || seen.has(f.id)) continue;
      seen.add(f.id);
      wrong.push(f);
    }
  }
  if (wrong.length < DISTRACTORS) return null;
  return {
    kind: "person-to-film",
    level: 4,
    person,
    film,
    choices: shuffle([film, ...wrong], ctx.rng),
  };
}

/**
 * Build the card for a person at their level. When the device does not yet hold
 * enough people for a choice card, it falls back to a recall card, which needs none.
 */
export function buildCard(person: Person, level: Level, ctx: CardContext): Card {
  const recall: Card = { kind: "recall", level: 3, person, hint: seenFilmWith(person, ctx) };
  if (level === 3) return recall;
  if (level === 1 || level === 2) return chooseNameCard(level, person, ctx) ?? recall;

  const order =
    ctx.rng() < 0.5 ? [filmToPersonCard, personToFilmCard] : [personToFilmCard, filmToPersonCard];
  for (const make of order) {
    const card = make(person, ctx);
    if (card) return card;
  }
  return recall;
}
