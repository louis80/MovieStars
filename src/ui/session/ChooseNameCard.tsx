import type { Card } from "../../learning/cards";
import type { Grade } from "../../learning/types";
import { ChoiceList } from "./ChoiceList";
import { HintButton } from "./HintButton";
import { Photo } from "./Photo";

type ChooseNameCardData = Extract<Card, { kind: "choose-name" }>;

/** Levels 1–2: the face and four names. */
export function ChooseNameCard({
  card,
  onAnswer,
}: {
  card: ChooseNameCardData;
  onAnswer: (grade: Grade, picked: string) => void;
}) {
  const pick = (index: number) => {
    const chosen = card.choices[index];
    if (!chosen) return;
    onAnswer(chosen.id === card.person.id ? "good" : "again", chosen.name);
  };

  return (
    <>
      <Photo person={card.person} height={380} />
      <div className="question">
        <div className="eyebrow">{card.level === 1 ? "Recognise" : "Distinguish"}</div>
        <h1 className="question-title">Who is this?</h1>
      </div>
      <ChoiceList choices={card.choices.map((p) => ({ key: p.id, label: p.name }))} onPick={pick} />
      <HintButton hint={card.hint} />
    </>
  );
}
