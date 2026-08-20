import { homedir } from "node:os";
import { join } from "node:path";

export type Scope = "user" | "project" | "local";

export function resolveSettingsPath(scope: Scope, cwd = process.cwd(), home = homedir()): string {
  if (scope === "user") return join(home, ".claude", "settings.json");
  if (scope === "project") return join(cwd, ".claude", "settings.json");
  return join(cwd, ".claude", "settings.local.json");
}
