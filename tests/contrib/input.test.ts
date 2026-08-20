import { describe, expect, it } from "vitest";
import { parseSetInput } from "../../src/contrib/input.js";

const valid = {
  id: "ja-gym",
  name: "筋トレ",
  emoji: "🏋",
  description: "ジムのセット間に見る言葉",
  language: "ja",
  category: "meme",
  tags: ["fun", "gym"],
  i18n: { en: { name: "Gym", description: "Gym words" } },
  verbs: ["筋トレしています", "プロテインを飲んでいます"],
};

describe("parseSetInput", () => {
  it("converts a committed-set object into a validated draft", () => {
    const result = parseSetInput(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft.verbsText).toBe("筋トレしています\nプロテインを飲んでいます");
      expect(JSON.parse(result.json).i18n.en.name).toBe("Gym");
    }
  });

  it("normalizes the schema hint", () => {
    const result = parseSetInput({ ...valid, $schema: "anything" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(JSON.parse(result.json).$schema).toBe("../schema/verb-set.schema.json");
    }
  });

  it("returns stable paths for schema errors", () => {
    const result = parseSetInput({ ...valid, id: "Not Kebab", verbs: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.path)).toEqual(
        expect.arrayContaining(["id", "verbs"]),
      );
    }
  });

  it("returns a width issue", () => {
    const result = parseSetInput({ ...valid, verbs: ["あ".repeat(21)] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ path: "verbs[0]", code: "too-wide", width: 42 }),
      );
    }
  });

  it("rejects unknown top-level fields", () => {
    const result = parseSetInput({ ...valid, prompt: "hidden data" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.path).toBe("prompt");
  });
});
