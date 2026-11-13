import { MissingTmdbSettingsError, createServices } from "./services";

describe("createServices", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses to fall back to sample data in a release build without TMDB settings", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_TMDB_TOKEN", "");
    vi.stubEnv("VITE_TMDB_BASE_URL", "");
    vi.stubEnv("VITE_SAMPLE_DATA", "");
    await expect(createServices()).rejects.toBeInstanceOf(MissingTmdbSettingsError);
  });

  it("uses sample data when asked for explicitly", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("VITE_TMDB_TOKEN", "");
    vi.stubEnv("VITE_TMDB_BASE_URL", "");
    vi.stubEnv("VITE_SAMPLE_DATA", "true");
    const services = await createServices();
    expect(services.sample).toBe(true);
    services.db.close();
  });

  it("uses TMDB when a token is set", async () => {
    vi.stubEnv("VITE_TMDB_TOKEN", "test-token");
    const services = await createServices();
    expect(services.sample).toBe(false);
    services.db.close();
  });
});
