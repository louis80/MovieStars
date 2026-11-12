# Spec: MovieStars v1

- **Reads:** [intent/intent.md](../intent/intent.md) (approved 2026-11-12)
- **Status:** Draft, awaiting approval

## Summary

MovieStars v1 is an English-language website that installs on a phone like an app. It teaches the names of movie stars and directors, and the films they made, through short daily sessions that get progressively harder. Movie data comes from the TMDB API. Progress is stored on the device; there is no account.

## Screens

| # | Screen | What it shows | Main action |
| --- | --- | --- | --- |
| 1 | **Welcome** (first launch only) | One line on what the app does | "Start", or "First, tap films I've seen" |
| 2 | **Recent films** | Grid of posters: now playing and trending this week, plus a search box | Tap the films you've seen, then "Done" |
| 3 | **Home** | Streak, today's goal (e.g. 10 cards), level counts, "Play" button | Start today's session in one tap |
| 4 | **Session** | One card at a time (see Card types), progress bar | Answer; see feedback; next |
| 5 | **Session summary** | Cards right/wrong, people who levelled up, streak | Back to Home, or "One more round" |
| 6 | **Person** | Photo, name, role (actor/director), country, known-for films with posters | "Interested / Not for me"; open a film |
| 7 | **Film** | Poster, title, year, director, main cast | Open a person; "I've seen this" |
| 8 | **My people** | Everyone in the learning queue, grouped by level, with optional filters (country, era, role) and search | Open a person; remove from queue |
| 9 | **About** | What the app is, TMDB logo and notice | — |

Navigation: a bottom bar with **Home**, **My people**, and **I just watched…** (opens screen 2). About is reachable from Home.

## Who gets learned: the learning queue

The queue is the list of people the app will quiz you on. It fills itself; picking is never required.

- **Starter set:** on first launch the queue is seeded with about 20 popular actors and directors from TMDB, mixing US, French and other countries.
- **Recent films:** each film tapped on screen 2 adds its director and its top 5 billed cast.
- **Taste signal:** during sessions, a new face shows "Interested / Not for me" buttons. "Not for me" removes the person and makes similar people (same country and era) less likely to be added.
- **Growth:** when fewer than 5 people are left at level 1, the app adds new people, favouring the countries and eras of people marked "Interested" and the casts of films already seen.
- **Optional controls:** filters and name search on My people, and "Add" on any Person page.

## Card types and levels

Each person in the queue has a level from 1 to 4. A card tests one person at their current level.

| Level | Name | Card | Example |
| --- | --- | --- | --- |
| 1 | Recognise | Photo + 4 name choices, different-looking people | Photo → "Marion Cotillard" among 4 |
| 2 | Distinguish | Photo + 4 name choices from the same country and era | Photo → pick among 4 French actresses of the 2000s |
| 3 | Recall | Photo + text box; spelling-tolerant check | Type "Cotillard" |
| 4 | Connect | A film or a person, linking question | "Who directed *Anatomie d'une chute*?" or "Which of these films was she in?" |

Directors use the same levels; their level-4 cards link them to the films they directed.

**Hints.** When a person was added from a film you've seen, cards at levels 1–3 can show that film as a hint ("You saw them in *Oppenheimer*"), tap to reveal.

**Feedback after every answer.** The correct name, photo and one known-for film are always shown, right or wrong, so every card teaches.

## Progression rules

- **Level up:** 2 correct answers in a row at the current level, on different days.
- **Level down:** a wrong answer drops the person one level (never below 1).
- **Spacing:** a person answered correctly comes back after 1, 3, 7, then 14 days; a wrong answer brings them back in the same session and the next day.
- **Mastered:** after a correct level-4 answer, the person is "mastered" and only comes back for review every 30 days.
- **Session mix:** today's session takes due reviews first, then new people, up to the daily goal (default 10 cards, adjustable to 5, 10 or 20).

## Engagement (healthy habit, no dark patterns)

- **Streak:** days in a row with at least one completed session. One missed day per week is forgiven automatically.
- **Visible progress:** counts per level on Home; a short "levelled up" moment in the summary.
- **Short by design:** a session ends at the daily goal; "One more round" is offered once, never automatically.
- **No:** endless feeds, push notifications in v1, timers, penalties, or fake urgency.

## Data

From TMDB (fetched as needed, cached on the device):

- People: name, photo, known-for department (Acting / Directing), place of birth, popularity, and their film credits.
- Films: title, year, poster, director, top-billed cast.
- Lists: popular people, now-playing and trending films, search for people and films.

Stored on the device only:

| Item | Fields |
| --- | --- |
| Queue entry | TMDB person ID, level (1–4), next review date, correct-in-a-row count, source (starter / film / added), interested flag |
| Seen films | TMDB film ID, date added |
| Profile | Streak count, last session date, daily goal |

Country and era for a person are derived from place of birth and the years of their main films.

## Acceptance criteria

1. On first launch, a user can start a session within 2 taps (Welcome → Start).
2. Tapping 3 films on Recent films adds each film's director and top 5 cast to the queue, without duplicates.
3. Every card shows the correct answer, a photo and a known-for film after the user answers.
4. A person answered correctly twice in a row on different days moves up exactly one level; a wrong answer moves them down one level, never below 1.
5. Level-2 choices come from the same country and decade as the person whenever at least 3 such people are available.
6. Level-3 accepts the family name alone and tolerates one typo or a missing accent ("Cotilard", "Celine").
7. "Not for me" removes the person from the queue, and they are not re-added automatically.
8. Progress survives closing and reopening the app, and works offline for people already cached.
9. The app can be installed to a phone's home screen and opens full-screen.
10. The About page shows the TMDB logo and the notice "This product uses the TMDB API but is not endorsed or certified by TMDB."

## Out of scope for v1

- Store apps (iOS/Android)
- Accounts and sync across devices
- French interface
- Push notifications
- TV series
- Social features (sharing, leaderboards)
