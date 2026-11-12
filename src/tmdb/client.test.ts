import { fixtureFetch, films, people } from "../../tests/fixtures/tmdb";
import { TmdbClient, TmdbError, imageUrl, memoryCache } from "./client";

describe("TmdbClient", () => {
  it("sends the token and maps a person", async () => {
    const calls: { url: string; auth: string | undefined }[] = [];
    const inner = fixtureFetch();
    const client = new TmdbClient({
      token: "test-token",
      fetchFn: async (input, init) => {
        calls.push({
          url: String(input),
          auth: (init?.headers as Record<string, string>).authorization,
        });
        return inner(input, init);
      },
    });

    const person = await client.person(people.marionCotillard.id);

    expect(person.name).toBe("Marion Cotillard");
    expect(calls[0]?.auth).toBe("Bearer test-token");
    expect(calls[0]?.url).toContain("append_to_response=movie_credits");
  });

  it("omits the token when talking to a proxy", async () => {
    let auth: string | undefined = "unset";
    const inner = fixtureFetch();
    const client = new TmdbClient({
      baseUrl: "https://proxy.example/3",
      fetchFn: async (input, init) => {
        auth = (init?.headers as Record<string, string>).authorization;
        return inner(input, init);
      },
    });
    await client.film(films.inception.id);
    expect(auth).toBeUndefined();
  });

  it("serves repeat requests from the cache", async () => {
    const log: string[] = [];
    const client = new TmdbClient({ fetchFn: fixtureFetch(log) });
    await client.film(films.anatomyOfAFall.id);
    await client.film(films.anatomyOfAFall.id);
    expect(log).toHaveLength(1);
  });

  it("refetches after the cache expires", async () => {
    const log: string[] = [];
    let now = 0;
    const client = new TmdbClient({ fetchFn: fixtureFetch(log), maxAgeMs: 1000, now: () => now });
    await client.trendingFilms();
    now = 2000;
    await client.trendingFilms();
    expect(log).toHaveLength(2);
  });

  it("falls back to a stale copy when offline", async () => {
    const cache = memoryCache();
    let now = 0;
    const online = new TmdbClient({
      fetchFn: fixtureFetch(),
      cache,
      maxAgeMs: 1000,
      now: () => now,
    });
    await online.nowPlaying();

    now = 5000;
    const offline = new TmdbClient({
      fetchFn: async () => {
        throw new TypeError("Failed to fetch");
      },
      cache,
      maxAgeMs: 1000,
      now: () => now,
    });
    const page = await offline.nowPlaying();
    expect(page.results[0]?.title).toBe("Anatomy of a Fall");
  });

  it("throws a TmdbError for an unknown id", async () => {
    const client = new TmdbClient({ fetchFn: fixtureFetch() });
    await expect(client.person(1)).rejects.toBeInstanceOf(TmdbError);
  });

  it("searches people by name", async () => {
    const client = new TmdbClient({ fetchFn: fixtureFetch() });
    const page = await client.searchPeople("cotill");
    expect(page.results.map((p) => p.name)).toEqual(["Marion Cotillard"]);
  });
});

describe("imageUrl", () => {
  it("builds a TMDB image URL", () => {
    expect(imageUrl("/abc.jpg", "w185")).toBe("https://image.tmdb.org/t/p/w185/abc.jpg");
  });
  it("is null without a path", () => {
    expect(imageUrl(null)).toBeNull();
  });
});
