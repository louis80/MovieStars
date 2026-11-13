import { useState } from "react";
import { useParams } from "react-router";
import { useServices } from "../../app/ServicesContext";
import { Icon } from "../Icon";
import { personLine } from "../session/labels";
import { useAsync } from "../useAsync";
import { BackLink } from "../BackLink";
import { PersonRow } from "./PersonRow";

export function FilmScreen() {
  const { id } = useParams();
  const { learning, image } = useServices();
  const [page, reload] = useAsync(() => learning.filmPage(Number(id)), [learning, id]);
  const [busy, setBusy] = useState(false);

  if (page.status === "loading") return <main className="screen" />;
  if (page.status === "error" || !page.value) {
    return (
      <main className="screen">
        <BackLink />
        <p className="lead">This film could not be loaded. Check your connection and try again.</p>
      </main>
    );
  }

  const { film, directors, cast, seen } = page.value;
  const src = image(film.posterPath, "w342");

  const markSeen = async () => {
    setBusy(true);
    await learning.addSeenFilms([film.id]);
    setBusy(false);
    reload();
  };

  return (
    <main className="screen" style={{ gap: 20 }}>
      <BackLink />
      <div className="film-head">
        <div className="film-poster">
          {src ? (
            <img src={src} alt={`Poster of ${film.title}`} />
          ) : (
            <Icon name="film" size={36} color="#c9c9c7" />
          )}
        </div>
        <div className="question">
          <h1 className="title-sm">{film.title}</h1>
          {film.year && <div className="lead">{film.year}</div>}
        </div>
      </div>

      {directors.length > 0 && (
        <section aria-label="Directed by" className="group">
          <div className="section-label" style={{ padding: 0 }}>
            Directed by
          </div>
          {directors.map((p) => (
            <PersonRow
              key={p.id}
              id={p.id}
              name={p.name}
              photoPath={p.photoPath}
              detail={personLine(p)}
            />
          ))}
        </section>
      )}

      {cast.length > 0 && (
        <section aria-label="Main cast" className="group">
          <div className="section-label" style={{ padding: 0 }}>
            Main cast
          </div>
          {cast.map((p) => (
            <PersonRow
              key={p.id}
              id={p.id}
              name={p.name}
              photoPath={p.photoPath}
              detail={personLine(p)}
            />
          ))}
        </section>
      )}

      <div className="bottom">
        {seen ? (
          <p className="lead" style={{ textAlign: "center" }}>
            You've seen this. Its director and cast are in your list.
          </p>
        ) : (
          <button type="button" className="btn btn-primary" onClick={markSeen} disabled={busy}>
            {busy ? "Adding their cast…" : "I've seen this"}
          </button>
        )}
      </div>
    </main>
  );
}
