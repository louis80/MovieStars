import { useKeys } from "../useKeys";

const LETTERS = ["A", "B", "C", "D"] as const;

export interface Choice {
  key: string | number;
  label: string;
}

/** Four answers with letter keys (A–D, or 1–4), Tally style. */
export function ChoiceList({
  choices,
  onPick,
}: {
  choices: Choice[];
  onPick: (index: number) => void;
}) {
  const bindings: Record<string, () => void> = {};
  choices.forEach((_, i) => {
    const letter = LETTERS[i];
    if (!letter) return;
    bindings[letter.toLowerCase()] = () => onPick(i);
    bindings[String(i + 1)] = () => onPick(i);
  });
  useKeys(bindings);

  return (
    <div className="choices">
      {choices.map((choice, i) => (
        <button key={choice.key} type="button" className="choice" onClick={() => onPick(i)}>
          <span className="choice-key" aria-hidden="true">
            {LETTERS[i]}
          </span>
          <span>{choice.label}</span>
        </button>
      ))}
    </div>
  );
}
