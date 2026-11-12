# Spec: MovieStars v1

- **Reads:** [intent/intent.md](../intent/intent.md) (approved 2026-11-12)
- **Status:** Approved by louis80 on 2026-11-12

## Summary

MovieStars v1 is an English-language website that installs on a phone like an app. It teaches the names of movie stars and directors, and the films they made, through short daily sessions that get progressively harder. Movie data comes from the TMDB API. Progress is stored on the device; there is no account.

## Screens

| # | Screen | What it shows | Main action |
| --- | --- | --- | --- |
| 1 | **Welcome** (first launch only) | One line on what the app does | "Start", or "First, tap films I've seen" |
| 2 | **Recent films** | Grid of posters: now playing and trending this week, plus a search box | Tap the films you've seen, then "Done" |
| 3 | **Home** | Streak, today's goal (e.g. 10 cards), "Start" button, and a row of the faces you're learning | Start today's session in one tap |
| 4 | **Session** | One card at a time (see Card types), progress bar | Answer; see feedback; next |
| 5 | **Session summary** | Cards right/wrong, people who levelled up, streak | Back to Home, or "One more round" |
| 6 | **Person** | Photo, name, role (actor/director), country, known-for films with posters | "More like this / Don't show again"; open a film |
| 7 | **Film** | Poster, title, year, director, main cast | Open a person; "I've seen this" |
| 8 | **My people** | Everyone in the learning queue, grouped by level, with optional filters (country, era, role) and search | Open a person; remove from queue |
| 9 | **About** | What the app is, TMDB logo and notice | — |

Navigation: a bottom bar with **Home**, **My people**, and **I just watched…** (opens screen 2). About is reachable from Home.

## Who gets learned: the learning queue

The queue is the list of people the app will quiz you on. It fills itself; picking is never required.

- **Starter set:** on first launch the queue is seeded with about 20 popular actors and directors from TMDB, mixing US, French and other countries.
- **Recent films:** each film tapped on screen 2 adds its director and its top 5 billed cast.
- **Taste signal:** during sessions, the first time a person appears, the card shows "More like this / Don't show again" buttons. "Don't show again" removes the person and makes similar people (same country and era) less likely to be added.
- **Growth:** when fewer than 5 people are left at level 1, the app adds new people, favouring the countries and eras of people marked "More like this" and the casts of films already seen.
- **Optional controls:** filters and name search on My people, and "Add" on any Person page.

## Card types and levels

Each person in the queue has a level from 1 to 4. A card tests one person at their current level.

| Level | Name | Card | Example |
| --- | --- | --- | --- |
| 1 | Recognise | Photo + 4 name choices, different-looking people | Photo → "Marion Cotillard" among 4 |
| 2 | Distinguish | Photo + 4 name choices from the same country and era | Photo → pick among 4 French actresses of the 2000s |
| 3 | Recall | Photo only; recall the name, then answer in the chosen mode (below) | Think "Marion Cotillard", flip, tap "Knew it" |
| 4 | Connect | A film or a person, linking question | "Who directed *Anatomie d'une chute*?" or "Which of these films was she in?" |

Directors use the same levels; their level-4 cards link them to the films they directed.

**Level-3 answer modes** (chosen in settings; the recall step is the same in all three):

- **Flip and self-rate** (default): tap to reveal the name, then tap "Knew it" or "Didn't".
- **Letter tiles:** tap the letters of the family name from a scrambled set with 3 extra letters.
- **Typing:** type the family name, with its first letter given; spelling-tolerant check.

**Hints.** When a person was added from a film you've seen, cards at levels 1–3 can show that film as a hint ("You saw them in *Oppenheimer*"), tap to reveal.

**Feedback after every answer.** The correct name and photo are always shown, right or wrong, with one **memory anchor**: a film you've seen with them if there is one, otherwise their best-known role or film ("Édith Piaf in *La Vie en rose*"). Every card teaches.

## Progression and scheduling

Two separate mechanisms: **levels** decide what kind of card you get; **FSRS** decides when a person comes back.

**Levels (visible progress)**

- **Level up:** 2 correct answers in a row at the current level, on different days.
- **Level down:** a wrong answer drops the person one level (never below 1).
- **Mastered:** a person at level 4 whose FSRS stability exceeds 30 days.

**Scheduling with FSRS**

The app uses FSRS (Free Spaced Repetition Scheduler), an open-source spaced-repetition algorithm. For each person it keeps an estimate of how well you remember them and schedules the next card for when you are likely to start forgetting.

- Each answer is graded **Again** (wrong or "Didn't") or **Good** (right or "Knew it").
- Target retention: 90%. Easy names come back less and less often; hard ones come back sooner.
- A person graded Again also comes back once more in the same session.
- Default FSRS parameters at first; personalising them from your own answer history is out of scope for v1.

**Session mix:** due reviews first (most overdue first), then new people, up to the daily goal (default 10 cards, adjustable to 5, 10 or 20).

## Engagement (healthy habit, no dark patterns)

- **Streak:** days in a row with at least one completed session. One missed day per week is forgiven automatically.
- **Visible progress:** on Home, a row of small round photos of the people you're learning (up to 12, best known first, then "+N"). Each face is more faded the lower its level: level 1 faintest, level 4 in full colour, mastered people with a dark ring. A caption reads "9 people · 2 you know well" (level 3 and up). Tapping the row opens My people, which holds the per-level breakdown. A short "levelled up" moment in the summary. (Changed from per-level counts by louis80 on 2026-11-12.)
- **Short by design:** a session ends at the daily goal; "One more round" is offered once, never automatically.
- **No:** endless feeds, push notifications in v1, timers, penalties, or fake urgency.

## Look and feel

Approved by louis80 on 2026-11-12 from the [MovieStars UI mockups](https://claude.ai/artifact/QFrFrYACMNikh86TK6SLgc) (Home, Quiz card, Answer, Recall card, Films I've seen).

- **Style:** clean and minimal, inspired by the one-question-at-a-time feel of form tools like Tally. One question and one main action per screen.
- **The face is the quiz:** on quiz cards the photo fills most of the screen (about 380 px tall on a 390 × 844 phone).
- **Colours:** white background, near-black text and primary buttons (#111111), grey secondary text (#6B6B6B), light grey lines (#E6E6E6). Blue (#2F5BEA) marks a correct answer; orange (#C2410C) is used for the streak and wrong answers. No red/green pairs.
- **Type:** Inter; bold headings with tight letter spacing (24–34 px on cards), 15–17 px body.
- **Shape:** 12–16 px rounded corners; primary buttons 56 px tall, full width, at the bottom of the screen; every tap target at least 44 px.
- **Keyboard on desktop:** choices show letter keys (A–D); Enter continues, Space reveals the name, 1 and 2 answer "Didn't" and "Knew it".
- **Motion:** short, quiet transitions between cards; no confetti or flashing.

## Data

From TMDB (fetched as needed, cached on the device):

- People: name, photo, known-for department (Acting / Directing), place of birth, popularity, and their film credits.
- Films: title, year, poster, director, top-billed cast.
- Lists: popular people, now-playing and trending films, search for people and films.

Stored on the device only:

| Item | Fields |
| --- | --- |
| Queue entry | TMDB person ID, level (1–4), correct-in-a-row count, FSRS state (stability, difficulty, due date, last review), source (starter / film / added), interested flag |
| Review log | Person ID, date, card level, grade (Again / Good) |
| Seen films | TMDB film ID, date added |
| Profile | Streak count, last session date, daily goal, level-3 answer mode |

Country and era for a person are derived from place of birth and the years of their main films.

## Acceptance criteria

1. On first launch, a user can start a session within 2 taps (Welcome → Start).
2. Tapping 3 films on Recent films adds each film's director and top 5 cast to the queue, without duplicates.
3. Every card shows the correct name, a photo and a memory anchor after the user answers; the anchor is a film the user has seen with that person whenever one exists.
4. A person answered correctly twice in a row on different days moves up exactly one level; a wrong answer moves them down one level, never below 1.
5. Level-2 choices come from the same country and decade as the person whenever at least 3 such people are available.
6. Level 3 works in all three answer modes. Flip and self-rate needs at most 2 taps; typing accepts the family name alone and tolerates one typo or a missing accent ("Cotilard", "Celine").
7. Next review dates come from FSRS: after a Good grade the next interval is longer than the previous one, and after Again the person reappears in the same session.
8. "Don't show again" removes the person from the queue, and they are not re-added automatically.
9. Progress survives closing and reopening the app, and works offline for people already cached.
10. The app can be installed to a phone's home screen and opens full-screen.
11. The About page shows the TMDB logo and the notice "This product uses the TMDB API but is not endorsed or certified by TMDB."

## Out of scope for v1

- Store apps (iOS/Android)
- Accounts and sync across devices
- French interface
- Push notifications
- TV series
- Social features (sharing, leaderboards)
- Personalised FSRS parameters
- Dark theme (a black version following the phone's setting was discussed; can be added in a later loop)
