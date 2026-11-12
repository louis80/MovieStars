import {
  EXTRA_TILES,
  buildTiles,
  editDistance,
  familyName,
  isTilesAnswerCorrect,
  isTypedAnswerCorrect,
  normalize,
  tileAnswer,
} from "./answer";
import { seededRng } from "./random";

describe("normalize", () => {
  it("removes accents and case", () => {
    expect(normalize("Léa SEYDOUX")).toBe("lea seydoux");
    expect(normalize("Sandra Hüller")).toBe("sandra huller");
  });
});

describe("familyName", () => {
  it.each([
    ["Marion Cotillard", "Cotillard"],
    ["Robert De Niro", "De Niro"],
    ["Guillermo del Toro", "del Toro"],
    ["Jean-Luc Godard", "Godard"],
    ["Zendaya", "Zendaya"],
  ])("%s → %s", (full, family) => {
    expect(familyName(full)).toBe(family);
  });
});

describe("editDistance", () => {
  it("counts a swap of two letters as one edit", () => {
    expect(editDistance("cotillrad", "cotillard")).toBe(1);
  });
  it("counts a missing letter as one edit", () => {
    expect(editDistance("cotilard", "cotillard")).toBe(1);
  });
});

// AC6 (typing part): accepts the family name alone and tolerates one typo or a missing accent.
describe("isTypedAnswerCorrect (AC6)", () => {
  it.each([
    ["Cotillard", "Marion Cotillard"],
    ["cotillard", "Marion Cotillard"],
    ["Cotilard", "Marion Cotillard"],
    ["Marion Cotillard", "Marion Cotillard"],
    ["Huller", "Sandra Hüller"],
    ["Seydoux", "Léa Seydoux"],
    ["De Niro", "Robert De Niro"],
    ["deniro", "Robert De Niro"],
    ["Niro", "Robert De Niro"],
  ])("accepts %j for %s", (typed, name) => {
    expect(isTypedAnswerCorrect(typed, name)).toBe(true);
  });

  it.each([
    ["", "Marion Cotillard"],
    ["Marion", "Marion Cotillard"],
    ["Cotilar", "Marion Cotillard"],
    ["Seydoux", "Marion Cotillard"],
  ])("rejects %j for %s", (typed, name) => {
    expect(isTypedAnswerCorrect(typed, name)).toBe(false);
  });
});

describe("letter tiles", () => {
  it("contains every letter of the family name plus 3 extras", () => {
    const tiles = buildTiles("Marion Cotillard", seededRng(1));
    expect(tiles).toHaveLength("COTILLARD".length + EXTRA_TILES);
    const remaining = [...tiles];
    for (const letter of tileAnswer("Marion Cotillard")) {
      const index = remaining.indexOf(letter);
      expect(index).toBeGreaterThanOrEqual(0);
      remaining.splice(index, 1);
    }
    expect(remaining.every((l) => !"COTILLARD".includes(l))).toBe(true);
  });

  it("drops accents and spaces from the answer", () => {
    expect(tileAnswer("Sandra Hüller")).toBe("HULLER");
    expect(tileAnswer("Robert De Niro")).toBe("DENIRO");
  });

  it("checks the tapped letters", () => {
    expect(isTilesAnswerCorrect("HULLER".split(""), "Sandra Hüller")).toBe(true);
    expect(isTilesAnswerCorrect("HULER".split(""), "Sandra Hüller")).toBe(false);
  });
});
