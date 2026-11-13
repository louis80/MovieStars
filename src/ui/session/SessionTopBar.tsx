import { Link } from "react-router";
import { Icon } from "../Icon";

export function SessionTopBar({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : (100 * done) / total;
  return (
    <header className="session-top">
      <Link to="/" aria-label="End session" className="icon-button">
        <Icon name="close" size={20} strokeWidth={2} />
      </Link>
      <div
        className="bar session-bar"
        role="progressbar"
        aria-label="Session progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <div style={{ width: `${percent}%` }} />
      </div>
      <div className="quiet" style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
        {Math.min(done + 1, total)} / {total}
      </div>
    </header>
  );
}
