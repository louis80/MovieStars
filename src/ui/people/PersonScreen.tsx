import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useServices } from "../../app/ServicesContext";
import { BackLink } from "../BackLink";
import { Icon } from "../Icon";
import { filmLabel, personLine } from "../session/labels";
import { Photo } from "../session/Photo";
import { useAsync } from "../useAsync";

const LEVEL_TEXT = {
  1: "Level 1 · Recognise",
  2: "Level 2 · Distinguish",
  3: "Level 3 · Recall",
  4: "Level 4 · Connect",
} as const;

export function PersonScreen() {
  const { id } = useParams();
  const { learning, image } = useServices();
  const navigate = useNavigate();
  const [page, reload] = useAsync(() => learning.personPage(Number(id)), [learning, id]);
  const [busy, setBusy] = useState(false);

  if (page.status === "loading") return <main className="screen" />;
  if (page.status === "error" || !page.value) {
    return (
      <main className="screen">
        <BackLink />
        <p className="lead">
          This person could not be loaded. Check your connection and try again.
        </p>
      </main>
    );
  }

  const { person, entry, mastered, excluded } = page.value;
  const act = async (action: () => Promise<unknown>) => {
    setBusy(true);
    await action();
    setBusy(false);
    reload();
  };

  return (
    <main className="screen" style={{ gap: 20 }}>
      <BackLink />
      <Photo person={person} height={300} alt={`Photo of ${person.name}`} />
      <div className="question">
        <h1 className="answer-name">{person.name}</h1>
        <div className="lead">{personLine(person)}</div>
      </div>

      <div className="status-line">
        {entry ? (
          <span>{mastered ? "Mastered" : `In your list · ${LEVEL_TEXT[entry.level]}`}</span>
        ) : (
          <>
            <span className="quiet">
              {excluded ? "Hidden from your sessions" : "Not in your list"}
            </span>
            <button
              type="button"
              className="btn-text"
              style={{ color: "var(--ink)", fontWeight: 600 }}
              disabled={busy}
              onClick={() => act(() => learning.addPerson(person.id))}
            >
              {excluded ? "Add back" : "Add to my list"}
            </button>
          </>
        )}
      </div>

      {person.knownFor.length > 0 && (
        <section aria-label="Known for" className="group">
          <div className="section-label" style={{ padding: 0 }}>
            Known for
          </div>
          {person.knownFor.map((film) => {
            const src = image(film.posterPath, "w92");
            return (
              <Link key={film.id} to={`/film/${film.id}`} className="film-row">
                <span className="film-thumb">
                  {src ? <img src={src} alt="" /> : <Icon name="film" size={18} color="#c9c9c7" />}
                </span>
                <span className="person-row-text">
                  <span className="person-row-name">{filmLabel(film)}</span>
                  {film.character && <span className="quiet">as {film.character}</span>}
                </span>
                <span aria-hidden="true" className="quiet">
                  ›
                </span>
              </Link>
            );
          })}
        </section>
      )}

      {entry && (
        <div className="bottom">
          <div className="new-face">
            <button
              type="button"
              className="btn-text"
              aria-pressed={entry.interested === true}
              disabled={busy || entry.interested === true}
              onClick={() => act(() => learning.markInterested(person.id))}
            >
              More like this
              {entry.interested === true && <Icon name="check" size={14} strokeWidth={2.4} />}
            </button>
            <button
              type="button"
              className="btn-text underline"
              disabled={busy}
              onClick={async () => {
                await learning.notForMe(person.id);
                navigate(-1);
              }}
            >
              Don't show again
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
