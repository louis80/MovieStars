import type { Grade, Person } from "../../learning/types";
import { Icon } from "../Icon";
import { useKeys } from "../useKeys";
import { AnchorLines } from "./AnchorLines";
import { personLine } from "./labels";
import { Photo } from "./Photo";

/**
 * Shown after every answer, right or wrong (spec: Feedback after every answer):
 * the name, the photo and a memory anchor.
 */
export function AnswerView({
  person,
  grade,
  picked,
  isNewFace,
  interested,
  onInterested,
  onNotForMe,
  onContinue,
}: {
  person: Person;
  grade: Grade;
  picked: string | undefined;
  isNewFace: boolean;
  interested: boolean;
  onInterested: () => void;
  onNotForMe: () => void;
  onContinue: () => void;
}) {
  useKeys({ Enter: onContinue });

  return (
    <>
      <Photo person={person} height={300} alt={`Photo of ${person.name}`} />
      <div className="question" aria-live="polite">
        {grade === "good" ? (
          <div className="verdict verdict-good">
            <Icon name="check" size={18} strokeWidth={2.4} />
            <span>Correct</span>
          </div>
        ) : (
          <div className="verdict verdict-again">
            <span>{picked ? `Not quite. You answered ${picked}.` : "Here's who it is."}</span>
          </div>
        )}
        <h1 className="answer-name">{person.name}</h1>
        <div className="lead">{personLine(person)}</div>
      </div>
      <AnchorLines person={person} />

      <div className="bottom">
        {isNewFace && (
          <div className="new-face">
            <span className="quiet">First time</span>
            <span style={{ display: "flex", gap: 16 }}>
              <button
                type="button"
                className="btn-text"
                aria-pressed={interested}
                onClick={onInterested}
                disabled={interested}
              >
                More like this
                {interested && <Icon name="check" size={14} strokeWidth={2.4} />}
              </button>
              <button type="button" className="btn-text underline" onClick={onNotForMe}>
                Don't show again
              </button>
            </span>
          </div>
        )}
        <button type="button" className="btn btn-primary" onClick={onContinue}>
          <span>Continue</span>
          <span className="kbd">Enter ↵</span>
        </button>
      </div>
    </>
  );
}
