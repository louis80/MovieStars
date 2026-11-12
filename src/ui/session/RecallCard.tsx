import { useMemo, useState, type FormEvent } from "react";
import { useServices } from "../../app/ServicesContext";
import {
  buildTiles,
  familyName,
  isTilesAnswerCorrect,
  isTypedAnswerCorrect,
  tileAnswer,
} from "../../learning/answer";
import type { Card } from "../../learning/cards";
import type { Grade, RecallMode } from "../../learning/types";
import { useKeys } from "../useKeys";
import { AnchorLines } from "./AnchorLines";
import { HintButton } from "./HintButton";
import { personLine, roleLabel } from "./labels";
import { Photo } from "./Photo";

type RecallCardData = Extract<Card, { kind: "recall" }>;

export interface RecallAnswer {
  grade: Grade;
  /** True when the card already showed the answer (flip), so no separate feedback screen. */
  shownAlready: boolean;
  picked?: string;
}

/** Level 3: recall the name, then answer in the chosen mode (spec: Level-3 answer modes). */
export function RecallCard({
  card,
  mode,
  onAnswer,
}: {
  card: RecallCardData;
  mode: RecallMode;
  onAnswer: (answer: RecallAnswer) => void;
}) {
  return (
    <>
      <Photo person={card.person} height={380} />
      {mode === "flip" && <Flip card={card} onAnswer={onAnswer} />}
      {mode === "tiles" && <Tiles card={card} onAnswer={onAnswer} />}
      {mode === "typing" && <Typing card={card} onAnswer={onAnswer} />}
    </>
  );
}

function Prompt({ card, title }: { card: RecallCardData; title: string }) {
  return (
    <div className="question">
      <div className="eyebrow">Recall · {roleLabel(card.person).toLowerCase()}</div>
      <h1 className="question-title">{title}</h1>
    </div>
  );
}

/** Two taps: "Show name", then "Knew it" or "Didn't" (AC6). */
function Flip({ card, onAnswer }: { card: RecallCardData; onAnswer: (a: RecallAnswer) => void }) {
  const [shown, setShown] = useState(false);
  const rate = (grade: Grade) => onAnswer({ grade, shownAlready: true });

  useKeys(
    shown ? { "1": () => rate("again"), "2": () => rate("good") } : { Space: () => setShown(true) },
  );

  if (!shown) {
    return (
      <>
        <Prompt card={card} title="Say the name in your head" />
        <HintButton hint={card.hint} />
        <div className="bottom">
          <button type="button" className="btn btn-primary" onClick={() => setShown(true)}>
            <span>Show name</span>
            <span className="kbd">Space</span>
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="question">
        <div className="eyebrow">{personLine(card.person)}</div>
        <h1 className="answer-name">{card.person.name}</h1>
      </div>
      <AnchorLines person={card.person} />
      <div className="bottom two-up">
        <button type="button" className="btn btn-secondary" onClick={() => rate("again")}>
          Didn't <span className="kbd-quiet">1</span>
        </button>
        <button type="button" className="btn btn-primary" onClick={() => rate("good")}>
          Knew it <span className="kbd">2</span>
        </button>
      </div>
    </>
  );
}

function Tiles({ card, onAnswer }: { card: RecallCardData; onAnswer: (a: RecallAnswer) => void }) {
  const { rng } = useServices();
  const tiles = useMemo(() => buildTiles(card.person.name, rng), [card.person.name, rng]);
  const target = tileAnswer(card.person.name);
  const [used, setUsed] = useState<number[]>([]);
  const typed = used.map((i) => tiles[i] ?? "");

  const tap = (index: number) => {
    if (used.includes(index)) return;
    const next = [...used, index];
    setUsed(next);
    if (next.length === target.length) {
      const letters = next.map((i) => tiles[i] ?? "");
      onAnswer({
        grade: isTilesAnswerCorrect(letters, card.person.name) ? "good" : "again",
        shownAlready: false,
        picked: letters.join(""),
      });
    }
  };

  useKeys({ Backspace: () => setUsed((u) => u.slice(0, -1)) });

  return (
    <>
      <Prompt card={card} title="Spell the family name" />
      <div className="tile-slots" aria-label={`Your answer: ${typed.join("")}`}>
        {target.split("").map((_, i) => (
          <span key={i} className="tile-slot">
            {typed[i] ?? ""}
          </span>
        ))}
      </div>
      <div className="tiles">
        {tiles.map((letter, i) => (
          <button
            key={i}
            type="button"
            className="tile"
            disabled={used.includes(i)}
            onClick={() => tap(i)}
          >
            {letter}
          </button>
        ))}
      </div>
      <div className="bottom two-up">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setUsed((u) => u.slice(0, -1))}
          disabled={used.length === 0}
        >
          Undo
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onAnswer({ grade: "again", shownAlready: false })}
        >
          I don't know
        </button>
      </div>
    </>
  );
}

function Typing({ card, onAnswer }: { card: RecallCardData; onAnswer: (a: RecallAnswer) => void }) {
  const [value, setValue] = useState("");
  const first = familyName(card.person.name).charAt(0).toUpperCase();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim().length === 0) return;
    onAnswer({
      grade: isTypedAnswerCorrect(value, card.person.name) ? "good" : "again",
      shownAlready: false,
      picked: value.trim(),
    });
  };

  return (
    <form className="typing" onSubmit={submit}>
      <Prompt card={card} title="Type the family name" />
      <label className="visually-hidden" htmlFor="recall-typing">
        Family name, starts with {first}
      </label>
      <input
        id="recall-typing"
        className="text-input"
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        placeholder={`${first}…`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
      />
      <HintButton hint={card.hint} />
      <div className="bottom two-up">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onAnswer({ grade: "again", shownAlready: false })}
        >
          I don't know
        </button>
        <button type="submit" className="btn btn-primary" disabled={value.trim().length === 0}>
          Check <span className="kbd">Enter ↵</span>
        </button>
      </div>
    </form>
  );
}
