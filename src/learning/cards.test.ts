import { CHOICES, buildCard, distractors, memoryAnchor, type Card } from "./cards";
import { seededRng } from "./random";
import type { Film, FilmRef, Gender, Person, Role } from "./types";

let nextId = 1000;
const film = (title: string, year = 2010): FilmRef => ({
  id: nextId++,
  title,
  year,
  posterPath: null,
});

const person = (
  name: string,
  country: string | null,
  decade: number | null,
  opts: { gender?: Gender; role?: Role; knownFor?: FilmRef[] } = {},
): Person => ({
  id: nextId++,
  name,
  role: opts.role ?? "actor",
  gender: opts.gender ?? "female",
  photoPath: null,
  country,
  decade,
  popularity: 1,
  knownFor: opts.knownFor ?? [film(`${name}'s film`)],
});

const laVieEnRose = { ...film("La Vie en Rose", 2007), character: "Édith Piaf" };
const inception = { ...film("Inception", 2010), character: "Mal" };
const target = person("Marion Cotillard", "FR", 2010, { knownFor: [laVieEnRose, inception] });

const frenchSameDecade = [
  person("Léa Seydoux", "FR", 2010),
  person("Eva Green", "FR", 2010),
  person("Audrey Tautou", "FR", 2010),
  person("Adèle Exarchopoulos", "FR", 2010),
];
const others = [
  person("Meryl Streep", "US", 1980),
  person("Viola Davis", "US", 2010),
  person("Penélope Cruz", "ES", 2000),
  person("Isabelle Huppert", "FR", 1980),
  person("Tom Hardy", "GB", 2010, { gender: "male" }),
  person("Justine Triet", "FR", 2020, { role: "director" }),
];

const ctx = (pool: Person[], extra: Partial<{ films: Film[]; seen: number[] }> = {}) => ({
  pool,
  films: extra.films ?? [],
  seenFilmIds: new Set(extra.seen ?? []),
  rng: seededRng(7),
});

const names = (people: Person[]) => people.map((p) => p.name);

// AC5: level-2 choices come from the same country and decade whenever at least 3 such people exist.
describe("distractors (AC5)", () => {
  it("uses 3 people from the same country and decade at level 2", () => {
    const wrong = distractors(target, [...frenchSameDecade, ...others], 2, seededRng(1));
    expect(wrong).toHaveLength(3);
    for (const p of wrong) {
      expect(p.country).toBe("FR");
      expect(p.decade).toBe(2010);
    }
  });

  it("falls back to the same country when fewer than 3 match the decade", () => {
    const pool = [frenchSameDecade[0] as Person, ...others];
    const wrong = distractors(target, pool, 2, seededRng(1));
    expect(wrong).toHaveLength(3);
    expect(names(wrong)).toContain("Léa Seydoux");
    expect(wrong.filter((p) => p.country === "FR").length).toBeGreaterThanOrEqual(2);
  });

  it("never offers a different role or gender while others are available", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const wrong = distractors(target, [...frenchSameDecade, ...others], 1, seededRng(seed));
      expect(names(wrong)).not.toContain("Tom Hardy");
      expect(names(wrong)).not.toContain("Justine Triet");
    }
  });

  it("prefers people from another country or era at level 1", () => {
    const wrong = distractors(target, [...frenchSameDecade, ...others], 1, seededRng(3));
    for (const p of wrong) {
      expect(p.country === "FR" && p.decade === 2010).toBe(false);
    }
  });

  it("never repeats a name or includes the person themselves", () => {
    const twin = { ...frenchSameDecade[0], id: 1 } as Person;
    const wrong = distractors(target, [target, twin, ...frenchSameDecade], 2, seededRng(1));
    expect(new Set(names(wrong)).size).toBe(wrong.length);
    expect(names(wrong)).not.toContain("Marion Cotillard");
  });
});

// AC3: every answer shows a memory anchor: a film the user has seen with that person when one exists.
describe("memoryAnchor (AC3)", () => {
  it("uses a film the user has seen with them", () => {
    const anchor = memoryAnchor(target, { films: [], seenFilmIds: new Set([inception.id]) });
    expect(anchor).toEqual({ kind: "seen", film: inception });
  });

  it("finds a seen film from its cast list too", () => {
    const seen: Film = {
      id: 77,
      title: "The Dark Knight Rises",
      year: 2012,
      posterPath: null,
      directorIds: [],
      castIds: [target.id],
    };
    const anchor = memoryAnchor(target, { films: [seen], seenFilmIds: new Set([77]) });
    expect(anchor).toMatchObject({ kind: "seen", film: { title: "The Dark Knight Rises" } });
  });

  it("otherwise uses the best-known role", () => {
    const anchor = memoryAnchor(target, { films: [], seenFilmIds: new Set() });
    expect(anchor).toEqual({ kind: "known-for", film: laVieEnRose, character: "Édith Piaf" });
  });
});

describe("buildCard", () => {
  const pool = [target, ...frenchSameDecade, ...others];

  it.each([1, 2] as const)(
    "makes a 4-choice name card at level %i with the right answer",
    (level) => {
      const card = buildCard(target, level, ctx(pool));
      expect(card.kind).toBe("choose-name");
      if (card.kind !== "choose-name") return;
      expect(card.choices).toHaveLength(CHOICES);
      expect(card.choices).toContain(target);
    },
  );

  it("makes a recall card at level 3", () => {
    expect(buildCard(target, 3, ctx(pool)).kind).toBe("recall");
  });

  it("adds a seen-film hint to name and recall cards", () => {
    const card = buildCard(target, 3, ctx(pool, { seen: [inception.id] }));
    expect(card.kind === "recall" && card.hint?.title).toBe("Inception");
  });

  it("makes a connect card at level 4", () => {
    const kinds = new Set<Card["kind"]>();
    for (let seed = 1; seed <= 20; seed++) {
      const card = buildCard(target, 4, { ...ctx(pool), rng: seededRng(seed) });
      kinds.add(card.kind);
      if (card.kind === "person-to-film") {
        expect(card.choices).toHaveLength(CHOICES);
        expect(card.choices).toContain(card.film);
        expect(target.knownFor).toContain(card.film);
      }
      if (card.kind === "film-to-person") {
        expect(card.choices).toContain(target);
        expect(target.knownFor).toContain(card.film);
      }
    }
    expect(kinds).toEqual(new Set(["person-to-film", "film-to-person"]));
  });

  it("falls back to a recall card when too few people are cached", () => {
    const card = buildCard(target, 1, ctx([target, others[0] as Person]));
    expect(card.kind).toBe("recall");
  });
});
