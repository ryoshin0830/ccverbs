import { readFileSync } from "node:fs";
import type { Options } from "../args.js";
import { parseSetInput, type InputIssue } from "../contrib/input.js";
import type { Catalog } from "../i18n/en.js";
import {
  openPullRequest,
  type OpenPullRequestOptions,
  type OpenPullRequestResult,
} from "../pr/open.js";
import { type Io } from "./io.js";

export interface NewCommandDeps {
  io: Io;
  t: Catalog;
  readInput?: (path: string) => string;
  openPullRequest?: (options: OpenPullRequestOptions) => OpenPullRequestResult;
}

function readInput(path: string): string {
  return path === "-" ? readFileSync(0, "utf8") : readFileSync(path, "utf8");
}

function writeJson(io: Io, value: Record<string, unknown>): void {
  io.out(JSON.stringify(value));
}

function writeFailure(
  io: Io,
  json: boolean,
  code: string,
  message: string,
  extra: Record<string, unknown> = {},
): number {
  if (json) {
    const { issues, ...topLevel } = extra;
    writeJson(io, {
      ok: false,
      error: { code, message, ...(issues ? { issues } : {}) },
      ...topLevel,
    });
  } else {
    io.err(`ccverbs: ${message}`);
    const manual = extra.manual;
    if (Array.isArray(manual)) for (const step of manual) io.err(`  ${step}`);
  }
  return code === "pr-failed" ? 1 : 2;
}

function summary(draft: {
  id: string;
  name: string;
  emoji: string;
  description: string;
  language: string;
  category: string;
  tags: string[];
  verbsText: string;
}): Record<string, unknown> {
  return {
    id: draft.id,
    name: draft.name,
    emoji: draft.emoji,
    description: draft.description,
    language: draft.language,
    category: draft.category,
    tags: draft.tags,
    verbCount: draft.verbsText.split("\n").filter(Boolean).length,
  };
}

function issueMessage(issues: InputIssue[]): string {
  return `input has ${issues.length} validation issue${issues.length === 1 ? "" : "s"}`;
}

export function runNew(options: Options, deps: NewCommandDeps): number {
  const inputPath = options.input;
  if (!inputPath) return writeFailure(deps.io, options.json, "missing-input", "new requires --input <path|->");

  let raw: string;
  try {
    raw = (deps.readInput ?? readInput)(inputPath);
  } catch (error) {
    return writeFailure(
      deps.io,
      options.json,
      "input-read-failed",
      `could not read ${inputPath}: ${(error as Error).message}`,
    );
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    return writeFailure(
      deps.io,
      options.json,
      "invalid-json",
      `input is not valid JSON: ${(error as Error).message}`,
    );
  }

  const parsed = parseSetInput(value);
  if (!parsed.ok) {
    return writeFailure(deps.io, options.json, "invalid-input", issueMessage(parsed.issues), {
      issues: parsed.issues,
    });
  }

  const set = summary(parsed.draft);
  if (!options.pr) {
    if (options.json) writeJson(deps.io, { ok: true, validated: true, set, json: parsed.json });
    else {
      deps.io.out(`Validated ${set.verbCount} verbs for ${parsed.draft.id}.`);
      deps.io.out(parsed.json);
    }
    return 0;
  }

  const pr = (deps.openPullRequest ?? openPullRequest)({
    id: parsed.draft.id,
    json: parsed.json,
    name: parsed.draft.name,
    verbCount: set.verbCount as number,
    ...(options.branch ? { branch: options.branch } : {}),
  });

  if (!pr.ok) {
    return writeFailure(deps.io, options.json, "pr-failed", pr.reason ?? "could not open pull request", {
      branch: pr.branch,
      forked: pr.forked,
      manual: pr.manual,
    });
  }

  if (options.json) {
    writeJson(deps.io, {
      ok: true,
      validated: true,
      set,
      pr: { url: pr.url ?? null, branch: pr.branch, forked: pr.forked },
    });
  } else {
    deps.io.out(`Pull request opened: ${pr.url ?? "(URL unavailable)"}`);
    deps.io.out(`Branch: ${pr.branch}${pr.forked ? " (fork)" : ""}`);
  }
  return 0;
}
