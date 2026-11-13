import { filmDetails, films, people } from "../../tests/fixtures/tmdb";
import { countryFromPlaceOfBirth, decadeOf, toFilm, toPerson, yearFromDate } from "./map";

describe("countryFromPlaceOfBirth", () => {
  it.each([
    ["Paris, France", "FR"],
    ["Summit, New Jersey, USA", "US"],
    ["Westminster, London, England, UK", "GB"],
    ["Suhl, Thuringia, East Germany", "DE"],
    ["Somewhere, Atlantis", null],
    [null, null],
  ])("%s → %s", (place, code) => {
    expect(countryFromPlaceOfBirth(place)).toBe(code);
  });
});

describe("yearFromDate", () => {
  it("reads the year from a TMDB date", () => {
    expect(yearFromDate("2010-07-15")).toBe(2010);
  });
  it("returns null for an empty date", () => {
    expect(yearFromDate("")).toBeNull();
  });
});

describe("decadeOf", () => {
  it("uses the median film year", () => {
    const refs = [2007, 2010, 2012].map((year, id) => ({ id, title: "", year, posterPath: null }));
    expect(decadeOf(refs)).toBe(2010);
  });
  it("is null with no dated films", () => {
    expect(decadeOf([])).toBeNull();
  });
});

describe("toPerson", () => {
  it("maps an actor with country, decade and best-known roles", () => {
    const person = toPerson(people.marionCotillard);
    expect(person).toMatchObject({
      name: "Marion Cotillard",
      role: "actor",
      country: "FR",
      decade: 2010,
    });
    expect(person.knownFor[0]).toMatchObject({ title: "Inception", character: "Mal" });
    expect(person.knownFor.map((f) => f.title)).toContain("La Vie en Rose");
  });

  it("maps a director to the films they directed", () => {
    const person = toPerson(people.justineTriet);
    expect(person.role).toBe("director");
    expect(person.knownFor.map((f) => f.title)).toEqual(["Anatomy of a Fall", "Sybil"]);
  });
});

describe("toFilm", () => {
  it("keeps the director and the top 5 billed cast", () => {
    const details = filmDetails[films.inception.id];
    if (!details) throw new Error("missing fixture");
    const film = toFilm(details);
    expect(film.directorIds).toEqual([people.christopherNolan.id]);
    expect(film.castIds).toHaveLength(5);
    expect(film.castIds).not.toContain(people.marionCotillard.id);
    expect(film.year).toBe(2010);
  });
});
