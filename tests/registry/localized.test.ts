import { describe, expect, it } from "vitest";
import {
  localizedDescription,
  localizedName,
  verbSetSchema,
  type VerbSet,
} from "../../src/registry/schema.js";

const base = {
  id: "s",
  name: "Name",
  emoji: "\u{1FAA8}",
  description: "Description",
  language: "ja" as const,
  category: "meme" as const,
  tags: [],
  verbs: ["やっています"],
};

describe("i18n block", () => {
  it("is optional", () => {
    expect(verbSetSchema.safeParse(base).success).toBe(true);
  });

  it("accepts per-locale name and description", () => {
    expect(
      verbSetSchema.safeParse({
        ...base,
        i18n: { ja: { name: "なまえ", description: "せつめい" }, ko: { description: "설명" } },
      }).success,
    ).toBe(true);
  });

  it("rejects an unknown locale key", () => {
    expect(verbSetSchema.safeParse({ ...base, i18n: { fr: { name: "nom" } } }).success).toBe(false);
  });

  it("accepts the new set languages", () => {
    for (const language of ["zh-Hans", "zh-Hant", "ko"]) {
      expect(verbSetSchema.safeParse({ ...base, language }).success, language).toBe(true);
    }
  });
});

describe("localizedName / localizedDescription", () => {
  const set = {
    ...base,
    i18n: { ja: { name: "なまえ" }, ko: { description: "설명" } },
  } as unknown as VerbSet;

  it("uses the translation when present", () => {
    expect(localizedName(set, "ja")).toBe("なまえ");
    expect(localizedDescription(set, "ko")).toBe("설명");
  });

  it("falls back per field, not per locale", () => {
    expect(localizedDescription(set, "ja")).toBe("Description");
    expect(localizedName(set, "ko")).toBe("Name");
  });

  it("falls back for a locale with no block at all", () => {
    expect(localizedName(set, "zh-Hant")).toBe("Name");
    expect(localizedDescription(set, "zh-Hant")).toBe("Description");
  });

  it("falls back when there is no i18n block", () => {
    expect(localizedName(base as unknown as VerbSet, "ja")).toBe("Name");
  });
});
