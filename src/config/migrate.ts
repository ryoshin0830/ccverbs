import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { cachePath, legacyCachePath } from "./paths.js";

/**
 * Move the 0.1.0 cache under ~/.ccverbs. Safe to call on every startup, and
 * silent on failure: a cache is disposable, so losing it costs one refetch.
 */
export function migrateCache(home?: string): { moved: boolean } {
  try {
    const next = cachePath(home);
    if (existsSync(next)) return { moved: false };

    const legacy = legacyCachePath(home);
    if (!existsSync(legacy)) return { moved: false };

    mkdirSync(dirname(next), { recursive: true });
    try {
      renameSync(legacy, next);
    } catch {
      copyFileSync(legacy, next);
      rmSync(legacy, { force: true });
    }

    const legacyDir = dirname(legacy);
    if (readdirSync(legacyDir).length === 0) rmSync(legacyDir, { recursive: true, force: true });

    return { moved: true };
  } catch {
    return { moved: false };
  }
}
