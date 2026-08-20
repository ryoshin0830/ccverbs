import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { REPO_BRANCH, REPO_NAME, REPO_OWNER } from "../contrib/build.js";

// CLI-only. This module shells out, so it must never be imported by the web app;
// src/contrib stays browser-safe and this lives outside it deliberately.

export interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

export type Runner = (cmd: string, args: string[], cwd?: string) => RunResult;

export const realRunner: Runner = (cmd, args, cwd) => {
  try {
    const stdout = execFileSync(cmd, args, {
      encoding: "utf8",
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120_000,
    });
    return { status: 0, stdout, stderr: "" };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string; message?: string };
    return {
      status: typeof e.status === "number" ? e.status : 1,
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? e.message ?? "",
    };
  }
};

export interface OpenPullRequestOptions {
  id: string;
  /** The exact file content to commit. */
  json: string;
  /** Shown in the pull request title and body. */
  name: string;
  verbCount: number;
  branch?: string;
  runner?: Runner;
  makeTempDir?: () => string;
  cleanUp?: boolean;
}

export interface OpenPullRequestResult {
  ok: boolean;
  url?: string;
  branch: string;
  /** True when the change had to go through a fork. */
  forked: boolean;
  /** What went wrong, when ok is false. */
  reason?: string;
  /** The by-hand equivalent. Always populated, so a failure is never a dead end. */
  manual: string[];
}

const SLUG = `${REPO_OWNER}/${REPO_NAME}`;
const FILE = (id: string) => `sets/${id}.json`;

function manualSteps(id: string, branch: string): string[] {
  return [
    `gh repo fork ${SLUG} --clone --remote`,
    `cd ${REPO_NAME}`,
    `git checkout -b ${branch}`,
    `# write your set to ${FILE(id)}`,
    `git add ${FILE(id)}`,
    `git commit -m "feat: add the ${id} verb set"`,
    `git push --set-upstream origin ${branch}`,
    `gh pr create --repo ${SLUG} --fill`,
  ];
}

/**
 * Fork if needed, branch, commit the set and open a pull request.
 *
 * Everything happens in a throwaway clone, so the caller's working tree is
 * never touched however this ends. Any failure returns ok:false along with the
 * by-hand commands, so an agent that hits an unexpected state is told what to
 * run instead of being stranded.
 */
export function openPullRequest(opts: OpenPullRequestOptions): OpenPullRequestResult {
  const run = opts.runner ?? realRunner;
  const branch = opts.branch ?? `add-${opts.id}`;
  const manual = manualSteps(opts.id, branch);
  let forked = false;
  const give = (reason: string, forkedState = forked): OpenPullRequestResult => ({
    ok: false,
    branch,
    forked: forkedState,
    reason,
    manual,
  });

  if (run("gh", ["--version"]).status !== 0) {
    return give("the GitHub CLI (gh) is not on PATH");
  }
  if (run("gh", ["auth", "status"]).status !== 0) {
    return give("gh is not signed in — run: gh auth login");
  }

  // Someone with push access does not need a fork, and asking gh to fork a
  // repository you own does not do what you want.
  const perm = run("gh", ["api", `repos/${SLUG}`, "--jq", ".permissions.push"]);
  const canPush = perm.status === 0 && perm.stdout.trim() === "true";

  let login = "";
  if (!canPush) {
    if (run("gh", ["repo", "fork", SLUG, "--remote=false"]).status !== 0) {
      return give(`could not fork ${SLUG}`);
    }
    forked = true;
    const who = run("gh", ["api", "user", "--jq", ".login"]);
    if (who.status !== 0 || !who.stdout.trim()) return give("could not read your GitHub login");
    login = who.stdout.trim();
  }

  const dir = (opts.makeTempDir ?? (() => mkdtempSync(join(tmpdir(), "ccverbs-pr-"))))();
  const cleanUp = opts.cleanUp !== false;
  const done = <T extends OpenPullRequestResult>(result: T): T => {
    if (cleanUp) rmSync(dir, { recursive: true, force: true });
    return result;
  };

  try {
    // Clone upstream rather than the fork: a fork that has drifted would put the
    // branch on a stale base and make the pull request look enormous.
    const clone = run("git", [
      "clone",
      "--depth",
      "1",
      "--branch",
      REPO_BRANCH,
      `https://github.com/${SLUG}.git`,
      dir,
    ]);
    if (clone.status !== 0) return done(give(`could not clone ${SLUG}: ${clone.stderr.trim()}`));

    if (run("git", ["checkout", "-b", branch], dir).status !== 0) {
      return done(give(`could not create the branch ${branch}`));
    }

    const target = join(dir, FILE(opts.id));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, opts.json, "utf8");

    if (run("git", ["add", FILE(opts.id)], dir).status !== 0) {
      return done(give(`could not stage ${FILE(opts.id)}`));
    }

    const message = `feat: add the ${opts.id} verb set`;
    if (run("git", ["commit", "-m", message], dir).status !== 0) {
      return done(give("could not commit the set"));
    }

    const remote = canPush ? "origin" : `https://github.com/${login}/${REPO_NAME}.git`;
    const push = run("git", ["push", remote, `HEAD:refs/heads/${branch}`], dir);
    if (push.status !== 0) {
      const clash = /already exists|non-fast-forward|rejected/i.test(push.stderr);
      return done(
        give(
          clash
            ? `the branch ${branch} already exists — pass --branch to choose another name`
            : `could not push: ${push.stderr.trim()}`,
        ),
      );
    }

    const body = [
      `Adds the \`${opts.id}\` verb set — ${opts.name}, ${opts.verbCount} verbs.`,
      "",
      "Created with `ccverbs new --pr`.",
    ].join("\n");

    const create = run(
      "gh",
      [
        "pr",
        "create",
        "--repo",
        SLUG,
        "--base",
        REPO_BRANCH,
        "--head",
        canPush ? branch : `${login}:${branch}`,
        "--title",
        `Add the ${opts.id} verb set`,
        "--body",
        body,
      ],
      dir,
    );
    if (create.status !== 0) {
      return done(give(`pushed, but could not open the pull request: ${create.stderr.trim()}`));
    }

    const url = create.stdout.match(/https:\/\/github\.com\/\S+\/pull\/\d+/)?.[0];
    if (!url) return done(give("the PR command succeeded but did not return a GitHub URL"));
    return done({ ok: true, branch, forked, manual, url });
  } catch (error) {
    return done(give((error as Error).message));
  }
}
