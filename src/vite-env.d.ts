/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TMDB_TOKEN?: string;
  readonly VITE_TMDB_BASE_URL?: string;
  /** "true" to run on the built-in sample data (previews and tests only). */
  readonly VITE_SAMPLE_DATA?: string;
}
