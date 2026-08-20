import { describe, expect, it } from "vitest";
import { parseArgs, type Options } from "../../src/args.js";
import { runNew } from "../../src/commands/new.js";
import { getCatalog } from "../../src/i18n/index.js";
import type { OpenPullRequestOptions, OpenPullRequestResult } from "../../src/pr/open.js";

const valid = {
  id: "ja-gym",
  name: "筋トレ",
  emoji: "🏋",
  description: "ジムのセット間に見る言葉",
  language: "ja",
  category: "meme",
  tags: ["fun", "gym"],
  verbs: ["筋トレしています", "プロテインを飲んでいます"],
};

const options = (argv: string[]): Options => {
  const parsed = parseArgs(argv);
  if (!parsed.ok) throw new Error(parsed.message);
  return parsed.options;
};

const result = (over: Partial<OpenPullRequestResult> = {}): OpenPullRequestResult => ({
  ok: true,
  branch: "add-ja-gym",
  forked: false,
  url: "https://github.com/ryoshin0830/ccverbs/pull/1",
  manual: [],
  ...over,
});

describe("runNew", () => {
  it("validates stdin and returns one JSON summary without opening a PR", () => {
    const lines: string[] = [];
    const code = runNew(options(["new", "--input", "-", "--json"]), {
      io: { out: (line) => lines.push(line), err: (line) => lines.push(line) },
      t: getCatalog("en"),
      readInput: () => JSON.stringify(valid),
      openPullRequest: () => {
        throw new Error("must not run");
      },
    });

    expect(code).toBe(0);
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] as string)).toMatchObject({
      ok: true,
      validated: true,
      set: { id: "ja-gym", verbCount: 2 },
    });
  });

  it("does not call the PR helper when validation fails", () => {
    let called = false;
    const lines: string[] = [];
    const code = runNew(options(["new", "--input", "-", "--pr", "--json"]), {
      io: { out: (line) => lines.push(line), err: (line) => lines.push(line) },
      t: getCatalog("en"),
      readInput: () => JSON.stringify({ ...valid, verbs: ["bad…"] }),
      openPullRequest: () => {
        called = true;
        throw new Error("must not run");
      },
    });

    expect(code).toBe(2);
    expect(called).toBe(false);
    expect(JSON.parse(lines[0] as string)).toMatchObject({
      ok: false,
      error: { code: "invalid-input" },
    });
  });

  it("passes canonical JSON to the PR helper after validation", () => {
    let received: OpenPullRequestOptions | undefined;
    const lines: string[] = [];
    const code = runNew(
      options(["new", "--input", "-", "--pr", "--json", "--branch", "add-gym"]),
      {
        io: { out: (line) => lines.push(line), err: (line) => lines.push(line) },
        t: getCatalog("en"),
        readInput: () => JSON.stringify(valid),
        openPullRequest: (input) => {
          received = input;
          return result();
        },
      },
    );

    expect(code).toBe(0);
    expect(received).toMatchObject({ id: "ja-gym", name: "筋トレ", verbCount: 2, branch: "add-gym" });
    expect(JSON.parse(received?.json ?? "{}").verbs).toHaveLength(2);
    expect(JSON.parse(lines[0] as string)).toMatchObject({
      ok: true,
      pr: { url: "https://github.com/ryoshin0830/ccverbs/pull/1" },
    });
  });

  it("returns a structured runtime failure and manual recovery", () => {
    const lines: string[] = [];
    const code = runNew(options(["new", "--input", "-", "--pr", "--json"]), {
      io: { out: (line) => lines.push(line), err: (line) => lines.push(line) },
      t: getCatalog("en"),
      readInput: () => JSON.stringify(valid),
      openPullRequest: () =>
        result({
          ok: false,
          url: undefined,
          reason: "gh is not signed in",
          manual: ["gh auth login"],
        }),
    });

    expect(code).toBe(1);
    expect(JSON.parse(lines[0] as string)).toMatchObject({
      ok: false,
      error: { code: "pr-failed", message: "gh is not signed in" },
      manual: ["gh auth login"],
    });
  });

  it("returns invalid-json for malformed input", () => {
    const lines: string[] = [];
    const code = runNew(options(["new", "--input", "set.json", "--json"]), {
      io: { out: (line) => lines.push(line), err: (line) => lines.push(line) },
      t: getCatalog("en"),
      readInput: () => "{not json",
    });

    expect(code).toBe(2);
    expect(JSON.parse(lines[0] as string)).toMatchObject({
      ok: false,
      error: { code: "invalid-json" },
    });
  });
});
