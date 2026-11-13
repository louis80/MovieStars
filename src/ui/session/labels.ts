import type { Person } from "../../learning/types";

const regions = (() => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    return null;
  }
})();

export function countryName(code: string | null): string | null {
  if (!code) return null;
  try {
    return regions?.of(code) ?? code;
  } catch {
    return code;
  }
}

export function roleLabel(person: Person): string {
  if (person.role === "director") return "Director";
  return person.gender === "female" ? "Actress" : "Actor";
}

/** "Actress · France" */
export function personLine(person: Person): string {
  return [roleLabel(person), countryName(person.country)].filter(Boolean).join(" · ");
}

export function pronoun(person: Person): string {
  if (person.gender === "female") return "she";
  if (person.gender === "male") return "he";
  return "they";
}

export function filmLabel(film: { title: string; year: number | null }): string {
  return film.year ? `${film.title} (${film.year})` : film.title;
}
