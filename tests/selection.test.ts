import { describe, expect, it } from "vitest";
import { findSet, groupByLocale, pickRandom, searchSets } from "../src/selection.js";
import type { VerbSet } from "../src/registry/schema.js";

const sets = [
  { id: "git-commands", name: "Git Commands", description: "Learn git", tags: ["cli"] },
  { id: "ja-cat", name: "Cats", description: "にゃーん", tags: ["fun", "animal"] },
  { id: "sql", name: "SQL", description: "Queries", tags: ["database"] },
] as unknown as VerbSet[];

describe("searchSets", () => {
  it("returns everything for an empty query", () => {
    expect(searchSets(sets, "")).toHaveLength(3);
  });
  it("matches on id", () => {
    expect(searchSets(sets, "git").map((s) => s.id)).toEqual(["git-commands"]);
  });
  it("matches on name case-insensitively", () => {
    expect(searchSets(sets, "cats").map((s) => s.id)).toEqual(["ja-cat"]);
  });
  it("matches on description", () => {
    expect(searchSets(sets, "queries").map((s) => s.id)).toEqual(["sql"]);
  });
  it("matches on tags", () => {
    expect(searchSets(sets, "animal").map((s) => s.id)).toEqual(["ja-cat"]);
  });
  it("returns an empty array when nothing matches", () => {
    expect(searchSets(sets, "zzz")).toEqual([]);
  });
});

describe("findSet", () => {
  it("finds by exact id", () => {
    expect(findSet(sets, "sql")?.id).toBe("sql");
  });
  it("returns null for an unknown id", () => {
    expect(findSet(sets, "nope")).toBeNull();
  });
});

describe("pickRandom", () => {
  it("uses the injected generator", () => {
    expect(pickRandom(sets, () => 0).id).toBe("git-commands");
    expect(pickRandom(sets, () => 0.99).id).toBe("sql");
  });
  it("throws on an empty list", () => {
    expect(() => pickRandom([], () => 0)).toThrow();
  });
});

describe("groupByLocale", () => {
  const banded = [
    { id: "z-en", language: "en" },
    { id: "a-mixed", language: "mixed" },
    { id: "m-ja", language: "ja" },
    { id: "b-ja", language: "ja" },
    { id: "c-en", language: "en" },
  ] as unknown as VerbSet[];

  it("puts the UI language first, then mixed, then the rest", () => {
    expect(groupByLocale(banded, "ja").map((s) => s.id)).toEqual([
      "b-ja", "m-ja", "a-mixed", "c-en", "z-en",
    ]);
  });

  it("sorts alphabetically inside each band", () => {
    expect(groupByLocale(banded, "en").map((s) => s.id)).toEqual([
      "c-en", "z-en", "a-mixed", "b-ja", "m-ja",
    ]);
  });

  it("treats simplified and traditional Chinese as different languages", () => {
    const zh = [
      { id: "hans", language: "zh-Hans" },
      { id: "hant", language: "zh-Hant" },
    ] as unknown as VerbSet[];
    expect(groupByLocale(zh, "zh-Hant").map((s) => s.id)).toEqual(["hant", "hans"]);
  });

  it("does not mutate its input", () => {
    const snapshot = banded.map((s) => s.id);
    groupByLocale(banded, "ja");
    expect(banded.map((s) => s.id)).toEqual(snapshot);
  });
});
