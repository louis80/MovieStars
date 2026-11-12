# Test report: MovieStars v1

- **Reads:** [spec/spec.md](../spec/spec.md) (acceptance criteria AC1–AC11), [plan/plan.md](../plan/plan.md)
- **Date:** 2026-11-12
- **Code:** branch `build/v1`, commit `3724a95`
- **CI run:** [GitHub Actions #43234530992](https://github.com/louis80/MovieStars/actions/runs/43234530992), green (lint, 135 unit tests, build, 12 browser tests)
- **Status:** Awaiting louis80's acceptance

## Result

All 11 acceptance criteria pass. Ten are checked end to end in a phone-sized browser on the built app; AC5 depends on randomness and on who is cached, so it is checked by unit tests where both are controlled.

| AC | Criterion (short) | Browser test (`tests/e2e/`) | Unit tests (`src/`) | Result |
| --- | --- | --- | --- | --- |
| AC1 | Start a session within 2 taps | `acceptance` › AC1 (1 tap) | `app/App.test` › first launch | Pass |
| AC2 | 3 films add directors + top 5 cast, no duplicates | `acceptance` › AC2 (17 people, Nolan once) | `app/learningService.test` › addSeenFilms | Pass |
| AC3 | Every answer shows name, photo, memory anchor | `acceptance` › AC3 | `learning/cards.test` › memoryAnchor; `ui/session` tests | Pass |
| AC4 | Up one level after 2 right on different days; down one after a miss | `acceptance` › AC4 (days 1, 31, 401) | `learning/levels.test` › levels | Pass |
| AC5 | Level-2 choices from same country and decade | Points to unit test | `learning/cards.test` › distractors | Pass |
| AC6 | Recall works in 3 modes; flip ≤ 2 taps; typing forgives a typo | `acceptance` › AC6 (reaches Recall, "Strep" accepted) | `learning/answer.test`; `ui/session` › recall modes | Pass |
| AC7 | FSRS intervals grow; a miss returns in the same session | `acceptance` › AC7 | `learning/levels.test` › FSRS; `learning/session.test` | Pass |
| AC8 | "Don't show again" removes for good | `acceptance` › AC8 (not re-added by a seen film) | `app/learningService.test` › notForMe | Pass |
| AC9 | Progress survives restart; works offline once loaded | `pwa` › AC9 (offline reload, session starts) | `data/db.test` | Pass |
| AC10 | Installable, opens full-screen | `pwa` › AC10 (manifest, icons) | — | Pass |
| AC11 | About shows TMDB logo and notice | `acceptance` › AC11 | `ui/people/people.test` › About | Pass |

## Issues found by testing and fixed

| Found in | Problem | Fix |
| --- | --- | --- |
| T9 preview | Summary counted repeated answers ("6 of 18" for 10 cards) | Counts people: right first time / to review |
| T9 preview | Sample cast had no gender, so choices could mix men and women | Sample data gained genders; real TMDB data has them |
| T12 | Setting radios changed only after the save finished | Choice shows at once; saved in the background |
| T12 | Two quick setting changes could overwrite each other | Each change saved in its own transaction |

## Limits of this testing

- **Sample data, not TMDB.** This workspace cannot reach TMDB, so every test runs on hand-written data in TMDB's exact response format. Real names and films, illustrative IDs and counts. A check against live TMDB data belongs to Step 5, once the token and hosting exist.
- **Photos and posters** are placeholders in tests; image loading and offline image caching are only checked on real data.
- **Installing** is checked through the manifest and icons; adding to a real phone's home screen is a manual check at Step 5.
- **TMDB logo** comes from Simple Icons (sourced from TMDB's logo page); compare it with the official file before release.

## Your check

The [preview](https://claude.ai/artifact/SFS7s4bvi8tUqShg5iz1V7) runs the same build on the same sample data. Try a session, My people and About, then accept this report or say what is missing.
