import { useState } from "react";
import type { FilmRef } from "../../learning/types";
import { filmLabel } from "./labels";

/** A seen-film hint, hidden until asked for (spec: Hints). */
export function HintButton({ hint }: { hint: FilmRef | null }) {
  const [shown, setShown] = useState(false);
  if (!hint) return null;
  if (shown) return <p className="lead">You saw them in {filmLabel(hint)}</p>;
  return (
    <button type="button" className="btn-text hint" onClick={() => setShown(true)}>
      Need a hint?
    </button>
  );
}
