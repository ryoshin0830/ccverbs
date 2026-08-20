import { describe, expect, it } from "vitest";
import {
  applySpinnerVerbs,
  effectiveVerbCount,
  matchSet,
  readSpinnerVerbs,
  removeSpinnerVerbs,
} from "../../src/settings/apply.js";
import type { VerbSet } from "../../src/registry/schema.js";

const next = { mode: "replace" as const, verbs: ["押しています"] };

describe("applySpinnerVerbs", () => {
  it("adds spinnerVerbs while preserving every other key", () => {
    const result = applySpinnerVerbs({ env: { A: "1" }, hooks: {} }, next);
    expect(result.env).toEqual({ A: "1" });
    expect(result.hooks).toEqual({});
    expect(result.spinnerVerbs).toEqual(next);
  });

  it("keeps the original key order when the key is new", () => {
    expect(Object.keys(applySpinnerVerbs({ a: 1, b: 2 }, next))).toEqual([
      "a",
      "b",
      "spinnerVerbs",
    ]);
  });

  it("replaces in place when the key already exists", () => {
    const before = { a: 1, spinnerVerbs: { mode: "append", verbs: ["x"] }, b: 2 };
    const result = applySpinnerVerbs(before, next);
    expect(Object.keys(result)).toEqual(["a", "spinnerVerbs", "b"]);
    expect(result.spinnerVerbs).toEqual(next);
  });

  it("does not mutate its input", () => {
    const before = { a: 1 };
    applySpinnerVerbs(before, next);
    expect(before).toEqual({ a: 1 });
  });
});

describe("removeSpinnerVerbs", () => {
  it("drops only the spinnerVerbs key", () => {
    expect(removeSpinnerVerbs({ a: 1, spinnerVerbs: next })).toEqual({ a: 1 });
  });
});

describe("readSpinnerVerbs", () => {
  it("returns null when unset", () => {
    expect(readSpinnerVerbs({})).toBeNull();
  });
  it("returns null for a malformed value", () => {
    expect(readSpinnerVerbs({ spinnerVerbs: ["a"] })).toBeNull();
  });
  it("parses a valid value", () => {
    expect(readSpinnerVerbs({ spinnerVerbs: next })).toEqual(next);
  });
});

describe("effectiveVerbCount", () => {
  it("returns the Claude Code default when unset", () => {
    expect(effectiveVerbCount(null)).toBe(186);
  });
  it("returns the custom count for replace", () => {
    expect(effectiveVerbCount({ mode: "replace", verbs: ["a", "b"] })).toBe(2);
  });
  it("falls back to the default for an empty replace list", () => {
    expect(effectiveVerbCount({ mode: "replace", verbs: [] })).toBe(186);
  });
  it("adds to the default for append", () => {
    expect(effectiveVerbCount({ mode: "append", verbs: ["a", "b"] })).toBe(188);
  });
});

describe("matchSet", () => {
  const sets = [
    { id: "a", verbs: ["x", "y"] },
    { id: "b", verbs: ["z"] },
  ] as unknown as VerbSet[];

  it("identifies the set whose verbs match exactly", () => {
    expect(matchSet({ mode: "replace", verbs: ["x", "y"] }, sets)?.id).toBe("a");
  });
  it("returns null on a partial match", () => {
    expect(matchSet({ mode: "replace", verbs: ["x"] }, sets)).toBeNull();
  });
  it("returns null when unset", () => {
    expect(matchSet(null, sets)).toBeNull();
  });
});
