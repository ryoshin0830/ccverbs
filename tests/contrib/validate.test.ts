import { describe, expect, it } from "vitest";
import { emptyDraft, slugify, validateDraft } from "../../src/contrib/validate.js";
import type { SetDraft } from "../../src/contrib/types.js";

const draft = (over: Partial<SetDraft> = {}): SetDraft => ({
  ...emptyDraft(),
  id: "my-set",
  name: "My Set",
  emoji: "✨",
  description: "One line about it",
  language: "ja",
  category: "meme",
  tags: ["fun"],
  verbsText: "やっています\nまだやっています",
  ...over,
});

describe("emptyDraft", () => {
  it("starts valid-shaped with sensible defaults", () => {
    const d = emptyDraft();
    expect(d.language).toBe("ja");
    expect(d.category).toBe("meme");
    expect(d.tags).toEqual([]);
    expect(d.verbsText).toBe("");
  });
});

describe("slugify", () => {
  it.each([
    ["My Set", "my-set"],
    ["  Spaced  Out  ", "spaced-out"],
    ["Already-kebab", "already-kebab"],
    ["Symbols!@#Here", "symbols-here"],
    ["under_scores", "under-scores"],
    ["CamelCaseThing", "camelcasething"],
    ["trailing---dashes---", "trailing-dashes"],
    ["日本語だけ", ""],
    ["gym2024", "gym2024"],
  ])("turns %s into %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});

describe("validateDraft — verbs", () => {
  it("accepts a clean draft", () => {
    const d = validateDraft(draft());
    expect(d.ok).toBe(true);
    expect(d.verbs).toEqual(["やっています", "まだやっています"]);
    expect(d.verbIssues).toEqual([]);
  });

  it("trims whitespace and drops blank lines silently", () => {
    const d = validateDraft(draft({ verbsText: "  一つ目  \n\n\n  二つ目\n   \n" }));
    expect(d.verbs).toEqual(["一つ目", "二つ目"]);
    expect(d.verbIssues).toEqual([]);
    expect(d.ok).toBe(true);
  });

  it("numbers issues by index among non-blank lines", () => {
    const d = validateDraft(draft({ verbsText: "よい\n\nだめです。\nよい二つ目" }));
    expect(d.verbIssues).toHaveLength(1);
    expect(d.verbIssues[0]).toMatchObject({ index: 1, kind: "trailing-ellipsis" });
  });

  it.each(["だめです…", "nope...", "だめです。"])("rejects %s as trailing-ellipsis", (verb) => {
    const d = validateDraft(draft({ verbsText: verb }));
    expect(d.verbIssues[0]?.kind).toBe("trailing-ellipsis");
    expect(d.ok).toBe(false);
  });

  it("reports duplicates once, on the later occurrence", () => {
    const d = validateDraft(draft({ verbsText: "同じ\n違う\n同じ" }));
    expect(d.verbIssues).toHaveLength(1);
    expect(d.verbIssues[0]).toMatchObject({ index: 2, kind: "duplicate" });
  });

  it("treats width over 40 as an error, not a warning", () => {
    const d = validateDraft(draft({ verbsText: "あ".repeat(21) }));
    expect(d.verbIssues[0]).toMatchObject({ kind: "too-wide", width: 42 });
    expect(d.ok).toBe(false);
  });

  it("accepts exactly 40 columns", () => {
    const d = validateDraft(draft({ verbsText: "あ".repeat(20) }));
    expect(d.verbIssues).toEqual([]);
    expect(d.ok).toBe(true);
  });

  it("rejects a verb over 120 characters", () => {
    const d = validateDraft(draft({ verbsText: "a".repeat(121) }));
    expect(d.verbIssues.map((i) => i.kind)).toContain("too-long");
  });

  it("rejects control characters", () => {
    const d = validateDraft(draft({ verbsText: "bad\u0007verb" }));
    expect(d.verbIssues[0]?.kind).toBe("control-char");
  });

  it("requires at least one verb", () => {
    const d = validateDraft(draft({ verbsText: "   \n\n" }));
    expect(d.fieldErrors.verbsText).toBeTruthy();
    expect(d.ok).toBe(false);
  });

  it("rejects more than 500 verbs", () => {
    const many = Array.from({ length: 501 }, (_, i) => `verb${i}`).join("\n");
    expect(validateDraft(draft({ verbsText: many })).fieldErrors.verbsText).toBeTruthy();
  });
});

describe("validateDraft — fields", () => {
  it.each([
    ["id", { id: "" }],
    ["id", { id: "Not Kebab" }],
    ["id", { id: "trailing-" }],
    ["name", { name: "" }],
    ["name", { name: "x".repeat(41) }],
    ["emoji", { emoji: "" }],
    ["description", { description: "" }],
    ["description", { description: "x".repeat(121) }],
  ])("reports %s", (field, over) => {
    const d = validateDraft(draft(over as Partial<SetDraft>));
    expect(d.fieldErrors[field], JSON.stringify(over)).toBeTruthy();
    expect(d.ok).toBe(false);
  });

  it("rejects a non-kebab tag", () => {
    expect(validateDraft(draft({ tags: ["Not Kebab"] })).fieldErrors.tags).toBeTruthy();
  });

  it("rejects more than 8 tags", () => {
    const tags = Array.from({ length: 9 }, (_, i) => `t${i}`);
    expect(validateDraft(draft({ tags })).fieldErrors.tags).toBeTruthy();
  });

  it("accepts no tags", () => {
    expect(validateDraft(draft({ tags: [] })).ok).toBe(true);
  });

  it("rejects a source that is not a URL", () => {
    expect(validateDraft(draft({ source: "not a url" })).fieldErrors.source).toBeTruthy();
  });

  it("accepts an https source", () => {
    expect(validateDraft(draft({ source: "https://example.com/x" })).ok).toBe(true);
  });

  it("accepts an empty source as absent", () => {
    expect(validateDraft(draft({ source: "" })).ok).toBe(true);
  });
});
