import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { openPullRequest, type RunResult, type Runner } from "../../src/pr/open.js";

const ok = (stdout = ""): RunResult => ({ status: 0, stdout, stderr: "" });
const no = (stderr = "boom"): RunResult => ({ status: 1, stdout: "", stderr });

/** A runner scripted by the command it is asked to run. */
function fakeRunner(
  overrides: Record<string, RunResult> = {},
): { run: Runner; calls: string[] } {
  const calls: string[] = [];
  const defaults: Record<string, RunResult> = {
    "gh --version": ok("gh version 2.0.0"),
    "gh auth status": ok("Logged in"),
    "gh api repos": ok("false"),
    "gh repo fork": ok("forked"),
    "gh api user": ok("contributor"),
    "git clone": ok(),
    "git checkout": ok(),
    "git add": ok(),
    "git commit": ok(),
    "git push": ok(),
    "gh pr create": ok("https://github.com/ryoshin0830/ccverbs/pull/7\n"),
  };
  const table = { ...defaults, ...overrides };

  const run: Runner = (cmd, args) => {
    const line = `${cmd} ${args.join(" ")}`;
    calls.push(line);
    // Longest matching prefix wins so "gh api user" beats "gh api repos".
    const key = Object.keys(table)
      .filter((k) => line.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    return key ? (table[key] as RunResult) : ok();
  };
  return { run, calls };
}

const draft = {
  id: "ja-gym",
  json: '{"id":"ja-gym"}\n',
  name: "筋トレ",
  verbCount: 3,
};

const workDir = () => mkdtempSync(join(tmpdir(), "ccverbs-prtest-"));

const open = (overrides: Record<string, RunResult> = {}, extra: Record<string, unknown> = {}) => {
  const { run, calls } = fakeRunner(overrides);
  const result = openPullRequest({
    ...draft,
    runner: run,
    makeTempDir: workDir,
    ...extra,
  });
  return { result, calls };
};

describe("openPullRequest — the happy path through a fork", () => {
  it("returns the pull request URL", () => {
    const { result } = open();
    expect(result.ok).toBe(true);
    expect(result.url).toBe("https://github.com/ryoshin0830/ccverbs/pull/7");
    expect(result.forked).toBe(true);
    expect(result.branch).toBe("add-ja-gym");
  });

  it("forks, clones upstream, commits and opens the request", () => {
    const { calls } = open();
    expect(calls.some((c) => c.startsWith("gh repo fork ryoshin0830/ccverbs"))).toBe(true);
    // Upstream, not the fork: a drifted fork would make the diff look enormous.
    expect(calls.some((c) => c.includes("github.com/ryoshin0830/ccverbs.git"))).toBe(true);
    expect(calls.some((c) => c.startsWith("git commit"))).toBe(true);
    expect(calls.some((c) => c.includes("--head contributor:add-ja-gym"))).toBe(true);
  });

  it("pushes to the fork, not to upstream", () => {
    const { calls } = open();
    const push = calls.find((c) => c.startsWith("git push")) as string;
    expect(push).toContain("github.com/contributor/ccverbs.git");
  });

  it("writes the set file into the clone", () => {
    const dir = workDir();
    const { run } = fakeRunner();
    openPullRequest({ ...draft, runner: run, makeTempDir: () => dir, cleanUp: false });
    expect(readFileSync(join(dir, "sets/ja-gym.json"), "utf8")).toBe(draft.json);
  });

  it("honours an explicit branch name", () => {
    const { result, calls } = open({}, { branch: "gym-words" });
    expect(result.branch).toBe("gym-words");
    expect(calls.some((c) => c === "git checkout -b gym-words")).toBe(true);
  });
});

describe("openPullRequest — with push access", () => {
  const asMaintainer = { "gh api repos": ok("true") };

  it("skips the fork entirely", () => {
    const { result, calls } = open(asMaintainer);
    expect(result.ok).toBe(true);
    expect(result.forked).toBe(false);
    expect(calls.some((c) => c.startsWith("gh repo fork"))).toBe(false);
  });

  it("pushes to origin and uses a bare head ref", () => {
    const { calls } = open(asMaintainer);
    expect(calls.some((c) => c.startsWith("git push origin"))).toBe(true);
    expect(calls.some((c) => c.includes("--head add-ja-gym"))).toBe(true);
  });
});

describe("openPullRequest — every failure is a dead end for nobody", () => {
  it.each([
    ["gh is missing", { "gh --version": no() }, /not on PATH/],
    ["gh is not signed in", { "gh auth status": no() }, /gh auth login/],
    ["the fork fails", { "gh repo fork": no() }, /could not fork/],
    ["the login cannot be read", { "gh api user": ok("  ") }, /GitHub login/],
    ["the clone fails", { "git clone": no("no network") }, /could not clone/],
    ["the branch cannot be made", { "git checkout": no() }, /could not create the branch/],
    ["the commit fails", { "git commit": no() }, /could not commit/],
    ["the push fails", { "git push": no("connection reset") }, /could not push/],
    ["the request cannot be opened", { "gh pr create": no("rate limited") }, /could not open/],
  ])("reports %s and still prints the manual steps", (_label, overrides, expected) => {
    const { result } = open(overrides);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(expected);
    expect(result.manual.length).toBeGreaterThan(4);
    expect(result.manual.join("\n")).toContain("gh pr create");
  });

  it("names the branch clash specifically, because the fix is a flag", () => {
    const { result } = open({ "git push": no("! [rejected] already exists") });
    expect(result.reason).toMatch(/already exists/);
    expect(result.reason).toMatch(/--branch/);
  });

  it("fails when gh does not return a PR URL", () => {
    const { result } = open({ "gh pr create": ok("created") });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/did not return a GitHub URL/);
  });

  it("stops before touching the filesystem when gh is missing", () => {
    const { calls } = open({ "gh --version": no() });
    expect(calls.some((c) => c.startsWith("git"))).toBe(false);
  });

  it("never runs anything in the caller's working directory", () => {
    const dir = workDir();
    const { run, calls } = fakeRunner();
    openPullRequest({ ...draft, runner: run, makeTempDir: () => dir });
    // The clone target is the throwaway directory, and every later git call runs
    // there because the runner receives it as cwd.
    expect(calls.find((c) => c.startsWith("git clone"))).toContain(dir);
  });
});
