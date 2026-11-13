import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { films, fixtureFetch, people } from "../../../tests/fixtures/tmdb";
import { App } from "../../app/App";
import { makeServices } from "../../app/services";
import { MovieStarsDb, loadProfile, saveProfile } from "../../data/db";
import { TmdbClient } from "../../tmdb/client";

let count = 0;

async function setup(
  hash: string,
  seenFilms: number[] = [films.anatomyOfAFall.id],
  before?: (db: MovieStarsDb, services: ReturnType<typeof makeServices>) => Promise<unknown>,
) {
  const db = new MovieStarsDb(`people-${++count}`);
  const tmdb = new TmdbClient({ fetchFn: fixtureFetch() });
  const services = makeServices({ db, tmdb, sample: true, now: () => new Date(2026, 10, 12, 12) });
  await saveProfile(db, { ...(await loadProfile(db)), welcomed: true });
  await services.learning.addSeenFilms(seenFilms);
  if (before) await before(db, services);
  window.location.hash = hash;
  render(<App services={services} />);
  return { db, services, user: userEvent.setup() };
}

afterEach(() => {
  window.location.hash = "";
});

describe("My people", () => {
  it("groups people by level, best known first", async () => {
    const { db } = await setup("#/people", undefined, (d) =>
      d.queue.update(people.justineTriet.id, { level: 3 }),
    );

    const recall = await screen.findByRole("region", { name: "Recall" });
    expect(within(recall).getByText("Justine Triet")).toBeInTheDocument();
    const recognise = screen.getByRole("region", { name: "Recognise" });
    expect(within(recognise).getByText("Sandra Hüller")).toBeInTheDocument();
    const order = screen.getAllByRole("region").map((r) => r.getAttribute("aria-label"));
    expect(order.indexOf("Recall")).toBeLessThan(order.indexOf("Recognise"));
    db.close();
  });

  it("filters by role and country", async () => {
    const { db, user } = await setup("#/people");
    await screen.findByText("Sandra Hüller");

    await user.click(screen.getByRole("button", { name: "Directors" }));
    expect(screen.getByText("Justine Triet")).toBeInTheDocument();
    expect(screen.queryByText("Sandra Hüller")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Everyone" }));
    await user.selectOptions(screen.getByLabelText("Country"), "DE");
    expect(screen.getByText("Sandra Hüller")).toBeInTheDocument();
    expect(screen.queryByText("Justine Triet")).not.toBeInTheDocument();
    db.close();
  });

  it("searches the list and offers people not in it yet", async () => {
    const { db, user } = await setup("#/people");
    await screen.findByText("Sandra Hüller");
    await user.type(screen.getByRole("searchbox", { name: "Search a name" }), "huller");
    expect(screen.getByText("Sandra Hüller")).toBeInTheDocument();
    expect(screen.queryByText("Justine Triet")).not.toBeInTheDocument();

    await user.clear(screen.getByRole("searchbox"));
    await user.type(screen.getByRole("searchbox"), "streep");
    const outside = await screen.findByRole("region", { name: "Not in your list yet" });
    expect(within(outside).getByText("Meryl Streep")).toBeInTheDocument();
    db.close();
  });

  it("shows a helpful empty state", async () => {
    const { db } = await setup("#/people", []);
    await screen.findByText(/No one yet/);
    expect(screen.getByRole("link", { name: "I just watched…" })).toBeInTheDocument();
    db.close();
  });
});

describe("person page", () => {
  it("shows the level and best-known films", async () => {
    const { db } = await setup(`#/person/${people.sandraHuller.id}`);
    await screen.findByRole("heading", { name: "Sandra Hüller" });
    expect(screen.getByText("In your list · Level 1 · Recognise")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Toni Erdmann \(2016\)/ })).toHaveAttribute(
      "href",
      `#/film/${films.toniErdmann.id}`,
    );
    db.close();
  });

  it("adds someone who is not in the list", async () => {
    const { db, user } = await setup(`#/person/${people.merylStreep.id}`);
    await user.click(await screen.findByRole("button", { name: "Add to my list" }));
    await screen.findByText("In your list · Level 1 · Recognise");
    expect(await db.queue.get(people.merylStreep.id)).toBeDefined();
    db.close();
  });

  it("brings back someone hidden with Don't show again", async () => {
    const { db, user } = await setup(`#/person/${people.sandraHuller.id}`, undefined, (_, s) =>
      s.learning.notForMe(people.sandraHuller.id),
    );
    await user.click(await screen.findByRole("button", { name: "Add back" }));
    await screen.findByText("In your list · Level 1 · Recognise");
    expect(await db.excluded.get(people.sandraHuller.id)).toBeUndefined();
    db.close();
  });

  it("can hide a person with Don't show again", async () => {
    const { db, user } = await setup(`#/person/${people.sandraHuller.id}`);
    await user.click(await screen.findByRole("button", { name: "Don't show again" }));
    await waitFor(async () => expect(await db.queue.get(people.sandraHuller.id)).toBeUndefined());
    db.close();
  });
});

describe("film page", () => {
  it("lists the director and cast, and adds them when marked as seen", async () => {
    const { db, user } = await setup(`#/film/${films.inception.id}`, []);
    await screen.findByRole("heading", { name: "Inception" });
    const directed = screen.getByRole("region", { name: "Directed by" });
    expect(within(directed).getByText("Christopher Nolan")).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Main cast" })).getAllByRole("link"),
    ).toHaveLength(5);

    await user.click(screen.getByRole("button", { name: "I've seen this" }));
    await screen.findByText(/You've seen this/);
    expect(await db.queue.get(people.christopherNolan.id)).toBeDefined();
    db.close();
  });
});

// AC11: the About page shows the TMDB logo and the required notice.
describe("About (AC11)", () => {
  it("shows the TMDB logo and notice", async () => {
    const { db } = await setup("#/about", []);
    await screen.findByRole("heading", { name: "About MovieStars" });
    expect(screen.getByRole("img", { name: "The Movie Database (TMDB)" })).toBeInTheDocument();
    expect(
      screen.getByText("This product uses the TMDB API but is not endorsed or certified by TMDB."),
    ).toBeInTheDocument();
    db.close();
  });

  it("saves the daily goal and the recall answer mode", async () => {
    const { db, user } = await setup("#/about", []);
    await user.click(await screen.findByLabelText("20"));
    await user.click(screen.getByRole("radio", { name: /Letter tiles/ }));
    await waitFor(async () =>
      expect(await loadProfile(db)).toMatchObject({ dailyGoal: 20, recallMode: "tiles" }),
    );
    db.close();
  });
});
