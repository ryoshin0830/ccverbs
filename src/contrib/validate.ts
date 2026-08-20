import { displayWidth } from "../registry/width.js";
import {
  MAX_VERB_WIDTH,
  MAX_VERBS,
  SET_CATEGORIES,
  SET_LANGUAGES,
  type DraftDiagnostics,
  type FieldErrorCode,
  type SetDraft,
  type VerbIssue,
} from "./types.js";

// Browser-safe by design: nothing in this module or its imports may reach
// src/constants.ts, which pulls in node:os.

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const TRAILING_ELLIPSIS = /(…|\.\.\.|。)$/;
const HTTP_URL = /^https?:\/\/\S+$/;

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

/** Turn a human name into a kebab-case id. Characters outside a-z0-9 are dropped. */
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

/**
 * Diagnose a draft against the same rules the repository enforces.
 *
 * Anything fixable is fixed rather than reported: whitespace is trimmed and
 * blank lines are dropped. Width over 40 columns is an error, not a warning,
 * because the repository's test suite fails above 40 — reporting it as a
 * warning here would let someone submit a set that CI then rejects.
 */
export function validateDraft(draft: SetDraft): DraftDiagnostics {
  const verbs = splitVerbs(draft.verbsText);
  const verbIssues = checkVerbs(verbs);
  const fieldErrors: Partial<Record<string, FieldErrorCode>> = {};

  if (!draft.id) fieldErrors.id = "id.empty";
  else if (!KEBAB.test(draft.id)) fieldErrors.id = "id.shape";

  if (!draft.name) fieldErrors.name = "name.empty";
  else if (draft.name.length > 40) fieldErrors.name = "name.long";

  if (!draft.emoji) fieldErrors.emoji = "emoji.empty";
  else if ([...draft.emoji].length > 4) fieldErrors.emoji = "emoji.many";

  if (!draft.description) fieldErrors.description = "description.empty";
  else if (draft.description.length > 120) fieldErrors.description = "description.long";

  if (!SET_LANGUAGES.includes(draft.language)) fieldErrors.language = "language.invalid";
  if (!SET_CATEGORIES.includes(draft.category)) fieldErrors.category = "category.invalid";

  if (draft.tags.length > 8) fieldErrors.tags = "tags.many";
  else if (draft.tags.some((tag) => !KEBAB.test(tag))) fieldErrors.tags = "tags.shape";

  if (draft.source && !HTTP_URL.test(draft.source)) fieldErrors.source = "source.shape";

  if (verbs.length === 0) fieldErrors.verbsText = "verbs.empty";
  else if (verbs.length > MAX_VERBS) fieldErrors.verbsText = "verbs.many";

  return {
    verbs,
    verbIssues,
    fieldErrors,
    ok: verbIssues.length === 0 && Object.keys(fieldErrors).length === 0,
  };
}
