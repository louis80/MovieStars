import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { films, fixtureFetch, people } from "../../tests/fixtures/tmdb";
import { MovieStarsDb, loadProfile, saveProfile } from "../data/db";
import { TmdbClient } from "../tmdb/client";
import { App } from "./App";
import { makeServices } from "./services";

let count = 0;

function renderApp() {
  const db = new MovieStarsDb(`app-${++count}`);
  const tmdb = new TmdbClient({ fetchFn: fixtureFetch() });
  const services = makeServices({ db, tmdb, sample: true, now: () => new Date(2026, 10, 12, 12) });
  render(<App services={services} />);
  return { db, services };
}

beforeEach(() => {
  window.location.hash = "";
});

describe("first launch", () => {
  // AC1 (path): Welcome → Start opens a session, 2 taps from launch.
  it("goes from Welcome to a session with one tap on Start", async () => {
    const user = userEvent.setup();
    const { db } = renderApp();

    await screen.findByRole("heading", { name: /put a name to every face/i });
    await user.click(screen.getByRole("button", { name: "Start" }));

    await screen.findByRole("heading", { name: "Session" });
    expect(await db.queue.count()).toBeGreaterThan(0);
    expect((await loadProfile(db)).welcomed).toBe(true);
    db.close();
  });

  it("lets the user tap films first, then adds their people", async () => {
    const user = userEvent.setup();
    const { db } = renderApp();

    await user.click(await screen.findByRole("button", { name: /tap films i've seen/i }));
    await user.click(await screen.findByRole("button", { name: /Anatomy of a Fall/ }));
    await user.click(screen.getByRole("button", { name: /Inception/ }));
    await user.click(screen.getByRole("button", { name: "Add 2 films" }));

    await screen.findByRole("heading", { name: "Ready for today's faces?" });
    expect(await db.queue.get(people.justineTriet.id)).toBeDefined();
    expect(await db.queue.get(people.christopherNolan.id)).toBeDefined();
    expect(await db.seenFilms.get(films.inception.id)).toBeDefined();
    db.close();
  });
});

describe("films screen", () => {
  it("toggles a poster and counts the selection", async () => {
    const user = userEvent.setup();
    const { db } = renderApp();
    window.location.hash = "#/films";

    const poster = await screen.findByRole("button", { name: /Oppenheimer/ });
    await user.click(poster);
    expect(poster).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Add 1 film" })).toBeInTheDocument();
    await user.click(poster);
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    db.close();
  });

  it("searches films by title", async () => {
    const user = userEvent.setup();
    const { db } = renderApp();
    window.location.hash = "#/films";

    await user.type(await screen.findByRole("searchbox", { name: "Search a film" }), "toni");
    await screen.findByRole("button", { name: /Toni Erdmann/ });
    expect(screen.queryByRole("button", { name: /Oppenheimer/ })).not.toBeInTheDocument();
    db.close();
  });
});

describe("home", () => {
  it("shows today's goal, the streak and people per level", async () => {
    const { db, services } = renderApp();
    await saveProfile(db, { ...(await loadProfile(db)), welcomed: true });
    await services.learning.addSeenFilms([films.anatomyOfAFall.id]);
    window.location.hash = "#/about";
    window.location.hash = "#/";

    await screen.findByRole("heading", { name: "Ready for today's faces?" });
    expect(screen.getByText("0-day streak")).toBeInTheDocument();
    expect(screen.getByText("0 of 10 cards")).toBeInTheDocument();
    const recognise = screen.getByText("Recognise").parentElement;
    await waitFor(() => expect(recognise).toHaveTextContent("Recognise6"));
    expect(screen.getByRole("link", { name: /Start/ })).toHaveAttribute("href", "#/session");
    db.close();
  });
});
