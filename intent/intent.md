# Intent: MovieStars

- **Author:** louis80
- **Date:** 2026-11-12
- **Status:** Draft, awaiting approval

## What we want

An app, on phone and on the web, that helps me learn and remember:

- the names of movie stars who interest me, from France, the US and elsewhere;
- the names of directors (réalisateurs);
- the movies each star has appeared in.

## Problems

- I recognise faces and films but forget the names of the actors and directors.
- Looking people up on general movie sites gives me facts, but nothing helps me *remember* them.
- Existing sites are built for browsing, not for learning step by step.

## Proposed outcomes

- Choosing who to learn takes no effort. The app starts straight away with well-known stars and directors, and learns my taste as I play: a quick "interested / not for me" on each face, and films I recognise bring in their cast. Filters by country or era and a name search are there if I want them, never required.
- I can tell the app which films I've seen recently by tapping their posters in a grid (search only for anything missing). It's offered once at the start, can be skipped, and stays available as "I just watched…". Each film brings its cast and director into my learning queue, and the quiz uses the film as a memory hint.
- For each person, I see their photo, name and best-known films in a clear, simple page.
- Learning is progressive. Each person moves up through levels as I get them right:
  1. **Recognise:** pick the right name among several choices.
  2. **Distinguish:** fewer clues and closer look-alike choices (same country, same era).
  3. **Recall:** type or say the name myself.
  4. **Connect:** link people and films (film → star, film → director, star → films).
- The app brings back the people I get wrong until I know them, and drops a level when I forget.
- I want to come back every day: short daily sessions, progress I can see, and small rewards such as streaks and levels.

## Affected users

- Me first. Possibly friends or the public later.

## Constraints

- **Easy to use:** one tap to start a session; no long setup.
- **Didactic:** learning comes first; every quiz answer shows the correct name, a photo and a film to anchor it.
- **Engaging, not manipulative:** daily habit through progress and streaks, without dark patterns or endless feeds.
- **Phone and web:** first a website that installs on the phone like an app; a store app (iOS/Android) comes later.
- **Language:** English interface only.
- **Progress:** saved on the device, no account needed at first.
- **Movie data:** from the TMDB API (The Movie Database). It is free for non-commercial use, with attribution: the TMDB logo and the notice "This product uses the TMDB API but is not endorsed or certified by TMDB" in an About/Credits page. Any commercial use would need a paid TMDB licence.

## Open questions

- None blocking. Store app and cross-device sync are deferred to a later loop.
