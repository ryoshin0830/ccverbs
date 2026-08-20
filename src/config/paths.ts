import { homedir } from "node:os";
import { join } from "node:path";

export function configDir(home = homedir()): string {
  return join(home, ".ccverbs");
}

export function configPath(home = homedir()): string {
  return join(configDir(home), "config.json");
}

export function cachePath(home = homedir()): string {
  return join(configDir(home), "cache", "index.json");
}

/** Where 0.1.0 kept the registry cache. Only the migration reads this. */
export function legacyCachePath(home = homedir()): string {
  return join(home, ".cache", "ccverbs", "index.json");
}
