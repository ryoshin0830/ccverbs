# ccverbs Contribution Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let anyone build a verb set in the browser, watch it animate the way Claude Code will actually render it, and reach a pull request in two clicks — with no server-side secret anywhere.

**Architecture:** The validation and JSON-building logic lives in `src/contrib/` inside the CLI package, so the existing vitest suite covers it and a future `ccverbs new` can reuse it. A Next.js app in `web/` imports those pure functions, renders a live spinner preview, and hands off to GitHub's own new-file URL — the app has no API routes, no state, and no environment variables.

**Tech Stack:** TypeScript, Next.js 15 (App Router, `output: "standalone"`), React 19, zod, vitest.

**Spec:** `docs/superpowers/specs/2026-08-20-ccverbs-contribution-web-design.md`

## Global Constraints

- `MAX_URL_LENGTH = 7500`. Measured: 40 ja verbs → 5,767; **40 study verbs → 6,167**; 100 long verbs → 20,827. The 6,167 case must not fall back.
- `src/contrib/` must contain **pure functions only** — no `node:fs`, no `node:os`, nothing that fails in a browser.
- The web app's import graph must never reach `src/constants.ts`, which imports `node:os` and `node:path`. Today the safe path is `contrib/validate.ts` → `registry/schema.ts` → `i18n/locales.ts` (type-only), and none of those touch Node built-ins. Verify with the grep in Task 3 Step 4 whenever `src/contrib/` gains an import.
- The web app has **no API routes, no server state, and zero environment variables**. That is the point of choosing the deep-link approach.
- Deep link shape: `https://github.com/ryoshin0830/ccverbs/new/main?filename=sets/<id>.json&value=<encoded>`
- Verb rules are identical to the repo's: no `…` / `...` / `。` ending, no duplicates within a set, no control characters, 1–120 characters, **display width ≤ 40 is an error** (not a warning) because the repo's test suite fails above 40.
- Whitespace is trimmed and blank lines dropped silently — never reported as errors.
- Generated JSON must match the existing 21 sets byte-for-byte in style: 2-space indent, trailing newline, `$schema` first, `i18n` immediately before `verbs`.
- Root `tsconfig.json` keeps `"include": ["src", "tests"]` — `web/` is never added to it and has its own tsconfig.
- Root `package.json` keeps `"files": ["dist"]`, so `web/` never reaches npm.
- Node.js >= 22.12.0 for the Lolipop CLI; npm only (no pnpm/yarn).
- CLI version goes to `0.2.1` — the README ships inside the npm tarball, so the npm page needs a release to pick up the reshuffle.

---

### Task 1: Draft validation

**Files:**
- Create: `src/contrib/types.ts`, `src/contrib/validate.ts`
- Test: `tests/contrib/validate.test.ts`

**Interfaces:**
- Consumes: `displayWidth`, `layoutWidth` from `src/registry/schema.js`; `SupportedLocale` from `src/i18n/locales.js`.
- Produces:
  - `type SetLanguage = "ja" | "en" | "zh-Hans" | "zh-Hant" | "ko" | "mixed"`
  - `type SetCategory = "meme" | "study" | "classic"`
  - `interface SetDraft { id: string; name: string; emoji: string; description: string; language: SetLanguage; category: SetCategory; tags: string[]; authorName?: string; authorGithub?: string; source?: string; verbsText: string }`
  - `type VerbIssueKind = "trailing-ellipsis" | "too-wide" | "duplicate" | "control-char" | "too-long"`
  - `interface VerbIssue { index: number; verb: string; kind: VerbIssueKind; width?: number }`
  - `interface DraftDiagnostics { verbs: string[]; verbIssues: VerbIssue[]; fieldErrors: Record<string, string>; ok: boolean }`
  - `function validateDraft(draft: SetDraft): DraftDiagnostics`
  - `function emptyDraft(): SetDraft`
  - `function slugify(text: string): string`

- [ ] **Step 1: Write the failing test**

```ts
// tests/contrib/validate.test.ts
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
    const wide = "あ".repeat(21); // 42 columns
    const d = validateDraft(draft({ verbsText: wide }));
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
  ])("reports %s for %o", (field, over) => {
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/contrib/validate.test.ts`
Expected: FAIL — cannot resolve `../../src/contrib/validate.js`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/contrib/types.ts
export type SetLanguage = "ja" | "en" | "zh-Hans" | "zh-Hant" | "ko" | "mixed";
export type SetCategory = "meme" | "study" | "classic";

export interface SetDraft {
  id: string;
  name: string;
  emoji: string;
  description: string;
  language: SetLanguage;
  category: SetCategory;
  tags: string[];
  authorName?: string;
  authorGithub?: string;
  source?: string;
  /** Raw multi-line text, one verb per line. Blank lines are ignored. */
  verbsText: string;
}

export type VerbIssueKind =
  | "trailing-ellipsis"
  | "too-wide"
  | "duplicate"
  | "control-char"
  | "too-long";

export interface VerbIssue {
  /** Index among non-blank lines, zero-based. */
  index: number;
  verb: string;
  kind: VerbIssueKind;
  /** Measured columns, only for "too-wide". */
  width?: number;
}

export interface DraftDiagnostics {
  /** Trimmed, blank lines removed. */
  verbs: string[];
  verbIssues: VerbIssue[];
  fieldErrors: Record<string, string>;
  ok: boolean;
}

export const SET_LANGUAGES: readonly SetLanguage[] = [
  "ja", "en", "zh-Hans", "zh-Hant", "ko", "mixed",
];
export const SET_CATEGORIES: readonly SetCategory[] = ["meme", "study", "classic"];
export const MAX_VERB_WIDTH = 40;
export const MAX_VERBS = 500;
```

```ts
// src/contrib/validate.ts
import { displayWidth } from "../registry/schema.js";
import {
  MAX_VERB_WIDTH,
  MAX_VERBS,
  SET_CATEGORIES,
  SET_LANGUAGES,
  type DraftDiagnostics,
  type SetDraft,
  type VerbIssue,
} from "./types.js";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const TRAILING_ELLIPSIS = /(…|\.\.\.|。)$/;

export function emptyDraft(): SetDraft {
  return {
    id: "",
    name: "",
    emoji: "",
    description: "",
    language: "ja",
    category: "meme",
    tags: [],
    verbsText: "",
  };
}

/** Turn a human name into a kebab-case id. Non-ASCII is dropped. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Split the textarea into verbs: trimmed, blank lines dropped. */
export function splitVerbs(verbsText: string): string[] {
  return verbsText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function checkVerbs(verbs: string[]): VerbIssue[] {
  const issues: VerbIssue[] = [];
  const seen = new Set<string>();

  verbs.forEach((verb, index) => {
    if (CONTROL_CHARS.test(verb)) {
      issues.push({ index, verb, kind: "control-char" });
      return;
    }
    if (verb.length > 120) {
      issues.push({ index, verb, kind: "too-long" });
      return;
    }
    if (TRAILING_ELLIPSIS.test(verb)) {
      issues.push({ index, verb, kind: "trailing-ellipsis" });
      return;
    }
    if (seen.has(verb)) {
      issues.push({ index, verb, kind: "duplicate" });
      return;
    }
    seen.add(verb);

    const width = displayWidth(verb);
    if (width > MAX_VERB_WIDTH) issues.push({ index, verb, kind: "too-wide", width });
  });

  return issues;
}

export function validateDraft(draft: SetDraft): DraftDiagnostics {
  const verbs = splitVerbs(draft.verbsText);
  const verbIssues = checkVerbs(verbs);
  const fieldErrors: Record<string, string> = {};

  if (!draft.id) fieldErrors.id = "An id is required.";
  else if (!KEBAB.test(draft.id)) {
    fieldErrors.id = "Use lowercase letters, numbers and single hyphens, e.g. ja-gym.";
  }

  if (!draft.name) fieldErrors.name = "A name is required.";
  else if (draft.name.length > 40) fieldErrors.name = "Keep the name under 41 characters.";

  if (!draft.emoji) fieldErrors.emoji = "Pick one emoji.";
  else if ([...draft.emoji].length > 4) fieldErrors.emoji = "One emoji, not several.";

  if (!draft.description) fieldErrors.description = "One line describing the set.";
  else if (draft.description.length > 120) {
    fieldErrors.description = "Keep the description under 121 characters.";
  }

  if (!SET_LANGUAGES.includes(draft.language)) fieldErrors.language = "Pick a language.";
  if (!SET_CATEGORIES.includes(draft.category)) fieldErrors.category = "Pick a category.";

  if (draft.tags.length > 8) fieldErrors.tags = "Up to 8 tags.";
  else if (draft.tags.some((tag) => !KEBAB.test(tag))) {
    fieldErrors.tags = "Tags are lowercase words, optionally hyphenated.";
  }

  if (draft.source && !/^https?:\/\/\S+$/.test(draft.source)) {
    fieldErrors.source = "Must be a full http(s) URL, or left empty.";
  }

  if (verbs.length === 0) fieldErrors.verbsText = "Add at least one verb, one per line.";
  else if (verbs.length > MAX_VERBS) fieldErrors.verbsText = `At most ${MAX_VERBS} verbs.`;

  return {
    verbs,
    verbIssues,
    fieldErrors,
    ok: verbIssues.length === 0 && Object.keys(fieldErrors).length === 0,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/contrib/validate.test.ts && npx tsc --noEmit`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/contrib tests/contrib
git commit -m "feat: validate a verb set draft with the repo's own rules"
```

---

### Task 2: JSON building and the GitHub deep link

**Files:**
- Create: `src/contrib/build.ts`
- Test: `tests/contrib/build.test.ts`

**Interfaces:**
- Consumes: `SetDraft` (Task 1), `splitVerbs` (Task 1), `verbSetSchema` from `src/registry/schema.js`.
- Produces:
  - `const REPO_OWNER = "ryoshin0830"`, `const REPO_NAME = "ccverbs"`, `const REPO_BRANCH = "main"`
  - `const MAX_URL_LENGTH = 7500`
  - `function buildSetObject(draft: SetDraft): Record<string, unknown>`
  - `function buildSetJson(draft: SetDraft): string`
  - `interface NewFileLink { url: string | null; fallbackUrl: string; length: number; tooLong: boolean; filename: string }`
  - `function newFileUrl(draft: SetDraft): NewFileLink`

- [ ] **Step 1: Write the failing test**

```ts
// tests/contrib/build.test.ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MAX_URL_LENGTH, buildSetJson, buildSetObject, newFileUrl } from "../../src/contrib/build.js";
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
      "$schema", "id", "name", "emoji", "description",
      "language", "category", "tags", "author", "source", "verbs",
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
    expect(buildSetObject(draft({ verbsText: "  一つ  \n\n二つ\n" })).verbs).toEqual(["一つ", "二つ"]);
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
    expect(json.includes("\n  \"id\"")).toBe(true);
    // Same indent unit and trailing newline as what is committed.
    expect(existing.endsWith("\n")).toBe(true);
    expect(existing.includes("\n  \"id\"")).toBe(true);
  });

  it("does not escape non-ASCII", () => {
    expect(buildSetJson(draft())).toContain("筋トレしています");
  });

  it("round-trips through the schema", () => {
    expect(verbSetSchema.safeParse(JSON.parse(buildSetJson(draft()))).success).toBe(true);
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

  // The regression the 6000 estimate would have caused: study sets are the
  // most valuable category and must not fall back.
  it("keeps a 40-verb study set inline", () => {
    const verbsText = Array.from(
      { length: 40 },
      (_, i) => `kubectl drain ${i} — Nodeから退避させる`,
    ).join("\n");
    const link = newFileUrl(draft({ verbsText, language: "mixed", category: "study" }));
    expect(link.length).toBeGreaterThan(6000);
    expect(link.tooLong).toBe(false);
    expect(link.url).not.toBeNull();
  });

  it("falls back for a set that will not fit", () => {
    const verbsText = Array.from(
      { length: 100 },
      (_, i) => `とても長い日本語の動詞をここに置きます${i}`,
    ).join("\n");
    const link = newFileUrl(draft({ verbsText }));
    expect(link.tooLong).toBe(true);
    expect(link.url).toBeNull();
    expect(link.fallbackUrl).toContain("new/main");
    expect(link.length).toBeGreaterThan(MAX_URL_LENGTH);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/contrib/build.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/contrib/build.ts
import type { SetDraft } from "./types.js";
import { splitVerbs } from "./validate.js";

export const REPO_OWNER = "ryoshin0830";
export const REPO_NAME = "ccverbs";
export const REPO_BRANCH = "main";

/**
 * Conservative cap against the ~8 KB HTTP request-line limit that most servers
 * implement. Not a measured GitHub 414 threshold. A 40-verb study set encodes
 * to about 6,167 characters, so anything lower than this sends the project's
 * most valuable category down the fallback path.
 */
export const MAX_URL_LENGTH = 7500;

export function buildSetObject(draft: SetDraft): Record<string, unknown> {
  const set: Record<string, unknown> = {
    $schema: "../schema/verb-set.schema.json",
    id: draft.id,
    name: draft.name,
    emoji: draft.emoji,
    description: draft.description,
    language: draft.language,
    category: draft.category,
    tags: draft.tags,
  };

  if (draft.authorName) {
    set.author = draft.authorGithub
      ? { name: draft.authorName, github: draft.authorGithub }
      : { name: draft.authorName };
  }
  if (draft.source) set.source = draft.source;

  set.verbs = splitVerbs(draft.verbsText);
  return set;
}

export function buildSetJson(draft: SetDraft): string {
  return `${JSON.stringify(buildSetObject(draft), null, 2)}\n`;
}

export interface NewFileLink {
  /** null when the encoded URL would exceed MAX_URL_LENGTH. */
  url: string | null;
  /** The same page without the prefilled body. Always present. */
  fallbackUrl: string;
  length: number;
  tooLong: boolean;
  filename: string;
}

export function newFileUrl(draft: SetDraft): NewFileLink {
  const filename = `sets/${draft.id}.json`;
  const base = `https://github.com/${REPO_OWNER}/${REPO_NAME}/new/${REPO_BRANCH}`;
  const fallbackUrl = `${base}?filename=${encodeURIComponent(filename)}`;
  const full = `${fallbackUrl}&value=${encodeURIComponent(buildSetJson(draft))}`;
  const tooLong = full.length > MAX_URL_LENGTH;

  return {
    url: tooLong ? null : full,
    fallbackUrl,
    length: full.length,
    tooLong,
    filename,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/contrib && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/contrib/build.ts tests/contrib/build.test.ts
git commit -m "feat: build set JSON and the GitHub new-file deep link"
```

---

### Task 3: Next.js scaffold that builds

**Files:**
- Create: `web/package.json`, `web/next.config.ts`, `web/tsconfig.json`, `web/next-env.d.ts`, `web/.gitignore`, `web/app/layout.tsx`, `web/app/page.tsx`, `web/app/globals.css`
- Modify: `.gitignore` (ignore `web/node_modules`, `web/.next`)

**Interfaces:**
- Consumes: `src/contrib/*` (Tasks 1–2) via a path alias.
- Produces: a deployable Next.js app. Later tasks add components under `web/components/`.

The one risk in this task is importing from `../src`. Next.js refuses files outside its root unless told otherwise, so this task exists to prove the import works before any UI is written.

- [ ] **Step 1: Write the scaffold**

`web/package.json`:

```json
{
  "name": "ccverbs-web",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.6.0"
  }
}
```

`web/next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required by Lolipop's Next.js framework preset.
  output: "standalone",
  // The validation logic lives in ../src so the CLI and this app share one copy.
  experimental: { externalDir: true },
};

export default nextConfig;
```

`web/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "allowJs": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "@ccverbs/*": ["../src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`web/.gitignore`:

```
node_modules/
.next/
next-env.d.ts
```

`web/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ccverbs — build a verb set",
  description:
    "Write the words Claude Code shows you while it works, see them animate, and open a pull request.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`web/app/page.tsx` — a smoke page that proves the cross-directory import compiles:

```tsx
import { MAX_URL_LENGTH } from "@ccverbs/contrib/build.js";

export default function Page() {
  return <main>URL cap is {MAX_URL_LENGTH}</main>;
}
```

`web/app/globals.css` — a minimal reset plus the terminal palette the preview needs:

```css
:root {
  --bg: #0d1117;
  --panel: #161b22;
  --border: #30363d;
  --text: #e6edf3;
  --dim: #8b949e;
  --accent: #d2a8ff;
  --ok: #3fb950;
  --bad: #f85149;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif;
  line-height: 1.6;
}
```

Append to the root `.gitignore`:

```
web/node_modules/
web/.next/
```

- [ ] **Step 2: Install and build to verify the cross-directory import works**

Run:

```bash
cd web && npm install && npm run build
```

Expected: build succeeds and prints a route for `/`. If it fails with a
module-resolution error for `@ccverbs/*`, the cause is `experimental.externalDir`
not covering the path alias; fix it by keeping the alias and adding

```ts
import { fileURLToPath } from "node:url";
webpack: (config) => {
  config.resolve.alias["@ccverbs"] = fileURLToPath(new URL("../src", import.meta.url));
  return config;
},
```

to `next.config.ts`, then rebuild.

- [ ] **Step 3: Verify the dev server serves the page**

Run: `cd web && npm run dev` then fetch it:

```bash
curl -s http://localhost:3000 | grep -o "URL cap is 7500"
```

Expected: `URL cap is 7500`. Stop the dev server afterwards.

- [ ] **Step 4: Confirm the CLI package is unaffected and the import graph stays browser-safe**

```bash
npm run lint && npm test
npm pack --dry-run | grep -c "web/"          # must be 0
# No Node built-in may be reachable from src/contrib/
grep -rE 'from "node:' src/contrib src/registry/schema.ts src/i18n/locales.ts
```

Expected: lint and tests pass; the grep count is `0`; the last grep prints nothing.
A hit there means the browser bundle will break — `src/constants.ts` imports
`node:os` and must stay out of this graph.

- [ ] **Step 5: Commit**

```bash
git add web .gitignore
git commit -m "feat: scaffold the contribution web app sharing src/contrib"
```

---

### Task 4: The spinner preview

**Files:**
- Create: `web/components/SpinnerPreview.tsx`
- Test: manual, via the dev server (see Step 3)

**Interfaces:**
- Consumes: `displayWidth` from `@ccverbs/registry/schema.js`.
- Produces: `<SpinnerPreview verbs={string[]} />`

This is the feature the whole app exists for: it answers "will I still like
this after seeing it fifty times today?" before a PR is opened.

- [ ] **Step 1: Write the component**

```tsx
// web/components/SpinnerPreview.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { displayWidth } from "@ccverbs/registry/schema.js";

const STEP_MS = 2000;
const MAX_WIDTH = 40;

/** Claude Code appends the ellipsis itself, which is why verbs must not end in one. */
function render(verb: string, seconds: number, tokens: number): string {
  return `${verb}… (${seconds}s · ↑ ${tokens.toFixed(1)}k tokens)`;
}

export function SpinnerPreview({ verbs }: { verbs: string[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) setPaused(true);
  }, []);

  useEffect(() => {
    if (paused || verbs.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % verbs.length), STEP_MS);
    return () => clearInterval(timer);
  }, [paused, verbs.length]);

  useEffect(() => {
    if (index >= verbs.length) setIndex(0);
  }, [index, verbs.length]);

  if (verbs.length === 0) {
    return (
      <div className="preview">
        <p className="dim">Add a verb and it will appear here, the way Claude Code shows it.</p>
      </div>
    );
  }

  const verb = verbs[Math.min(index, verbs.length - 1)] as string;
  const width = displayWidth(verb);
  const over = width > MAX_WIDTH;

  return (
    <div className="preview">
      <pre className={`spinner ${over ? "over" : ""}`}>
        <span className="glyph">✻</span> {render(verb, 4 + (index % 9), 1.2 + index * 0.4)}
      </pre>
      <p className="dim">
        {width} / {MAX_WIDTH} columns
        {over ? " — too wide; the timer gets pushed off screen" : ""}
      </p>
      <div className="controls">
        <button type="button" onClick={() => setIndex((i) => (i - 1 + verbs.length) % verbs.length)}>
          ‹
        </button>
        <button type="button" onClick={() => setPaused((p) => !p)}>
          {paused ? "play" : "pause"}
        </button>
        <button type="button" onClick={() => setIndex((i) => (i + 1) % verbs.length)}>
          ›
        </button>
        <span className="dim">
          {index + 1} / {verbs.length}
        </span>
      </div>
    </div>
  );
}
```

Add to `web/app/globals.css`:

```css
.preview { border: 1px solid var(--border); border-radius: 8px; padding: 1rem; background: var(--panel); }
.spinner { font-family: var(--mono); margin: 0 0 .5rem; white-space: pre-wrap; word-break: break-word; }
.spinner .glyph { color: var(--accent); }
.spinner.over { color: var(--bad); }
.dim { color: var(--dim); font-size: .85rem; margin: .25rem 0; }
.controls { display: flex; gap: .5rem; align-items: center; margin-top: .5rem; }
.controls button {
  background: transparent; color: var(--text); border: 1px solid var(--border);
  border-radius: 6px; padding: .2rem .6rem; cursor: pointer; font: inherit;
}
.controls button:hover { border-color: var(--accent); }
```

- [ ] **Step 2: Wire it into the page temporarily to see it**

Replace `web/app/page.tsx` with:

```tsx
import { SpinnerPreview } from "@/components/SpinnerPreview";

export default function Page() {
  return (
    <main style={{ maxWidth: 640, margin: "2rem auto", padding: "0 1rem" }}>
      <SpinnerPreview verbs={["岩を押し上げています", "また麓から登っています", "あ".repeat(21)]} />
    </main>
  );
}
```

- [ ] **Step 3: Check it in a browser**

Run: `cd web && npm run dev`, open `http://localhost:3000`.
Expected: the line cycles every 2 seconds; the 21-character entry shows in red with
`42 / 40 columns`; the pause and arrow buttons work.

- [ ] **Step 4: Typecheck**

Run: `cd web && npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add web/components/SpinnerPreview.tsx web/app/globals.css web/app/page.tsx
git commit -m "feat: show how a verb set will actually look in the spinner"
```

---

### Task 5: The form, diagnostics and output panel

**Files:**
- Create: `web/components/DraftForm.tsx`, `web/components/VerbsInput.tsx`, `web/components/OutputPanel.tsx`
- Modify: `web/app/page.tsx` (becomes the real page), `web/app/globals.css`

**Interfaces:**
- Consumes: `validateDraft`, `emptyDraft`, `slugify` from `@ccverbs/contrib/validate.js`; `buildSetJson`, `newFileUrl` from `@ccverbs/contrib/build.js`; `SET_LANGUAGES`, `SET_CATEGORIES` from `@ccverbs/contrib/types.js`; `SpinnerPreview` (Task 4).
- Produces: the finished page. Nothing else consumes these.

- [ ] **Step 1: Write `VerbsInput.tsx`**

```tsx
// web/components/VerbsInput.tsx
"use client";

import type { VerbIssue } from "@ccverbs/contrib/types.js";

const EXPLAIN: Record<VerbIssue["kind"], (issue: VerbIssue) => string> = {
  "trailing-ellipsis": () => "Drop the trailing …, ... or 。 — Claude Code adds the ellipsis.",
  "too-wide": (i) => `${i.width} columns. Keep it to 40 so the timer stays visible.`,
  duplicate: () => "Already in this set.",
  "control-char": () => "Contains a control character.",
  "too-long": () => "Over 120 characters.",
};

interface VerbsInputProps {
  value: string;
  verbs: string[];
  issues: VerbIssue[];
  error?: string;
  onChange: (value: string) => void;
}

export function VerbsInput({ value, verbs, issues, error, onChange }: VerbsInputProps) {
  return (
    <div className="field">
      <label htmlFor="verbs">
        Verbs <span className="dim">one per line</span>
      </label>
      <textarea
        id="verbs"
        rows={14}
        spellCheck={false}
        value={value}
        placeholder={"筋トレしています\nプロテインを飲んでいます"}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="dim">
        {verbs.length} verbs
        {issues.length > 0 ? ` · ${issues.length} to fix` : verbs.length > 0 ? " · all good" : ""}
      </p>
      {error && <p className="bad">{error}</p>}
      <ul className="issues">
        {issues.map((issue) => (
          <li key={`${issue.index}-${issue.kind}`}>
            <code>{issue.verb}</code> <span className="bad">{EXPLAIN[issue.kind](issue)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Write `DraftForm.tsx`**

```tsx
// web/components/DraftForm.tsx
"use client";

import { SET_CATEGORIES, SET_LANGUAGES, type SetDraft } from "@ccverbs/contrib/types.js";

const LANGUAGE_LABELS: Record<string, string> = {
  ja: "日本語", en: "English", "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文", ko: "한국어", mixed: "mixed (term + translation)",
};
const CATEGORY_LABELS: Record<string, string> = {
  meme: "meme — for fun",
  study: "study — a flashcard you read for free",
  classic: "classic — a general-purpose replacement",
};

interface DraftFormProps {
  draft: SetDraft;
  errors: Record<string, string>;
  onChange: (patch: Partial<SetDraft>) => void;
}

export function DraftForm({ draft, errors, onChange }: DraftFormProps) {
  const text = (key: keyof SetDraft, label: string, hint?: string) => (
    <div className="field">
      <label htmlFor={key}>
        {label} {hint && <span className="dim">{hint}</span>}
      </label>
      <input
        id={key}
        value={(draft[key] as string) ?? ""}
        onChange={(event) => onChange({ [key]: event.target.value } as Partial<SetDraft>)}
      />
      {errors[key] && <p className="bad">{errors[key]}</p>}
    </div>
  );

  return (
    <>
      {text("name", "Name")}
      {text("id", "id", "the filename — sets/<id>.json")}
      {text("emoji", "Emoji", "one, and prefer a coloured one over ☸ or ⌨")}
      {text("description", "Description", "one line")}

      <div className="field">
        <label htmlFor="language">Language</label>
        <select
          id="language"
          value={draft.language}
          onChange={(event) => onChange({ language: event.target.value as SetDraft["language"] })}
        >
          {SET_LANGUAGES.map((code) => (
            <option key={code} value={code}>
              {LANGUAGE_LABELS[code]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={draft.category}
          onChange={(event) => onChange({ category: event.target.value as SetDraft["category"] })}
        >
          {SET_CATEGORIES.map((code) => (
            <option key={code} value={code}>
              {CATEGORY_LABELS[code]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="tags">
          Tags <span className="dim">comma separated, up to 8</span>
        </label>
        <input
          id="tags"
          value={draft.tags.join(", ")}
          onChange={(event) =>
            onChange({
              tags: event.target.value.split(",").map((t) => t.trim()).filter(Boolean),
            })
          }
        />
        {errors.tags && <p className="bad">{errors.tags}</p>}
      </div>

      {text("authorName", "Your name", "optional — takes credit in the set file")}
      {text("authorGithub", "GitHub handle", "optional")}
      {text("source", "Source URL", "optional — where the content came from")}
    </>
  );
}
```

- [ ] **Step 3: Write `OutputPanel.tsx`**

```tsx
// web/components/OutputPanel.tsx
"use client";

import { useState } from "react";
import { buildSetJson, newFileUrl } from "@ccverbs/contrib/build.js";
import type { SetDraft } from "@ccverbs/contrib/types.js";

export function OutputPanel({ draft, ready }: { draft: SetDraft; ready: boolean }) {
  const [copied, setCopied] = useState(false);

  if (!ready) {
    return (
      <div className="output">
        <p className="dim">Fix the items above and the pull request button appears here.</p>
      </div>
    );
  }

  const json = buildSetJson(draft);
  const link = newFileUrl(draft);

  const copy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="output">
      {link.url ? (
        <>
          <a className="primary" href={link.url} target="_blank" rel="noreferrer">
            Open a pull request on GitHub
          </a>
          <p className="dim">
            GitHub opens with <code>{link.filename}</code> already filled in. If you do not have
            write access it offers to fork first — that is the normal path. Then press
            “Propose new file”.
          </p>
        </>
      ) : (
        <>
          <p className="bad">
            This set is too large to prefill through a link ({link.length} characters). Two steps
            instead:
          </p>
          <ol className="dim">
            <li>Copy the JSON below.</li>
            <li>
              Open <a href={link.fallbackUrl} target="_blank" rel="noreferrer">the new file page</a>{" "}
              and paste it.
            </li>
          </ol>
        </>
      )}

      <div className="controls">
        <button type="button" onClick={copy}>
          {copied ? "copied" : "Copy JSON"}
        </button>
        <a
          className="button"
          download={`${draft.id}.json`}
          href={`data:application/json;charset=utf-8,${encodeURIComponent(json)}`}
        >
          Download
        </a>
        <span className="dim">{link.length} character link</span>
      </div>

      <details>
        <summary className="dim">Show the JSON</summary>
        <pre className="json">{json}</pre>
      </details>
    </div>
  );
}
```

- [ ] **Step 4: Write the real page and styles**

```tsx
// web/app/page.tsx
"use client";

import { useMemo, useState } from "react";
import { emptyDraft, slugify, validateDraft } from "@ccverbs/contrib/validate.js";
import type { SetDraft } from "@ccverbs/contrib/types.js";
import { DraftForm } from "@/components/DraftForm";
import { OutputPanel } from "@/components/OutputPanel";
import { SpinnerPreview } from "@/components/SpinnerPreview";
import { VerbsInput } from "@/components/VerbsInput";

export default function Page() {
  const [draft, setDraft] = useState<SetDraft>(emptyDraft());
  const [idTouched, setIdTouched] = useState(false);

  const update = (patch: Partial<SetDraft>) => {
    setDraft((current) => {
      const next = { ...current, ...patch };
      if ("id" in patch) setIdTouched(true);
      // Derive the id from the name until the user edits it themselves.
      if ("name" in patch && !idTouched) next.id = slugify(patch.name ?? "");
      return next;
    });
  };

  const diagnostics = useMemo(() => validateDraft(draft), [draft]);

  return (
    <main className="page">
      <header>
        <h1>ccverbs</h1>
        <p className="lead">
          Claude Code shows a random word while it works. Write your own list, watch it the way
          you will actually see it, then open a pull request.
        </p>
      </header>

      <div className="columns">
        <section>
          <DraftForm draft={draft} errors={diagnostics.fieldErrors} onChange={update} />
          <VerbsInput
            value={draft.verbsText}
            verbs={diagnostics.verbs}
            issues={diagnostics.verbIssues}
            error={diagnostics.fieldErrors.verbsText}
            onChange={(verbsText) => update({ verbsText })}
          />
        </section>

        <aside>
          <h2>How it will look</h2>
          <SpinnerPreview verbs={diagnostics.verbs} />
          <h2>Send it</h2>
          <OutputPanel draft={draft} ready={diagnostics.ok} />
          <p className="dim">
            Ids must be unique across the repo. If yours is taken, CI will say so on the pull
            request.
          </p>
        </aside>
      </div>
    </main>
  );
}
```

Append to `web/app/globals.css`:

```css
.page { max-width: 1100px; margin: 0 auto; padding: 2rem 1rem 4rem; }
h1 { margin: 0; font-size: 1.6rem; }
h2 { font-size: 1rem; margin: 1.5rem 0 .5rem; }
.lead { color: var(--dim); max-width: 60ch; }
.columns { display: grid; grid-template-columns: 1fr; gap: 2rem; }
@media (min-width: 900px) { .columns { grid-template-columns: 1fr 1fr; } }
.field { margin-bottom: 1rem; }
.field label { display: block; font-size: .85rem; margin-bottom: .25rem; }
input, select, textarea {
  width: 100%; background: var(--panel); color: var(--text);
  border: 1px solid var(--border); border-radius: 6px; padding: .5rem; font: inherit;
}
textarea { font-family: var(--mono); resize: vertical; }
input:focus, select:focus, textarea:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
.bad { color: var(--bad); font-size: .85rem; margin: .25rem 0; }
.issues { list-style: none; padding: 0; margin: .5rem 0; font-size: .85rem; }
.issues li { margin-bottom: .35rem; }
.issues code { background: var(--panel); padding: .1rem .3rem; border-radius: 4px; }
.output { border: 1px solid var(--border); border-radius: 8px; padding: 1rem; background: var(--panel); }
.primary, .button {
  display: inline-block; background: var(--accent); color: #10121a; font-weight: 600;
  text-decoration: none; padding: .5rem 1rem; border-radius: 6px; border: 0; cursor: pointer; font: inherit;
}
.button { background: transparent; color: var(--text); border: 1px solid var(--border); font-weight: 400; }
.json { font-family: var(--mono); font-size: .8rem; overflow-x: auto; background: var(--bg); padding: .75rem; border-radius: 6px; }
```

- [ ] **Step 5: Check it end to end in a browser, then commit**

Run: `cd web && npm run lint && npm run build && npm run dev`

Walk through: type a name and watch the id fill itself; add a verb ending in `…`
and see the explanation; add a 21-character Japanese verb and see it flagged red
in both the list and the preview; clear the errors and confirm the pull request
button appears with a character count.

```bash
git add web
git commit -m "feat: add the verb set form, diagnostics and pull request handoff"
```

---

### Task 6: README reshuffle

**Files:**
- Modify: `README.md`, `README.ja.md`, `package.json` (version `0.2.1`)
- Test: `tests/docs.test.ts`

**Interfaces:**
- Consumes: nothing. Produces no code interfaces.

Order becomes: title → what it looks like → quick start → **Add a verb set** →
usage → configuration → languages → verb sets → for AI agents →
`<details>` how it works → license.

Nothing is deleted. The research section keeps every word; it moves into a
`<details>` block near the bottom.

- [ ] **Step 1: Write the failing test**

```ts
// append to tests/docs.test.ts
describe("README ordering", () => {
  const at = (text: string, heading: string) => text.indexOf(heading);

  it("puts contributing above the reference material", () => {
    expect(at(readme, "## Add a verb set")).toBeGreaterThan(0);
    expect(at(readme, "## Add a verb set")).toBeLessThan(at(readme, "## Usage"));
    expect(at(readme, "## Add a verb set")).toBeLessThan(at(readme, "## For AI agents"));
  });

  it("offers both an easy path and a by-hand path", () => {
    const section = readme.slice(at(readme, "## Add a verb set"), at(readme, "## Usage"));
    expect(section).toContain("sets/");
    expect(section).toContain("npm run sets:index");
  });

  it("folds the research into a details block near the end", () => {
    expect(readme).toContain("<details>");
    expect(readme).toContain("</details>");
    expect(at(readme, "<details>")).toBeGreaterThan(at(readme, "## For AI agents"));
  });

  it("keeps every researched fact", () => {
    for (const token of [
      "186", "No limit", "`replace`", "`append`", "2.1.235",
      "Flibbertigibbeting", "Expected object, but received array",
    ]) {
      expect(readme, token).toContain(token);
    }
  });
});

describe("README.ja.md ordering", () => {
  it("matches the English order", () => {
    expect(readmeJa.indexOf("## 単語セットを追加する")).toBeLessThan(readmeJa.indexOf("## 使い方"));
    expect(readmeJa).toContain("<details>");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/docs.test.ts`
Expected: FAIL — `## Add a verb set` does not exist yet.

- [ ] **Step 3: Reorder both READMEs**

Rename `## Contributing a verb set` to `## Add a verb set`, move it to sit
directly after the quick start, and open it with the web app:

```markdown
## Add a verb set

**The easy way:** open <WEB_APP_URL>, type your words, watch them animate the way
Claude Code will show them, and press the button. It fills in a pull request for you.

**By hand:** add one JSON file.
```

(keep the existing JSON example and the `npm run sets:index` lines beneath it)

Move `## How it works` and its `### What that means in practice` and
`### Where the sets come from` subsections down to sit after `## For AI agents`,
wrapped as:

```markdown
<details>
<summary><strong>How it works — the reverse-engineered spinnerVerbs contract</strong></summary>

...every existing line, unchanged...

</details>
```

Bump `package.json` to `0.2.1`. The README ships inside the npm tarball, so the
npm page needs a release to show the new order.

`<WEB_APP_URL>` is filled in by Task 7 after the first deploy reports the domain.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS. `tests/docs.test.ts` guards the order from now on.

- [ ] **Step 5: Commit**

```bash
git add README.md README.ja.md package.json tests/docs.test.ts
git commit -m "docs: lead with how to add a set, fold the research into details"
```

---

### Task 7: Verify, push, and hand over the deploy and publish commands

**Files:**
- Modify: `README.md`, `README.ja.md` (substitute the real deployed URL)

**Interfaces:**
- Consumes: everything. Produces no code interfaces.

Deploying and publishing are the user's steps. This task verifies everything
locally, pushes, and produces the two commands.

- [ ] **Step 1: Full verification**

```bash
npm run lint && npm test && npm run sets:validate && npm run build
node scripts/build-index.mjs && git diff --exit-code sets/index.json
cd web && npm run lint && npm run build && cd ..
npm pack --dry-run | grep -c "web/"    # must be 0
```

Expected: all green; the grep prints `0`.

- [ ] **Step 2: Verify the deep link against real GitHub**

Build a small set in the dev server, click the button, and confirm GitHub opens
its editor with the file prefilled and offers to fork. Note the actual behaviour;
if GitHub rejects the URL length at a value below 7,500, lower `MAX_URL_LENGTH`
in `src/contrib/build.ts` and update the test's expectations.

- [ ] **Step 3: Push**

```bash
git push origin main
gh run watch "$(gh run list --limit 1 --json databaseId --jq '.[0].databaseId')" --exit-status
```

- [ ] **Step 4: Hand over the deploy command**

The Lolipop CLI needs a browser login, so this is the user's to run:

```bash
npm i -g lolipop                       # local is 2.0.1, latest is 2.0.6
lolipop login
cd /Users/shin-ryo/ghq/github.com/ryoshin0830/ccverbs/web
lolipop deploy --name ccverbs --framework next
```

No environment variables need setting in the dashboard — the app has none.

- [ ] **Step 5: Fill in the URL, add its test, then hand over the publish command**

Once the deploy reports its domain, substitute it for `<WEB_APP_URL>` in both
READMEs and add the assertion that Task 6 deliberately left out:

```ts
// append to tests/docs.test.ts
it("links the live verb set builder", () => {
  const section = readme.slice(
    readme.indexOf("## Add a verb set"),
    readme.indexOf("## Usage"),
  );
  expect(section).toMatch(/https:\/\/\S+/);
});
```

Then commit and push:

```bash
git add README.md README.ja.md && git commit -m "docs: link the verb set builder" && git push
```

Then the publish command, for the user to run:

```bash
cd /Users/shin-ryo/ghq/github.com/ryoshin0830/ccverbs
npm publish --registry https://registry.npmjs.org --access public
```

`--registry` is required because this machine's default is `npm.flatt.tech`.
Publishing needs a 2FA code, which is why it is the user's step.
