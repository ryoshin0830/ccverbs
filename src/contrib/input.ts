import { verbSetSchema, type VerbSet } from "../registry/schema.js";
import { buildSetJson } from "./build.js";
import type { DraftDiagnostics, SetDraft, VerbIssue } from "./types.js";
import { validateDraft } from "./validate.js";

export interface InputIssue {
  path: string;
  code: string;
  message: string;
  index?: number;
  width?: number;
}

export type SetInputResult =
  | { ok: true; draft: SetDraft; json: string }
  | { ok: false; issues: InputIssue[] };

const strictSetSchema = verbSetSchema.strict();

function pathOf(path: (string | number)[]): string {
  return path.reduce<string>((result, part, index) => {
    if (typeof part === "number") return `${result}[${part}]`;
    return index === 0 ? part : `${result}.${part}`;
  }, "");
}

function stableSchemaCode(issue: { code: string; message: string }): string {
  if (issue.code !== "custom") return issue.code;
  if (issue.message.includes("end with an ellipsis")) return "trailing-ellipsis";
  if (issue.message.includes("leading or trailing whitespace")) return "whitespace";
  if (issue.message.includes("control characters")) return "control-char";
  if (issue.message.includes("unique within a set")) return "duplicate";
  return issue.code;
}

function schemaIssues(error: { issues: readonly { code: string; path: (string | number)[]; message: string; keys?: string[] }[] }): InputIssue[] {
  return error.issues.flatMap((issue) => {
    if (issue.code === "unrecognized_keys" && issue.keys) {
      return issue.keys.map((key) => ({
        path: key,
        code: "unrecognized-key",
        message: `unrecognized input field: ${key}`,
      }));
    }
    return [{
      path: pathOf(issue.path) || "$",
      code: stableSchemaCode(issue),
      message: issue.message,
    }];
  });
}

function verbMessage(issue: VerbIssue): string {
  if (issue.kind === "too-wide") return `display width is ${issue.width}; maximum is 40`;
  if (issue.kind === "trailing-ellipsis") return "must not end with an ellipsis or Japanese period";
  if (issue.kind === "too-long") return "must be at most 120 characters";
  if (issue.kind === "control-char") return "must not contain control characters";
  return "must be unique within the set";
}

function diagnosticsIssues(diagnostics: DraftDiagnostics): InputIssue[] {
  const fields = Object.entries(diagnostics.fieldErrors).flatMap(([path, code]) =>
    code
      ? [{
          path: path === "verbsText" ? "verbs" : path,
          code,
          message: code,
        }]
      : [],
  );
  const verbs = diagnostics.verbIssues.map((issue) => ({
    path: `verbs[${issue.index}]`,
    code: issue.kind,
    message: verbMessage(issue),
    index: issue.index,
    ...(issue.width === undefined ? {} : { width: issue.width }),
  }));
  return [...fields, ...verbs];
}

function toDraft(set: VerbSet): SetDraft {
  return {
    id: set.id,
    name: set.name,
    emoji: set.emoji,
    description: set.description,
    language: set.language,
    category: set.category,
    tags: set.tags,
    verbsText: set.verbs.join("\n"),
    ...(set.i18n ? { i18n: set.i18n } : {}),
    ...(set.author?.name ? { authorName: set.author.name } : {}),
    ...(set.author?.github ? { authorGithub: set.author.github } : {}),
    ...(set.source ? { source: set.source } : {}),
  };
}

export function parseSetInput(value: unknown): SetInputResult {
  const parsed = strictSetSchema.safeParse(value);
  if (!parsed.success) return { ok: false, issues: schemaIssues(parsed.error) };

  const draft = toDraft(parsed.data);
  const diagnostics = validateDraft(draft);
  const issues = diagnosticsIssues(diagnostics);
  if (issues.length > 0) return { ok: false, issues };

  return { ok: true, draft, json: buildSetJson(draft) };
}
