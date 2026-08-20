import { execFileSync } from "node:child_process";

function defaultRun(cmd: string, args: string[]): string {
  return execFileSync(cmd, args, {
    encoding: "utf8",
    timeout: 500,
    stdio: ["ignore", "pipe", "ignore"],
  });
}

/** A quoted string inside a macOS plist array. */
const PLIST_ENTRY = /"([^"]+)"/g;
const BARE_TAG = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

export interface QueryOsDeps {
  platform?: NodeJS.Platform;
  run?: (cmd: string, args: string[]) => string;
}

/**
 * The OS's preferred UI languages, most preferred first, as raw BCP 47 tags.
 * Returns [] on any failure — a missing binary, a timeout, or output we cannot
 * parse must never break the CLI.
 */
export function queryOsLocales(deps: QueryOsDeps = {}): string[] {
  const platform = deps.platform ?? process.platform;
  const run = deps.run ?? defaultRun;

  try {
    if (platform === "darwin") {
      const out = run("defaults", ["read", "-g", "AppleLanguages"]);
      return [...out.matchAll(PLIST_ENTRY)].map((m) => m[1] as string);
    }
    if (platform === "win32") {
      const out = run("powershell", [
        "-NoProfile",
        "-Command",
        "Get-UICulture | Select-Object -ExpandProperty Name",
      ]);
      const tag = out.trim();
      return BARE_TAG.test(tag) ? [tag] : [];
    }
  } catch {
    // Non-fatal by design.
  }
  return [];
}
