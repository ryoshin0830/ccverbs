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
  /** Measured columns, only present for "too-wide". */
  width?: number;
}

/**
 * Field problems are reported as codes, not prose. The CLI and the web app
 * render them in the reader's own language, so the validator must not decide
 * the wording.
 */
export type FieldErrorCode =
  | "id.empty"
  | "id.shape"
  | "name.empty"
  | "name.long"
  | "emoji.empty"
  | "emoji.many"
  | "description.empty"
  | "description.long"
  | "language.invalid"
  | "category.invalid"
  | "tags.many"
  | "tags.shape"
  | "source.shape"
  | "verbs.empty"
  | "verbs.many";

export interface DraftDiagnostics {
  /** Trimmed, with blank lines removed. */
  verbs: string[];
  verbIssues: VerbIssue[];
  fieldErrors: Partial<Record<string, FieldErrorCode>>;
  ok: boolean;
}

export const SET_LANGUAGES: readonly SetLanguage[] = [
  "ja",
  "en",
  "zh-Hans",
  "zh-Hant",
  "ko",
  "mixed",
];

export const SET_CATEGORIES: readonly SetCategory[] = ["meme", "study", "classic"];

export const MAX_VERB_WIDTH = 40;
export const MAX_VERBS = 500;
