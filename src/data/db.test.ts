import { DEFAULT_PROFILE, type QueueEntry } from "../learning/types";
import { MovieStarsDb, dbResponseCache, loadProfile, saveProfile } from "./db";

let dbCount = 0;
const freshName = () => `moviestars-test-${++dbCount}`;

const entry = (personId: number): QueueEntry => ({
  personId,
  level: 2,
  correctInARow: 1,
  lastCorrectDay: "2026-11-12",
  memory: {
    due: new Date("2026-11-14T09:00:00Z"),
    stability: 2.3,
    difficulty: 2.1,
    scheduled_days: 2,
    reps: 1,
    lapses: 0,
    learning_steps: 0,
    state: 2,
    last_review: new Date("2026-11-12T09:00:00Z"),
  },
  source: "film",
  interested: true,
  addedAt: 1,
});

describe("MovieStarsDb", () => {
  it("returns the default profile on first launch", async () => {
    const db = new MovieStarsDb(freshName());
    expect(await loadProfile(db)).toEqual(DEFAULT_PROFILE);
    db.close();
  });

  // AC9 (data part): progress survives closing and reopening the app.
  it("keeps progress after the app is closed and reopened", async () => {
    const name = freshName();
    const first = new MovieStarsDb(name);
    await first.queue.put(entry(8293));
    await first.reviewLog.add({ personId: 8293, at: 1, level: 2, grade: "good" });
    await first.seenFilms.put({ filmId: 27205, addedAt: 1 });
    await saveProfile(first, { ...DEFAULT_PROFILE, streak: 6, recallMode: "tiles" });
    first.close();

    const reopened = new MovieStarsDb(name);
    const saved = await reopened.queue.get(8293);
    expect(saved?.level).toBe(2);
    expect(saved?.memory.due).toEqual(new Date("2026-11-14T09:00:00Z"));
    expect(await reopened.reviewLog.count()).toBe(1);
    expect(await reopened.seenFilms.get(27205)).toBeDefined();
    expect(await loadProfile(reopened)).toMatchObject({ streak: 6, recallMode: "tiles" });
    reopened.close();
  });

  it("finds queue entries that are due", async () => {
    const db = new MovieStarsDb(freshName());
    await db.queue.bulkPut([
      entry(1),
      { ...entry(2), memory: { ...entry(2).memory, due: new Date("2027-01-01") } },
    ]);
    const due = await db.queue.where("memory.due").belowOrEqual(new Date("2026-11-15")).toArray();
    expect(due.map((e) => e.personId)).toEqual([1]);
    db.close();
  });

  it("persists TMDB responses for offline use", async () => {
    const name = freshName();
    const db = new MovieStarsDb(name);
    await dbResponseCache(db).set("/movie/1", { title: "Inception" }, 42);
    db.close();

    const reopened = new MovieStarsDb(name);
    expect(await dbResponseCache(reopened).get("/movie/1")).toEqual({
      value: { title: "Inception" },
      storedAt: 42,
    });
    reopened.close();
  });
});
