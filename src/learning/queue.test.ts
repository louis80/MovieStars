import {
  entriesToAdd,
  interleave,
  needsGrowth,
  newQueueEntry,
  peopleFromFilm,
  rankCandidates,
} from "./queue";
import type { Person } from "./types";

const now = new Date(2026, 10, 12, 12);

const person = (
  id: number,
  country: string | null,
  decade: number | null,
  popularity = 1,
): Person => ({
  id,
  name: `Person ${id}`,
  role: "actor",
  gender: "female",
  photoPath: null,
  country,
  decade,
  popularity,
  knownFor: [],
});

describe("peopleFromFilm", () => {
  it("lists directors then cast, without duplicates", () => {
    const film = {
      id: 1,
      title: "",
      year: null,
      posterPath: null,
      directorIds: [9, 2],
      castIds: [2, 3, 4],
    };
    expect(peopleFromFilm(film)).toEqual([9, 2, 3, 4]);
  });
});

describe("interleave", () => {
  it("takes from each group in turn and stops at the size", () => {
    expect(interleave([[1, 2, 3], [10, 11], [20]], 5)).toEqual([1, 10, 20, 2, 11]);
  });
  it("skips people already taken", () => {
    expect(
      interleave(
        [
          [1, 2],
          [1, 3],
        ],
        10,
      ),
    ).toEqual([1, 2, 3]);
  });
});

describe("entriesToAdd", () => {
  it("skips people already queued or marked Not for me", () => {
    const added = entriesToAdd([1, 2, 2, 3, 4], "film", new Set([1]), new Set([3]), now);
    expect(added.map((e) => e.personId)).toEqual([2, 4]);
    expect(added[0]).toMatchObject({ level: 1, source: "film", interested: null });
  });
});

describe("needsGrowth", () => {
  it("is true when fewer than 5 people are at level 1", () => {
    const four = [1, 2, 3, 4].map((id) => newQueueEntry(id, "starter", now));
    expect(needsGrowth(four)).toBe(true);
    expect(needsGrowth([...four, newQueueEntry(5, "starter", now)])).toBe(false);
  });
});

describe("rankCandidates", () => {
  it("puts people from seen films first, then those like the Interested ones", () => {
    const fromFilm = person(1, "US", 1990);
    const likeInterested = person(2, "FR", 2010);
    const other = person(3, "JP", 1980, 50);
    const ranked = rankCandidates([other, likeInterested, fromFilm], {
      interested: [person(99, "FR", 2010)],
      excluded: [],
      fromSeenFilms: new Set([1]),
    });
    expect(ranked.map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it("puts people like those marked Not for me last", () => {
    const similar = person(1, "US", 2000, 100);
    const different = person(2, "IT", 1970, 1);
    const ranked = rankCandidates([similar, different], {
      interested: [],
      excluded: [{ personId: 50, country: "US", decade: 2000, at: 0 }],
      fromSeenFilms: new Set(),
    });
    expect(ranked.map((p) => p.id)).toEqual([2, 1]);
  });
});
