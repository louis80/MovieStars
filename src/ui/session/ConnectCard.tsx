import { useServices } from "../../app/ServicesContext";
import type { Card } from "../../learning/cards";
import type { Grade } from "../../learning/types";
import { Icon } from "../Icon";
import { ChoiceList } from "./ChoiceList";
import { filmLabel, pronoun } from "./labels";
import { Photo } from "./Photo";

type ConnectCardData = Extract<Card, { kind: "film-to-person" | "person-to-film" }>;

/** Level 4: link people and films. */
export function ConnectCard({
  card,
  onAnswer,
}: {
  card: ConnectCardData;
  onAnswer: (grade: Grade, picked: string) => void;
}) {
  const { image } = useServices();

  if (card.kind === "film-to-person") {
    const src = image(card.film.posterPath, "w342");
    const question =
      card.person.role === "director"
        ? `Who directed ${card.film.title}?`
        : `Who was in ${card.film.title}?`;
    return (
      <>
        <div className="film-block">
          <div className="film-poster">
            {src ? <img src={src} alt="" /> : <Icon name="film" size={36} color="#c9c9c7" />}
          </div>
          <div className="lead">{filmLabel(card.film)}</div>
        </div>
        <div className="question">
          <div className="eyebrow">Connect</div>
          <h1 className="question-title">{question}</h1>
        </div>
        <ChoiceList
          choices={card.choices.map((p) => ({ key: p.id, label: p.name }))}
          onPick={(i) => {
            const chosen = card.choices[i];
            if (chosen) onAnswer(chosen.id === card.person.id ? "good" : "again", chosen.name);
          }}
        />
      </>
    );
  }

  return (
    <>
      <Photo person={card.person} height={300} />
      <div className="question">
        <div className="eyebrow">Connect · {card.person.name}</div>
        <h1 className="question-title">
          Which film was {pronoun(card.person)} {card.person.role === "director" ? "behind" : "in"}?
        </h1>
      </div>
      <ChoiceList
        choices={card.choices.map((f) => ({ key: f.id, label: filmLabel(f) }))}
        onPick={(i) => {
          const chosen = card.choices[i];
          if (chosen) onAnswer(chosen.id === card.film.id ? "good" : "again", filmLabel(chosen));
        }}
      />
    </>
  );
}
