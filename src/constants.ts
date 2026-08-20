import { homedir } from "node:os";
import { join } from "node:path";

export const REGISTRY_URL =
  "https://raw.githubusercontent.com/ryoshin0830/ccverbs/main/sets/index.json";

export const CACHE_DIR = join(homedir(), ".cache", "ccverbs");
export const CACHE_FILE = join(CACHE_DIR, "index.json");
export const CACHE_TTL_MS = 3_600_000;

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
