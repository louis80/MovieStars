import { shuffle, type Rng } from "./random";

const PARTICLES = new Set([
  "de",
  "del",
  "della",
  "di",
  "da",
  "du",
  "des",
  "le",
  "la",
  "van",
  "von",
  "der",
  "den",
  "ten",
  "ter",
  "st",
  "st.",
  "saint",
]);

/** Lower case, accents removed, only letters kept: "Léa Seydoux" → "lea seydoux". */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** The family name, keeping particles: "Robert De Niro" → "De Niro", "Marion Cotillard" → "Cotillard". */
export function familyName(fullName: string): string {
  const tokens = fullName.trim().split(/\s+/);
  let start = tokens.length - 1;
  while (start > 1 && PARTICLES.has((tokens[start - 1] ?? "").toLowerCase())) start--;
  return tokens.slice(start).join(" ");
}

/** Edit distance with transpositions (optimal string alignment). */
export function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  const at = (i: number, j: number) => d[i]?.[j] ?? 0;
  for (let i = 1; i < rows; i++) {
    const row = d[i] as number[];
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(at(i - 1, j) + 1, at(i, j - 1) + 1, at(i - 1, j - 1) + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, at(i - 2, j - 2) + 1);
      }
      row[j] = best;
    }
  }
  return at(a.length, b.length);
}

const compact = (text: string) => normalize(text).replace(/ /g, "");

/**
 * Typing mode (spec AC6): accepts the family name alone or the full name, ignoring
 * case, accents and spaces, and forgiving one typo.
 */
export function isTypedAnswerCorrect(input: string, fullName: string): boolean {
  const typed = compact(input);
  if (typed.length === 0) return false;

  const family = familyName(fullName);
  const lastWord = fullName.trim().split(/\s+/).at(-1) ?? fullName;
  const accepted = new Set([compact(family), compact(lastWord), compact(fullName)]);

  for (const target of accepted) {
    if (target.length > 0 && editDistance(typed, target) <= 1) return true;
  }
  return false;
}

/** The letters a person must tap in letter-tiles mode, e.g. "Cotillard" → "COTILLARD". */
export function tileAnswer(fullName: string): string {
  return compact(familyName(fullName)).toUpperCase();
}

export const EXTRA_TILES = 3;

/** The family name's letters plus 3 extra letters, shuffled (spec: letter tiles). */
export function buildTiles(fullName: string, rng: Rng): string[] {
  const answer = tileAnswer(fullName).split("");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter((l) => !answer.includes(l));
  const extras = shuffle(alphabet, rng).slice(0, EXTRA_TILES);
  return shuffle([...answer, ...extras], rng);
}

export function isTilesAnswerCorrect(tapped: string[], fullName: string): boolean {
  return tapped.join("") === tileAnswer(fullName);
}
