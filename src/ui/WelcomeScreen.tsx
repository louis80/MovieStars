import { useState } from "react";
import { useNavigate } from "react-router";
import { useServices } from "../app/ServicesContext";

export function WelcomeScreen() {
  const { learning } = useServices();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    await learning.markWelcomed();
    await learning.seedStarter();
    navigate("/session", { replace: true });
  };

  const pickFilms = async () => {
    await learning.markWelcomed();
    navigate("/films", { replace: true });
  };

  return (
    <main className="screen">
      <div className="screen-header">
        <div className="wordmark">MovieStars</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 48 }}>
        <h1 className="title">Put a name to every face on screen.</h1>
        <p className="lead">
          A few faces a day. Guess, see the answer, and the names stick. It gets harder as you get
          better.
        </p>
      </div>
      <div className="bottom">
        <button type="button" className="btn btn-primary" onClick={start} disabled={busy}>
          {busy ? "Getting faces ready…" : "Start"}
        </button>
        <button type="button" className="btn-text" onClick={pickFilms} disabled={busy}>
          First, tap films I've seen
        </button>
      </div>
    </main>
  );
}
