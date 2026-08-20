import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { inferCategory, inferLanguage, suggestEmoji } from "../../src/contrib/infer.js";

describe("inferLanguage", () => {
  it.each([
    [["考えています", "組み立てています"], "ja"],
    [["にゃーんと鳴いています"], "ja"],
    [["カタカナダケ"], "ja"],
    [["한국어입니다", "또한"], "ko"],
    [["正在思考", "正在建造"], "zh-Hans"],
    [["Plunderin'", "Hoistin' the mainsail"], "en"],
    [["Jacking in"], "en"],
  ])("reads %o as %s", (verbs, expected) => {
    expect(inferLanguage(verbs)).toBe(expected);
  });

  it("calls a term-plus-translation set mixed", () => {
    expect(
      inferLanguage(["git rebase -i — 対話的に履歴を書き換え", "git bisect — 二分探索で特定"]),
    ).toBe("mixed");
  });

  it("does not call a Japanese set mixed for one incidental latin word", () => {
    expect(inferLanguage(["Claudeが働いています", "考えています", "組み立てています"])).toBe("ja");
  });

  it("falls back to en for an empty list", () => {
    expect(inferLanguage([])).toBe("en");
  });

  it("ignores digits and punctuation when deciding", () => {
    expect(inferLanguage(["1つ目", "2つ目", "3つ目"])).toBe("ja");
  });
});

describe("inferCategory", () => {
  it.each([
    [["git rebase -i — 対話的に履歴を書き換え", "git bisect — 二分探索で特定"], "study"],
    [["ephemeral — 儚い、短命の", "laconic — 言葉数の少ない"], "study"],
    [["nit: — 些細な指摘です", "LGTM — 良さそうです"], "study"],
    [["岩を押し上げています", "山頂を目指しています"], "meme"],
    [["Plunderin'", "Yo-ho-hoin'", "Razzle-dazzling"], "meme"],
  ])("reads %o as %s", (verbs, expected) => {
    expect(inferCategory(verbs)).toBe(expected);
  });

  it("does not treat an unspaced hyphen as a separator", () => {
    expect(inferCategory(["Yo-ho-hoin'", "Dilly-dallying", "Sock-hopping"])).toBe("meme");
  });

  it("needs most verbs to carry a separator, not just one", () => {
    expect(inferCategory(["これは — 説明つき", "これは説明なし", "これも説明なし"])).toBe("meme");
  });

  it("defaults to meme for an empty list", () => {
    expect(inferCategory([])).toBe("meme");
  });
});

// The strongest available check: run the inference over every set that actually
// ships, and require it to agree with what a human chose.
describe("inference against the 21 sets that ship", () => {
  const dir = join(process.cwd(), "sets");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "index.json");
  const sets = files.map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));

  it("covers all of them", () => {
    expect(sets.length).toBeGreaterThanOrEqual(21);
  });

  it.each(sets.map((s) => [s.id, s.language, s.verbs] as const))(
    "%s: infers the language a human picked (%s)",
    (_id, language, verbs) => {
      expect(inferLanguage(verbs)).toBe(language);
    },
  );

  it.each(
    // `classic` is a deliberate editorial choice and cannot be read off the
    // verbs, so those sets are excluded from the category check.
    sets.filter((s) => s.category !== "classic").map((s) => [s.id, s.category, s.verbs] as const),
  )("%s: infers the category a human picked (%s)", (_id, category, verbs) => {
    expect(inferCategory(verbs)).toBe(category);
  });
});

describe("suggestEmoji", () => {
  it("offers several options for every combination", () => {
    for (const language of ["ja", "en", "zh-Hans", "zh-Hant", "ko", "mixed"] as const) {
      for (const category of ["meme", "study", "classic"] as const) {
        const options = suggestEmoji(language, category);
        expect(options.length, `${language}/${category}`).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it("suggests tool-shaped emoji for study sets and playful ones for memes", () => {
    expect(suggestEmoji("mixed", "study")).toContain("🌿");
    expect(suggestEmoji("ja", "meme")).toContain("🐈");
  });

  it("returns single-codepoint emoji so terminal columns stay predictable", () => {
    for (const emoji of suggestEmoji("ja", "meme")) {
      expect([...emoji].length, emoji).toBe(1);
    }
  });
});
