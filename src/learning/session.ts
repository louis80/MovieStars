import { isDue } from "./schedule";
import type { Grade, Profile, QueueEntry } from "./types";

/**
 * Today's cards (spec: Session mix): due reviews first, most overdue first, then new
 * people in the order they were added, up to the daily goal.
 */
export function planSession(queue: QueueEntry[], goal: number, now: Date): number[] {
  const due = queue
    .filter((e) => e.memory.reps > 0 && isDue(e.memory, now))
    .sort((a, b) => a.memory.due.getTime() - b.memory.due.getTime());
  const fresh = queue.filter((e) => e.memory.reps === 0).sort((a, b) => a.addedAt - b.addedAt);
  return [...due, ...fresh].slice(0, goal).map((e) => e.personId);
}

export interface SessionAnswer {
  personId: number;
  grade: Grade;
}

export interface Session {
  /** People to show, in order. Missed people are appended once. */
  order: number[];
  position: number;
  answers: SessionAnswer[];
  /** People already repeated after a miss, so they come back only once. */
  repeated: number[];
}

export function startSession(order: number[]): Session {
  return { order, position: 0, answers: [], repeated: [] };
}

export function currentPersonId(session: Session): number | undefined {
  return session.order[session.position];
}

export function isComplete(session: Session): boolean {
  return session.position >= session.order.length;
}

/** Record an answer; a miss brings the person back once at the end of the session (AC7). */
export function answer(session: Session, grade: Grade): Session {
  const personId = currentPersonId(session);
  if (personId === undefined) return session;

  const repeat = grade === "again" && !session.repeated.includes(personId);
  return {
    order: repeat ? [...session.order, personId] : session.order,
    position: session.position + 1,
    answers: [...session.answers, { personId, grade }],
    repeated: repeat ? [...session.repeated, personId] : session.repeated,
  };
}

/** Progress for the bar at the top of a card: answers given out of cards planned so far. */
export function progress(session: Session): { done: number; total: number } {
  return { done: session.position, total: session.order.length };
}

export interface SessionSummary {
  right: number;
  wrong: number;
  levelledUp: number[];
}

export function summarize(
  session: Session,
  before: ReadonlyMap<number, QueueEntry>,
  after: ReadonlyMap<number, QueueEntry>,
): SessionSummary {
  const right = session.answers.filter((a) => a.grade === "good").length;
  const levelledUp = [...after.values()]
    .filter((e) => {
      const was = before.get(e.personId);
      return was !== undefined && e.level > was.level;
    })
    .map((e) => e.personId);
  return { right, wrong: session.answers.length - right, levelledUp };
}

// ---- Streak (spec: Engagement) ----

const DAY_MS = 24 * 60 * 60 * 1000;

function dayNumber(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / DAY_MS;
}

function dayString(n: number): string {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

/** Monday of the week containing the given day, as YYYY-MM-DD. */
export function weekOf(day: string): string {
  const n = dayNumber(day);
  const weekday = (new Date(n * DAY_MS).getUTCDay() + 6) % 7; // Monday = 0
  return dayString(n - weekday);
}

function canForgive(profile: Profile, missedDay: string): boolean {
  return profile.forgivenWeek !== weekOf(missedDay);
}

/** The streak to show today: it is broken if more days were missed than can be forgiven. */
export function currentStreak(profile: Profile, today: string): number {
  if (!profile.lastSessionDay) return 0;
  const gap = dayNumber(today) - dayNumber(profile.lastSessionDay);
  if (gap <= 1) return profile.streak;
  if (gap === 2 && canForgive(profile, dayString(dayNumber(today) - 1))) return profile.streak;
  return 0;
}

/** Update the streak when a session is completed today. One missed day per week is forgiven. */
export function completeSessionDay(profile: Profile, today: string): Profile {
  const last = profile.lastSessionDay;
  if (last === today) return profile;
  if (!last) return { ...profile, streak: 1, lastSessionDay: today };

  const gap = dayNumber(today) - dayNumber(last);
  if (gap === 1) return { ...profile, streak: profile.streak + 1, lastSessionDay: today };

  const missedDay = dayString(dayNumber(today) - 1);
  if (gap === 2 && canForgive(profile, missedDay)) {
    return {
      ...profile,
      streak: profile.streak + 1,
      lastSessionDay: today,
      forgivenWeek: weekOf(missedDay),
    };
  }
  return { ...profile, streak: 1, lastSessionDay: today };
}
