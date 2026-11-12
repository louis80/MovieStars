import { filmDetails, films, fixtureFetch, people } from "../../tests/fixtures/tmdb";
import { MovieStarsDb } from "../data/db";
import { TmdbClient } from "../tmdb/client";
import { LearningService } from "./learningService";

let count = 0;

function setup() {
  const db = new MovieStarsDb(`learning-service-${++count}`);
  const tmdb = new TmdbClient({ fetchFn: fixtureFetch() });
  const service = new LearningService(db, tmdb, () => new Date(2026, 10, 12, 12));
  return { db, service };
}

const expectedFromFilm = (id: number) => {
  const details = filmDetails[id];
  if (!details) throw new Error("missing fixture");
  const directors = details.credits.crew.filter((c) => c.job === "Director").map((c) => c.id);
  const top5 = [...details.credits.cast]
    .sort((a, b) => a.order - b.order)
    .slice(0, 5)
    .map((c) => c.id);
  return [...directors, ...top5];
};

// AC2: tapping 3 films adds each film's director and top 5 cast, without duplicates.
describe("addSeenFilms (AC2)", () => {
  it("adds each film's director and top 5 cast, once each", async () => {
    const { db, service } = setup();
    const filmIds = [films.anatomyOfAFall.id, films.inception.id, films.darkKnightRises.id];

    await service.addSeenFilms(filmIds);

    const queued = (await db.queue.toArray()).map((e) => e.personId).sort((a, b) => a - b);
    const expected = [...new Set(filmIds.flatMap(expectedFromFilm))].sort((a, b) => a - b);
    expect(queued).toEqual(expected);
    // Nolan directed two of the films and Tom Hardy is in both: still one entry each.
    expect(queued.filter((id) => id === people.christopherNolan.id)).toHaveLength(1);
    expect(queued.filter((id) => id === 2524)).toHaveLength(1);
    // Cotillard is billed 6th in both Nolan films, so she is not added.
    expect(queued).not.toContain(people.marionCotillard.id);
    expect(await db.seenFilms.count()).toBe(3);
    db.close();
  });

  it("marks the new people as coming from a film", async () => {
    const { db, service } = setup();
    await service.addSeenFilms([films.anatomyOfAFall.id]);
    const triet = await db.queue.get(people.justineTriet.id);
    expect(triet?.source).toBe("film");
    db.close();
  });

  it("skips a film it cannot load", async () => {
    const { db, service } = setup();
    expect(await service.addSeenFilms([424242])).toBe(0);
    db.close();
  });
});

// AC8: "Not for me" removes the person, and they are not re-added automatically.
describe("notForMe (AC8)", () => {
  it("removes the person and keeps them out afterwards", async () => {
    const { db, service } = setup();
    await service.addSeenFilms([films.anatomyOfAFall.id]);
    await service.notForMe(people.sandraHuller.id);

    expect(await db.queue.get(people.sandraHuller.id)).toBeUndefined();

    // Seeing another film with her, or the queue growing, does not bring her back.
    await service.addSeenFilms([films.anatomyOfAFall.id]);
    await service.growIfNeeded();
    expect(await db.queue.get(people.sandraHuller.id)).toBeUndefined();
    db.close();
  });

  it("remembers the country and decade for taste ranking", async () => {
    const { db, service } = setup();
    await service.addPerson(people.marionCotillard.id);
    await service.notForMe(people.marionCotillard.id);
    expect(await db.excluded.get(people.marionCotillard.id)).toMatchObject({
      country: "FR",
      decade: 2010,
    });
    db.close();
  });
});

describe("seedStarter", () => {
  it("fills the queue from several countries on first launch, once", async () => {
    const { db, service } = setup();
    const added = await service.seedStarter();
    expect(added).toBeGreaterThan(0);
    expect(added).toBeLessThanOrEqual(20);

    const countries = new Set((await db.people.toArray()).map((p) => p.country));
    expect(countries).toContain("US");
    expect(countries).toContain("FR");

    expect(await service.seedStarter()).toBe(0);
    db.close();
  });
});

describe("growIfNeeded", () => {
  it("adds people from seen films and popular lists when level 1 runs low", async () => {
    const { db, service } = setup();
    await service.addPerson(people.merylStreep.id);
    const added = await service.growIfNeeded();
    expect(added).toBeGreaterThan(0);
    expect((await db.queue.toArray()).filter((e) => e.source === "growth")).toHaveLength(added);
    db.close();
  });

  it("does nothing while there are enough new people", async () => {
    const { db, service } = setup();
    await service.addSeenFilms([films.inception.id]);
    expect(await service.growIfNeeded()).toBe(0);
    db.close();
  });
});

describe("recordAnswer and finishSession", () => {
  it("saves the new level and memory, logs the answer, and updates the streak", async () => {
    const { db, service } = setup();
    await service.addPerson(people.merylStreep.id);

    const updated = await service.recordAnswer(people.merylStreep.id, "good");
    expect(updated?.memory.reps).toBe(1);
    expect((await db.queue.get(people.merylStreep.id))?.memory.reps).toBe(1);
    expect(await db.reviewLog.count()).toBe(1);

    const profile = await service.finishSession();
    expect(profile).toMatchObject({ streak: 1, lastSessionDay: "2026-11-12" });
    db.close();
  });

  it("ignores an answer for someone not in the queue", async () => {
    const { db, service } = setup();
    expect(await service.recordAnswer(1, "good")).toBeUndefined();
    expect(await db.reviewLog.count()).toBe(0);
    db.close();
  });
});

describe("homeSummary faces", () => {
  it("lists at most 12 faces, best known first, and counts who you know well", async () => {
    const { db, service } = setup();
    await service.addSeenFilms([
      films.anatomyOfAFall.id,
      films.inception.id,
      films.darkKnightRises.id,
    ]);
    await db.queue.update(people.justineTriet.id, { level: 3 });

    const summary = await service.homeSummary();
    expect(summary.total).toBeGreaterThan(12);
    expect(summary.faces).toHaveLength(12);
    expect(summary.faces[0]).toMatchObject({ name: "Justine Triet", level: 3 });
    expect(summary.knownWell).toBe(1);
    db.close();
  });
});
