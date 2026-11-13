import { Link, useNavigate } from "react-router";
import { useServices } from "../app/ServicesContext";
import { BottomNav } from "./BottomNav";
import { FaceRow } from "./FaceRow";
import { Icon } from "./Icon";
import { streakLabel } from "./streak";
import { useAsync } from "./useAsync";
import { useEnterKey } from "./useEnterKey";

export function HomeScreen() {
  const { learning, sample } = useServices();
  const [summary] = useAsync(() => learning.homeSummary(), [learning]);
  const navigate = useNavigate();
  const canStart = summary.status === "ready" && summary.value.planned > 0;
  useEnterKey(canStart ? () => navigate("/session") : null);

  return (
    <>
      <main className="screen" style={{ gap: 32 }}>
        <header className="screen-header">
          <div className="wordmark">MovieStars</div>
          <Link to="/about" className="link-quiet">
            About
          </Link>
        </header>

        {sample && (
          <p className="notice">Preview with sample data. Photos and posters appear with TMDB.</p>
        )}

        {summary.status === "ready" && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h1 className="title">
                {summary.value.planned > 0 ? "Ready for today's faces?" : "All done for today."}
              </h1>
              <div
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15 }}
                className="quiet"
              >
                <Icon name="flame" size={16} color="var(--warm)" strokeWidth={2} />
                <span>{streakLabel(summary.value.streak)}</span>
              </div>
            </div>

            <section className="card" aria-label="Today">
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}
              >
                <div style={{ fontSize: 15, fontWeight: 600 }}>Today</div>
                <div className="quiet" style={{ fontSize: 14 }}>
                  {summary.value.done} of {summary.value.goal} cards
                </div>
              </div>
              <div
                className="bar"
                role="progressbar"
                aria-label="Today's cards"
                aria-valuemin={0}
                aria-valuemax={summary.value.goal}
                aria-valuenow={summary.value.done}
              >
                <div style={{ width: `${(100 * summary.value.done) / summary.value.goal}%` }} />
              </div>
              {summary.value.planned > 0 ? (
                <Link to="/session" className="btn btn-primary">
                  <span>Start</span>
                  <span className="kbd">Enter ↵</span>
                </Link>
              ) : (
                <p className="lead">Come back tomorrow, or add films you've seen for new faces.</p>
              )}
            </section>

            <FaceRow
              faces={summary.value.faces}
              total={summary.value.total}
              knownWell={summary.value.knownWell}
            />
          </>
        )}
      </main>
      <BottomNav />
    </>
  );
}
