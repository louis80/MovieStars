import { Link, useNavigate } from "react-router";
import { useServices } from "../app/ServicesContext";
import { BottomNav } from "./BottomNav";
import { Icon } from "./Icon";
import { useAsync } from "./useAsync";
import { useEnterKey } from "./useEnterKey";

const LEVEL_NAMES = { 1: "Recognise", 2: "Distinguish", 3: "Recall", 4: "Connect" } as const;

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
                <span>
                  {summary.value.streak === 1
                    ? "1-day streak"
                    : `${summary.value.streak}-day streak`}
                </span>
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

            <section aria-label="Your people">
              <div className="section-label">Your people</div>
              {([1, 2, 3, 4] as const).map((level) => (
                <div className="row" key={level}>
                  <span>{LEVEL_NAMES[level]}</span>
                  <span className="quiet">{summary.value.levels[level]}</span>
                </div>
              ))}
              <div className="row" style={{ fontWeight: 600 }}>
                <span>Mastered</span>
                <span>{summary.value.mastered}</span>
              </div>
            </section>
          </>
        )}
      </main>
      <BottomNav />
    </>
  );
}
