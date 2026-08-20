import { describe, expect, it } from "vitest";
import { displayWidth, verbSetSchema } from "../../src/registry/schema.js";

const valid = {
  id: "git-commands",
  name: "Git Commands",
  emoji: "\u{1F33F}",
  description: "Learn git subcommands while Claude works",
  language: "ja",
  category: "study",
  tags: ["git", "cli"],
  verbs: ["git rebase -i — 対話的リベース"],
};

describe("verbSetSchema", () => {
  it("accepts a well-formed set", () => {
    expect(verbSetSchema.parse(valid).id).toBe("git-commands");
  });

  it("rejects a non-kebab-case id", () => {
    expect(verbSetSchema.safeParse({ ...valid, id: "Git_Commands" }).success).toBe(false);
  });

  it("rejects an empty verb list", () => {
    expect(verbSetSchema.safeParse({ ...valid, verbs: [] }).success).toBe(false);
  });

  it("rejects duplicate verbs", () => {
    expect(verbSetSchema.safeParse({ ...valid, verbs: ["a", "a"] }).success).toBe(false);
  });

  it.each(["Thinking…", "Thinking...", "考えています。"])(
    "rejects a verb ending in %s because Claude Code appends the ellipsis",
    (verb) => {
      expect(verbSetSchema.safeParse({ ...valid, verbs: [verb] }).success).toBe(false);
    },
  );

  it("rejects verbs containing control characters", () => {
    expect(verbSetSchema.safeParse({ ...valid, verbs: ["a\nb"] }).success).toBe(false);
  });

  it("rejects untrimmed verbs", () => {
    expect(verbSetSchema.safeParse({ ...valid, verbs: [" padded "] }).success).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(verbSetSchema.safeParse({ ...valid, category: "misc" }).success).toBe(false);
  });
});

describe("displayWidth", () => {
  it("counts ASCII as one column", () => {
    expect(displayWidth("abc")).toBe(3);
  });

  it("counts CJK as two columns", () => {
    expect(displayWidth("岩を押す")).toBe(8);
  });
});
