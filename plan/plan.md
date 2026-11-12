# Plan: MovieStars v1

- **Reads:** [spec/spec.md](../spec/spec.md) (approved 2026-11-12), [CLAUDE.md](../CLAUDE.md)
- **Status:** Approved by louis80 on 2026-11-12

## Approach

Build the learning logic first as pure, fully tested code, then put screens on top, then make it installable. Every task ends with passing tests and its own commit. All tests use recorded TMDB responses, so the whole app can be built and tested before you have a TMDB key.

## Stack

| Need | Choice | Why |
| --- | --- | --- |
| App framework | React + TypeScript, built with Vite | Mainstream, fast, one codebase for phone and browser |
| Installable app | `vite-plugin-pwa` (manifest + service worker) | Home-screen install, full-screen, offline cache |
| On-device storage | IndexedDB via Dexie | Survives restarts; holds the queue, review log and cache |
| Spaced repetition | `ts-fsrs` | Maintained TypeScript implementation of FSRS |
| Tests | Vitest + Testing Library; Playwright for end to end | Fast unit tests; real-browser checks of the acceptance criteria |
| CI | GitHub Actions: lint, tests, build on every push | Evidence on every change |

## Tasks

Each task lists the spec acceptance criteria (AC) it proves.

| # | Task | Main files | Tests prove |
| --- | --- | --- | --- |
| T0 | Scaffold the project, lint, test runners and CI | `package.json`, `vite.config.ts`, `.github/workflows/ci.yml` | CI runs green on an empty app |
| T1 | TMDB client with typed responses, caching and recorded fixtures | `src/tmdb/` , `tests/fixtures/` | Client parses fixtures; no network in tests |
| T2 | On-device data layer: queue, review log, seen films, profile | `src/data/` | Data survives a reload (AC9, data part) |
| T3 | Scheduling: FSRS wrapper (Again/Good, 90% retention) and level rules | `src/learning/schedule.ts`, `levels.ts` | Level up/down rules (AC4); FSRS intervals grow, Again repeats in session (AC7) |
| T4 | Answer checking for typing mode: family name, one typo, accents | `src/learning/answer.ts` | AC6 (typing part) |
| T5 | Learning queue: starter set (US/FR/other), films seen, "Not for me", growth | `src/learning/queue.ts` | AC2, AC8 |
| T6 | Card builder: levels 1–4, same-country/decade choices, memory anchor | `src/learning/cards.ts` | AC3, AC5 |
| T7 | Session engine: due reviews first, daily goal, streak with weekly forgiveness | `src/learning/session.ts` | Session mix and streak rules from spec |
| T8 | Screens: Welcome, Recent films, Home, bottom navigation | `src/ui/` | AC1 (start within 2 taps) |
| T9 | Screens: Session (all card types, 3 recall modes) and Summary | `src/ui/session/` | AC6 (flip ≤ 2 taps, tiles, typing) |
| T10 | Screens: Person, Film, My people (filters, search), About with TMDB attribution | `src/ui/` | AC11 |
| T11 | PWA: manifest, icons, service worker, offline use of cached people | `vite.config.ts`, `public/` | AC9 (offline), AC10 |
| T12 | End-to-end acceptance suite covering AC1–AC11 on a phone-sized browser | `tests/e2e/` | All 11 criteria in one run |

Order: T0 → T1 → T2 → T3–T7 (logic) → T8–T10 (screens) → T11 → T12. Screens T8–T10 follow the spec's "Look and feel" section and the approved mockups. I'll show you the app running after T8, so you can compare it with them.

## How you'll see progress

- One commit per task on the `build/v1` branch, CI results on each.
- A short note in the guide after each task.
- A preview you can open on your phone once screens exist (from T8).

## Needs from you

1. **A TMDB API read access token**, needed only to run the app with real data (from T8). Create a free account on themoviedb.org and request an API key in its settings; I can't create accounts for you. Keep the token private; you'll paste it in a local settings file, never in the repo.
2. **A hosting decision, before Step 5:** a static host such as GitHub Pages is free and simple, but the TMDB token would be visible in the app's code. A small server-side proxy (for example a free serverless function) keeps it hidden. I'll lay out both at Step 5; the code will work with either.

## Risks

| Risk | Mitigation |
| --- | --- |
| Not enough same-country, same-decade people for level-2 choices | Widen to neighbouring decade, then same country (spec allows fallback below 3) |
| Country is inferred from place of birth, which is sometimes missing | Treat as "unknown" and exclude from country-specific choices |
| TMDB rate limits on first launch (starter set) | Cache everything; load the starter set in small batches |
