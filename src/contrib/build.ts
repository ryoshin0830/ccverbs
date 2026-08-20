import type { SetDraft } from "./types.js";
import { splitVerbs } from "./validate.js";

export const REPO_OWNER = "ryoshin0830";
export const REPO_NAME = "ccverbs";
export const REPO_BRANCH = "main";

/**
 * Conservative cap against the ~8 KB HTTP request-line limit most servers
 * implement. This is not a measured GitHub 414 threshold.
 *
 * The figure matters: a 40-verb study set encodes to about 6,167 characters,
 * so any cap below that would send the project's most valuable category of set
 * down the copy-and-paste path every single time.
 */
export const MAX_URL_LENGTH = 7500;

/** Build the set object with the same key order as the sets in the repo. */
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

/** Two-space indent and a trailing newline, matching the committed sets. */
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

/**
 * The GitHub new-file URL that opens its editor with the set prefilled.
 *
 * Deliberately no API call and no token: GitHub authenticates the contributor,
 * the pull request is authored by them, and this project holds no secret.
 */
export function newFileUrl(draft: SetDraft): NewFileLink {
  const filename = `sets/${draft.id}.json`;
  const base = `https://github.com/${REPO_OWNER}/${REPO_NAME}/new/${REPO_BRANCH}`;
  const fallbackUrl = `${base}?filename=${encodeURIComponent(filename)}`;
  const full = `${fallbackUrl}&value=${encodeURIComponent(buildSetJson(draft))}`;
  const tooLong = full.length > MAX_URL_LENGTH;

  return { url: tooLong ? null : full, fallbackUrl, length: full.length, tooLong, filename };
}
