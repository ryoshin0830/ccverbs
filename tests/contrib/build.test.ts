import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MAX_URL_LENGTH,
  buildSetJson,
  buildSetObject,
  newFileUrl,
} from "../../src/contrib/build.js";
import { emptyDraft } from "../../src/contrib/validate.js";
import { verbSetSchema } from "../../src/registry/schema.js";
import type { SetDraft } from "../../src/contrib/types.js";

const draft = (over: Partial<SetDraft> = {}): SetDraft => ({
  ...emptyDraft(),
  id: "ja-gym",
  name: "筋トレ",
  emoji: "🏋",
  description: "ジムに通う人のための単語セット",
  language: "ja",
  category: "meme",
  tags: ["fun", "gym"],
  verbsText: "筋トレしています\nプロテインを飲んでいます",
  ...over,
});

describe("buildSetObject", () => {
  it("produces a set that the repo schema accepts", () => {
    expect(verbSetSchema.safeParse(buildSetObject(draft())).success).toBe(true);
  });

  it("orders keys the way the existing sets do", () => {
    const keys = Object.keys(buildSetObject(draft({ authorName: "me", source: "https://x.co" })));
    expect(keys).toEqual([
      "$schema",
      "id",
      "name",
      "emoji",
      "description",
      "language",
      "category",
      "tags",
      "author",
      "source",
      "verbs",
    ]);
  });

  it("omits optional fields that are empty", () => {
    const keys = Object.keys(buildSetObject(draft()));
    expect(keys).not.toContain("author");
    expect(keys).not.toContain("source");
    expect(keys).not.toContain("i18n");
  });

  it("includes author when a name is given, with github only if provided", () => {
    expect(buildSetObject(draft({ authorName: "me" })).author).toEqual({ name: "me" });
    expect(buildSetObject(draft({ authorName: "me", authorGithub: "me-gh" })).author).toEqual({
      name: "me",
      github: "me-gh",
    });
  });

  it("ignores a github handle with no name", () => {
    expect(buildSetObject(draft({ authorGithub: "me-gh" })).author).toBeUndefined();
  });

  it("uses the trimmed, blank-stripped verbs", () => {
    expect(buildSetObject(draft({ verbsText: "  一つ  \n\n二つ\n" })).verbs).toEqual([
      "一つ",
      "二つ",
    ]);
  });

  it("points $schema at the repo schema relative to sets/", () => {
    expect(buildSetObject(draft()).$schema).toBe("../schema/verb-set.schema.json");
  });
});

describe("buildSetJson", () => {
  it("matches the formatting of the sets already in the repo", () => {
    const existing = readFileSync("sets/sisyphus.json", "utf8");
    const json = buildSetJson(draft());
    expect(json.endsWith("\n")).toBe(true);
    expect(json.includes('\n  "id"')).toBe(true);
    expect(existing.endsWith("\n")).toBe(true);
    expect(existing.includes('\n  "id"')).toBe(true);
  });

  it("does not escape non-ASCII", () => {
    expect(buildSetJson(draft())).toContain("筋トレしています");
  });

  it("round-trips through the schema", () => {
    expect(verbSetSchema.safeParse(JSON.parse(buildSetJson(draft()))).success).toBe(true);
  });

  it("preserves localized names and descriptions before verbs", () => {
    const json = buildSetJson(
      draft({
        i18n: {
          ja: { name: "筋トレ", description: "日本語の説明" },
          "zh-Hans": { name: "健身" },
        },
      }),
    );
    const parsed = JSON.parse(json);
    expect(Object.keys(parsed).slice(-2)).toEqual(["i18n", "verbs"]);
    expect(parsed.i18n).toEqual({
      ja: { name: "筋トレ", description: "日本語の説明" },
      "zh-Hans": { name: "健身" },
    });
  });
});

describe("newFileUrl", () => {
  it("targets the repo, branch and sets/ path", () => {
    const link = newFileUrl(draft());
    expect(link.filename).toBe("sets/ja-gym.json");
    expect(link.url).toContain("https://github.com/ryoshin0830/ccverbs/new/main");
    expect(link.url).toContain("filename=sets%2Fja-gym.json");
    expect(link.url).toContain("value=");
  });

  it("encodes the JSON so it round-trips out of the query string", () => {
    const link = newFileUrl(draft());
    const value = new URL(link.url as string).searchParams.get("value") as string;
    expect(JSON.parse(value).id).toBe("ja-gym");
  });

  it("always returns a fallback that opens the empty new-file page", () => {
    const link = newFileUrl(draft());
    expect(link.fallbackUrl).toBe(
      "https://github.com/ryoshin0830/ccverbs/new/main?filename=sets%2Fja-gym.json",
    );
    expect(link.fallbackUrl).not.toContain("value=");
  });

  it("caps at 7500", () => {
    expect(MAX_URL_LENGTH).toBe(7500);
  });

  it("keeps a 40-verb Japanese set inline", () => {
    const verbsText = Array.from({ length: 40 }, (_, i) => `岩を押し上げています${i}`).join("\n");
    const link = newFileUrl(draft({ verbsText }));
    expect(link.tooLong).toBe(false);
    expect(link.url).not.toBeNull();
  });

  // A fully-populated study set: the shape that justifies the 7500 cap. With
  // author, source, tags and a real description these encode past 6000, so a
  // 6000 cap would have sent the project's most valuable category down the
  // copy-and-paste path every time.
  const studyDraft = (count: number, verb: (i: number) => string) =>
    draft({
      id: "kubectl-advanced",
      name: "kubectl Commands",
      emoji: "🎡",
      description: "Learn kubectl subcommands while Claude works on your cluster",
      language: "mixed",
      category: "study",
      tags: ["kubernetes", "kubectl", "cli", "study"],
      authorName: "Some Contributor",
      authorGithub: "some-contributor",
      source: "https://kubernetes.io/docs/reference/kubectl/",
      verbsText: Array.from({ length: count }, (_, i) => verb(i)).join("\n"),
    });

  it("keeps a fully-populated 40-verb study set inline", () => {
    const link = newFileUrl(studyDraft(40, (i) => `kubectl drain ${i} — Nodeから退避させる`));
    expect(link.length).toBeGreaterThan(6000);
    expect(link.tooLong).toBe(false);
    expect(link.url).not.toBeNull();
  });

  it("keeps the widest realistic 40-verb study set inline", () => {
    const link = newFileUrl(
      studyDraft(40, (i) => `kubectl rollout undo ${i} — 直前のリビジョンへ`),
    );
    expect(link.length).toBeGreaterThan(6500);
    expect(link.tooLong).toBe(false);
  });

  it("falls back for 60 wide verbs", () => {
    const link = newFileUrl(
      studyDraft(60, (i) => `kubectl rollout undo ${i} — 直前のリビジョンへ`),
    );
    expect(link.tooLong).toBe(true);
    expect(link.url).toBeNull();
    expect(link.fallbackUrl).toContain("new/main");
  });

  it("falls back for a set that will not fit", () => {
    const verbsText = Array.from(
      { length: 100 },
      (_, i) => `とても長い日本語の動詞をここに置きます${i}`,
    ).join("\n");
    const link = newFileUrl(draft({ verbsText }));
    expect(link.tooLong).toBe(true);
    expect(link.url).toBeNull();
    expect(link.length).toBeGreaterThan(MAX_URL_LENGTH);
  });
});
