import { Link } from "react-router";
import type { SessionSummary as Summary } from "../../learning/session";
import type { Person } from "../../learning/types";
import { Icon } from "../Icon";
import { streakLabel } from "../streak";

/** End of session (spec: Session summary). "One more round" is offered once, never automatic. */
export function SessionSummary({
  summary,
  levelledUp,
  streak,
  canOfferMore,
  onMore,
}: {
  summary: Summary;
  levelledUp: Person[];
  streak: number | null;
  canOfferMore: boolean;
  onMore: () => void;
}) {
  const total = summary.right + summary.wrong;
  return (
    <main className="screen">
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 32 }}>
        <h1 className="title">Session done</h1>
        {streak !== null && (
          <div className="quiet" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="flame" size={16} color="var(--warm)" strokeWidth={2} />
            <span>{streakLabel(streak)}</span>
          </div>
        )}
      </div>

      <section className="card" aria-label="Results">
        <div className="row">
          <span>Right first time</span>
          <span>
            {summary.right} of {total}
          </span>
        </div>
        <div className="row">
          <span>To review</span>
          <span className="quiet">{summary.wrong}</span>
        </div>
      </section>

      {levelledUp.length > 0 && (
        <section aria-label="Moved up a level">
          <div className="section-label">Moved up a level</div>
          <ul className="plain-list">
            {levelledUp.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="bottom">
        <Link to="/" className="btn btn-primary">
          Back to Home
        </Link>
        {canOfferMore && (
          <button type="button" className="btn-text" onClick={onMore}>
            One more round
          </button>
        )}
      </div>
    </main>
  );
}
