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

export interface DraftDiagnostics {
  /** Trimmed, with blank lines removed. */
  verbs: string[];
  verbIssues: VerbIssue[];
  fieldErrors: Record<string, string>;
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
