import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import type { PreparedSession } from "../../app/learningService";
import { useServices } from "../../app/ServicesContext";
import { buildCard, type Card } from "../../learning/cards";
import {
  answer as answerSession,
  currentPersonId,
  isComplete,
  progress,
  skip,
  startSession,
  summarize,
  type Session,
} from "../../learning/session";
import type { Grade, Person, QueueEntry } from "../../learning/types";
import { AnswerView } from "./AnswerView";
import { ChooseNameCard } from "./ChooseNameCard";
import { ConnectCard } from "./ConnectCard";
import { RecallCard } from "./RecallCard";
import { SessionContext } from "./SessionContext";
import { SessionSummary } from "./SessionSummary";
import { SessionTopBar } from "./SessionTopBar";

type Phase = { kind: "question" } | { kind: "answer"; grade: Grade; picked: string | undefined };

interface Finished {
  streak: number;
}

export function SessionScreen() {
  const { learning } = useServices();
  const [round, setRound] = useState(0);
  const [loaded, setLoaded] = useState<{ round: number; prepared: PreparedSession } | null>(null);

  useEffect(() => {
    let cancelled = false;
    learning.prepareSession().then((prepared) => !cancelled && setLoaded({ round, prepared }));
    return () => {
      cancelled = true;
    };
  }, [learning, round]);

  const prepared = loaded?.round === round ? loaded.prepared : null;

  if (!prepared) {
    return (
      <main className="screen">
        <p className="lead">Getting faces ready…</p>
      </main>
    );
  }

  if (prepared.order.length === 0) {
    return (
      <main className="screen">
        <h1 className="title-sm">Nothing to review right now</h1>
        <p className="lead">
          Everyone is scheduled for later. Add films you've seen for new faces.
        </p>
        <div className="bottom">
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
          <Link to="/films" className="btn-text" style={{ textAlign: "center" }}>
            I just watched…
          </Link>
        </div>
      </main>
    );
  }

  return (
    <SessionRun
      key={round}
      prepared={prepared}
      extraRoundOffered={round > 0}
      onMore={() => setRound((r) => r + 1)}
    />
  );
}

function SessionRun({
  prepared,
  extraRoundOffered,
  onMore,
}: {
  prepared: PreparedSession;
  extraRoundOffered: boolean;
  onMore: () => void;
}) {
  const { learning, rng } = useServices();
  const [session, setSession] = useState<Session>(() => startSession(prepared.order));
  const [entries, setEntries] = useState<Map<number, QueueEntry>>(() => new Map(prepared.entries));
  const [phase, setPhase] = useState<Phase>({ kind: "question" });
  const [interested, setInterested] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState<Finished | null>(null);
  const before = prepared.entries;

  const personId = currentPersonId(session);
  const person: Person | undefined =
    personId === undefined ? undefined : prepared.people.get(personId);
  const entry = personId === undefined ? undefined : entries.get(personId);

  // A card is built once per position, so it does not reshuffle on every render.
  const card: Card | null = useMemo(() => {
    if (!person || !entry) return null;
    return buildCard(person, entry.level, {
      pool: prepared.pool,
      films: prepared.films,
      seenFilmIds: prepared.seenFilmIds,
      rng,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.position, person?.id]);

  const done = isComplete(session);

  useEffect(() => {
    if (!done || finished) return;
    learning.finishSession().then((profile) => setFinished({ streak: profile.streak }));
  }, [done, finished, learning]);

  const record = useCallback(
    async (grade: Grade) => {
      if (personId === undefined) return;
      const updated = await learning.recordAnswer(personId, grade);
      if (updated) setEntries((m) => new Map(m).set(personId, updated));
    },
    [learning, personId],
  );

  const onAnswer = async (grade: Grade, picked?: string, shownAlready = false) => {
    await record(grade);
    if (shownAlready) setSession((s) => answerSession(s, grade));
    else setPhase({ kind: "answer", grade, picked });
  };

  const onContinue = () => {
    if (phase.kind !== "answer") return;
    setSession((s) => answerSession(s, phase.grade));
    setPhase({ kind: "question" });
  };

  const onNotForMe = async () => {
    if (personId === undefined) return;
    await learning.notForMe(personId);
    const removed = personId;
    setSession((s) => {
      // Drop any later repeat of this person, then move on.
      const rest = s.order.slice(s.position + 1).filter((id) => id !== removed);
      const answered = phase.kind === "answer" ? answerSession(s, phase.grade) : skip(s);
      return { ...answered, order: [...s.order.slice(0, s.position + 1), ...rest] };
    });
    setPhase({ kind: "question" });
  };

  const onInterested = async () => {
    if (personId === undefined) return;
    await learning.markInterested(personId);
    setInterested((set) => new Set(set).add(personId));
  };

  if (done) {
    const summary = summarize(session, before, entries);
    const levelledUp = summary.levelledUp
      .map((id) => prepared.people.get(id))
      .filter((p): p is Person => p !== undefined);
    return (
      <SessionSummary
        summary={summary}
        levelledUp={levelledUp}
        streak={finished?.streak ?? null}
        canOfferMore={!extraRoundOffered}
        onMore={onMore}
      />
    );
  }

  if (!person || !entry || !card) return null;

  const isNewFace = (before.get(person.id)?.memory.reps ?? 0) === 0;
  const { done: answered, total } = progress(session);

  return (
    <SessionContext.Provider value={{ films: prepared.films, seenFilmIds: prepared.seenFilmIds }}>
      <main className="screen session">
        <SessionTopBar done={answered} total={total} />
        {phase.kind === "answer" ? (
          <AnswerView
            person={person}
            grade={phase.grade}
            picked={phase.picked}
            isNewFace={isNewFace}
            interested={interested.has(person.id)}
            onInterested={onInterested}
            onNotForMe={onNotForMe}
            onContinue={onContinue}
          />
        ) : (
          <div className="card-body" key={session.position}>
            {card.kind === "choose-name" && (
              <ChooseNameCard card={card} onAnswer={(g, picked) => onAnswer(g, picked)} />
            )}
            {card.kind === "recall" && (
              <RecallCard
                card={card}
                mode={prepared.recallMode}
                onAnswer={(a) => onAnswer(a.grade, a.picked, a.shownAlready)}
              />
            )}
            {(card.kind === "film-to-person" || card.kind === "person-to-film") && (
              <ConnectCard card={card} onAnswer={(g, picked) => onAnswer(g, picked)} />
            )}
            {isNewFace && (
              <div className="new-face">
                <span className="quiet">New face</span>
                <button type="button" className="btn-text underline" onClick={onNotForMe}>
                  Not for me
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </SessionContext.Provider>
  );
}
