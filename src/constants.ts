export const REGISTRY_URL =
  "https://raw.githubusercontent.com/ryoshin0830/ccverbs/main/sets/index.json";

export const BACKUP_SUFFIX = ".ccverbs.bak";
export const TMP_SUFFIX = ".ccverbs.tmp";

/** Built-in verbs shipped by Claude Code 2.1.235. */
export const DEFAULT_VERB_COUNT = 186;

export const EXIT = {
  OK: 0,
  ERROR: 1,
  USAGE: 2,
  NOT_FOUND: 3,
  REGISTRY: 4,
} as const;
