# CLAUDE.md — MovieStars

Context for any Claude session working in this repo. Read this first.

## What this is

MovieStars is an installable web app (PWA) that teaches the names of movie stars and directors, and their films, with progressive quizzes and spaced repetition. English interface, progress stored on the device, data from the TMDB API.

## The artifact chain (AI-native SDLC)

Each stage reads the previous artifact. Do not skip ahead.

| Stage | Artifact | Rule |
| --- | --- | --- |
| Plan | `intent/intent.md` | Owner: louis80. Never edit without his request. |
| Design | `spec/spec.md` | Source of truth for behaviour. Scope changes go here first, approved by louis80, before code changes. |
| Build | `plan/plan.md`, then code | Work task by task; each task lands with its tests. |
| Test | tests + CI results | Acceptance criteria in `spec.md` are numbered AC1–AC11; tests reference them. |

Drafts go on a branch (`plan/…`, `design/…`, `build/…`) and reach `main` only after louis80 approves.

## Commands

```bash
npm install          # install dependencies
npm run dev          # local dev server
npm run build        # type-check and production build
npm test             # unit and component tests (Vitest)
npm run test:e2e     # end-to-end tests (Playwright), TMDB mocked
npm run lint         # lint and format check
```

Run `npm run lint && npm test` before every commit.

## Architecture

```
src/
  tmdb/        TMDB client: the only code that calls the network. Typed responses, caching.
  data/        IndexedDB via Dexie: queue, review log, seen films, profile.
  learning/    Pure logic, no UI: queue growth, card selection, levels, FSRS wrapper, answer checking.
  ui/          React screens and components.
  app/         Routing, PWA setup, app shell, and services that wire tmdb/ + data/ + learning/.
tests/
  fixtures/    Recorded TMDB responses used by all tests.
  e2e/         Playwright tests.
```

- `learning/` is pure TypeScript with no React and no network: all of the learning rules live here and are unit-tested.
- UI never calls TMDB directly; it goes through `tmdb/`.
- Scheduling uses the `ts-fsrs` library with default parameters and 90% target retention. Do not hand-roll intervals.

## Conventions

- TypeScript strict mode; no `any`.
- Small functions, named exports, one component per file.
- Dates handled in UTC; "different days" for levelling means different local calendar days.
- Accessible by default: real buttons, alt text on photos, keyboard reachable.

## Must never happen

- **Never commit a TMDB key or token.** It is read from `VITE_TMDB_TOKEN` in `.env.local`, which is git-ignored.
- **Never remove or hide the TMDB attribution** (logo + notice on About). It is a condition of free use.
- **No dark patterns:** no endless feeds, timers, fake urgency, or automatic extra rounds (see spec, Engagement).
- No tests that hit the real TMDB API; use fixtures.

## Recurring corrections

(Add lessons here as they come up, one line each, newest first.)
