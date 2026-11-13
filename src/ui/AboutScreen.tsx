import { useState } from "react";
import { useServices } from "../app/ServicesContext";
import type { Profile, RecallMode } from "../learning/types";
import { BackLink } from "./BackLink";
import { TmdbLogo } from "./TmdbLogo";
import { useAsync } from "./useAsync";

const GOALS: Profile["dailyGoal"][] = [5, 10, 20];

const MODES: { value: RecallMode; label: string; note: string }[] = [
  { value: "flip", label: "Show and rate", note: "Think of the name, show it, say if you knew it" },
  { value: "tiles", label: "Letter tiles", note: "Tap the letters of the family name" },
  { value: "typing", label: "Typing", note: "Type the family name; small typos are fine" },
];

/** About, settings, and the TMDB credit required for free use of its API (spec AC11). */
export function AboutScreen() {
  const { learning } = useServices();
  const [loaded] = useAsync(() => learning.profile(), [learning]);
  // Choices show at once; saving happens in the background.
  const [changes, setChanges] = useState<Partial<Pick<Profile, "dailyGoal" | "recallMode">>>({});
  const profile =
    loaded.status === "ready"
      ? ({ status: "ready", value: { ...loaded.value, ...changes } } as const)
      : loaded;

  const save = (change: Partial<Pick<Profile, "dailyGoal" | "recallMode">>) => {
    setChanges((current) => ({ ...current, ...change }));
    void learning.updateSettings(change);
  };

  return (
    <main className="screen" style={{ gap: 28 }}>
      <BackLink />
      <div className="question" style={{ gap: 8 }}>
        <h1 className="title-sm">About MovieStars</h1>
        <p className="lead">
          MovieStars helps you put names to the faces of film actors and directors, a few faces a
          day. Your progress stays on this device.
        </p>
      </div>

      {profile.status === "ready" && (
        <>
          <fieldset className="setting">
            <legend className="section-label">Cards per day</legend>
            <div className="filters">
              {GOALS.map((goal) => (
                <label key={goal} className="chip" data-checked={profile.value.dailyGoal === goal}>
                  <input
                    type="radio"
                    name="daily-goal"
                    id={`goal-${goal}`}
                    className="visually-hidden"
                    checked={profile.value.dailyGoal === goal}
                    onChange={() => save({ dailyGoal: goal })}
                  />
                  {goal}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="setting">
            <legend className="section-label">How you answer at the Recall level</legend>
            <div className="mode-list">
              {MODES.map((mode) => (
                <label key={mode.value} className="mode-option">
                  <input
                    type="radio"
                    name="recall-mode"
                    id={`mode-${mode.value}`}
                    checked={profile.value.recallMode === mode.value}
                    onChange={() => save({ recallMode: mode.value })}
                  />
                  <span className="person-row-text">
                    <span className="person-row-name">{mode.label}</span>
                    <span className="quiet">{mode.note}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <section aria-label="Credits" className="credits">
        <div className="section-label" style={{ padding: 0 }}>
          Credits
        </div>
        <TmdbLogo height={40} />
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.4 }}>
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
        <p className="lead" style={{ fontSize: 14 }}>
          Names, photos, posters and film details come from{" "}
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer">
            The Movie Database
          </a>
          .
        </p>
      </section>
    </main>
  );
}
