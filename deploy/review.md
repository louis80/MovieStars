# Release review: MovieStars v1

- **Reads:** [test/report.md](../test/report.md) (accepted 2026-11-12), [spec/spec.md](../spec/spec.md)
- **Pull request:** [#1 MovieStars v1](https://github.com/louis80/MovieStars/pull/1), `build/v1` → `main`
- **Reviewed:** commit `084d9cd`; fixes in `ee98ddb`
- **Status:** Release approved by louis80 on 2026-11-13

## Verdict

The code is ready to release once the hosting and the TMDB token are settled. The review found four problems; all are fixed and tested. Four checks need real TMDB data or a real phone, so they happen during deployment.

## What was checked

| Area | How | Result |
| --- | --- | --- |
| Dependencies | `npm audit` | Nothing in the shipped app. 15 low/moderate advisories in build tools only (workbox-build's deepmerge, glob, minimatch) |
| Secrets | Searched the history for tokens and `.env` files | None committed; `.env.local` is git-ignored |
| Unsafe code | Searched for `innerHTML`, `eval`, unescaped HTML | None; the one external link uses `rel="noreferrer"` |
| Personal data | Read the data layer | Everything stays on the device (IndexedDB); nothing is sent anywhere but TMDB requests |
| TMDB terms | About page, image use | Logo and notice present (AC11); images loaded from TMDB's own image server |
| Type safety | Strict TypeScript, lint | No `any`; lint clean |
| Size | Production build | 138 kB of JavaScript (gzipped); 713 kB stored for offline use |
| Spec conformance | Screens against `spec.md` | Matches, including the three changes approved during build |

## Findings

| # | Finding | Risk | Status |
| --- | --- | --- | --- |
| 1 | The starter set loaded about 30 people and films one after another, slow on a phone | First launch could take several seconds | Fixed: 4 requests at a time |
| 2 | A first launch with no connection said "Everyone is scheduled for later" | Confusing; looks broken | Fixed: "No faces yet" with Try again |
| 3 | A session where every card was hidden still counted towards the streak | Streak could grow without learning | Fixed: needs at least one answer |
| 4 | A release built without the TMDB token quietly showed the sample data | Real users would see fake data | Fixed: sample data needs an explicit flag; otherwise a setup message |

Each fix has a test; 140 unit tests and 12 browser tests pass.

## Open before going live

| Decision or check | Who | Notes |
| --- | --- | --- |
| Hosting | louis80 | **Decided 2026-11-12: option A, GitHub Pages, repo made public.** The token will be readable in the published app; accepted for a personal app. Option B stays available later without code changes |
| Make the repo public; turn on Pages (source: GitHub Actions) | louis80 | Repository settings |
| TMDB API Read Access Token, saved as the repo secret `TMDB_TOKEN` | louis80 | Never pasted in chat or committed; the deploy fails with a clear message if it is missing |
| Compare the TMDB logo with the official file | louis80 + Claude | Ours is from Simple Icons; TMDB's logo page was unreachable from the build workspace |
| First run on real TMDB data | Claude | Photos, posters, country detection and look-alike choices on real people |
| Install on a real phone | louis80 | Add to home screen, open full-screen, try once offline |

## Hosting options

| | A. Static host only | B. Static host + small proxy |
| --- | --- | --- |
| Where | GitHub Pages (free, from this repo) | GitHub Pages + a free serverless function (for example Cloudflare Workers) |
| TMDB token | Inside the app's code, readable by anyone who looks | Stays on the server; the app calls the proxy |
| Risk | Someone could reuse your token; TMDB could rate-limit or revoke it | Low |
| Setup for you | Add the token as a repository secret | Same, plus a free account on the function host |
| Recommended for | A personal app shared with a few people | Anything public |

The app already supports both: `VITE_TMDB_TOKEN` for A, `VITE_TMDB_BASE_URL` for B.
