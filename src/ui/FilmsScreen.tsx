import { useState } from "react";
import { useNavigate } from "react-router";
import { useServices } from "../app/ServicesContext";
import type { TmdbMovieSummary } from "../tmdb/types";
import { Icon } from "./Icon";
import { PosterButton } from "./PosterButton";
import { useAsync } from "./useAsync";

export function FilmsScreen() {
  const { learning } = useServices();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Map<number, TmdbMovieSummary>>(new Map());
  const [busy, setBusy] = useState(false);

  const [choices] = useAsync(() => learning.filmChoices(), [learning]);
  const [results] = useAsync(() => learning.searchFilms(query), [learning, query]);

  const searching = query.trim().length >= 2;
  const list = searching
    ? results.status === "ready"
      ? results.value
      : []
    : choices.status === "ready"
      ? choices.value
      : [];

  const toggle = (film: TmdbMovieSummary) => {
    setPicked((current) => {
      const next = new Map(current);
      if (next.has(film.id)) next.delete(film.id);
      else next.set(film.id, film);
      return next;
    });
  };

  const done = async () => {
    setBusy(true);
    if (picked.size > 0) await learning.addSeenFilms([...picked.keys()]);
    navigate("/", { replace: true });
  };

  const count = picked.size;
  const label = busy
    ? "Adding their cast…"
    : count === 0
      ? "Done"
      : `Add ${count} ${count === 1 ? "film" : "films"}`;

  return (
    <main className="screen" style={{ gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 className="title-sm">Seen any of these lately?</h1>
        <p className="lead">Tap the ones you've watched. Their cast and director join your list.</p>
      </div>

      <label className="search">
        <Icon name="search" size={18} strokeWidth={2} />
        <span className="visually-hidden">Search a film</span>
        <input
          type="search"
          placeholder="Search a film"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {searching && results.status === "ready" && list.length === 0 && (
        <p className="lead">No films found for “{query.trim()}”.</p>
      )}

      <div className="poster-grid">
        {list.map((film) => (
          <PosterButton
            key={film.id}
            film={film}
            selected={picked.has(film.id)}
            onToggle={() => toggle(film)}
          />
        ))}
      </div>

      <div className="bottom">
        <button type="button" className="btn btn-primary" onClick={done} disabled={busy}>
          {label}
        </button>
        <button
          type="button"
          className="btn-text"
          onClick={() => navigate("/", { replace: true })}
          disabled={busy}
        >
          Skip for now
        </button>
      </div>
    </main>
  );
}
