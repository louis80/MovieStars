import { Link } from "react-router";

/** About and credits. The TMDB notice is required for free use of the API (spec AC11). */
export function AboutScreen() {
  return (
    <main className="screen">
      <header className="screen-header">
        <Link to="/" className="link-quiet">
          ← Home
        </Link>
      </header>
      <h1 className="title-sm">About MovieStars</h1>
      <p className="lead">
        MovieStars helps you learn the names of film actors and directors, a few faces a day. Your
        progress stays on this device.
      </p>
      <section aria-label="Credits" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="section-label">Credits</div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.4 }}>
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </section>
    </main>
  );
}
