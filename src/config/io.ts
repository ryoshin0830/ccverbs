import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { isSupportedLocale, type SupportedLocale } from "../i18n/locales.js";
import type { Scope } from "../settings/paths.js";

export interface CcverbsConfig {
  version: 1;
  language: "auto" | SupportedLocale;
  mode: "replace" | "append";
  scope: Scope;
}

export const DEFAULT_CONFIG: CcverbsConfig = {
  version: 1,
  language: "auto",
  mode: "replace",
  scope: "user",
};

/** Which keys the file actually supplied, so `config` can say "default" honestly. */
export interface FromFile {
  language: boolean;
  mode: boolean;
  scope: boolean;
}

export interface ReadConfigResult {
  config: CcverbsConfig;
  warnings: string[];
  existed: boolean;
  fromFile: FromFile;
}

const MODES = new Set(["replace", "append"]);
const SCOPES = new Set(["user", "project", "local"]);

const NONE: FromFile = { language: false, mode: false, scope: false };

/**
 * Read the config file. Never throws: a tool that changes a spinner word has no
 * business refusing to start because its own preference file is malformed.
 */
export function readConfig(path: string): ReadConfigResult {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return { config: { ...DEFAULT_CONFIG }, warnings: [], existed: false, fromFile: { ...NONE } };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      config: { ...DEFAULT_CONFIG },
      warnings: [`${path} is not valid JSON; using defaults`],
      existed: true,
      fromFile: { ...NONE },
    };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      config: { ...DEFAULT_CONFIG },
      warnings: [`${path} is not a JSON object; using defaults`],
      existed: true,
      fromFile: { ...NONE },
    };
  }

  const input = parsed as Record<string, unknown>;
  const config = { ...DEFAULT_CONFIG };
  const fromFile = { ...NONE };
  const warnings: string[] = [];

  if (input.version !== 1) {
    warnings.push(`${path} has an unknown version; reading it as best I can`);
  }

  if (input.language === "auto" || isSupportedLocale(input.language)) {
    config.language = input.language as CcverbsConfig["language"];
    fromFile.language = true;
  } else if (input.language !== undefined) {
    warnings.push(`ignoring an unknown language in ${path}`);
  }

  if (typeof input.mode === "string" && MODES.has(input.mode)) {
    config.mode = input.mode as CcverbsConfig["mode"];
    fromFile.mode = true;
  } else if (input.mode !== undefined) {
    warnings.push(`ignoring an unknown mode in ${path}`);
  }

  if (typeof input.scope === "string" && SCOPES.has(input.scope)) {
    config.scope = input.scope as Scope;
    fromFile.scope = true;
  } else if (input.scope !== undefined) {
    warnings.push(`ignoring an unknown scope in ${path}`);
  }

  return { config, warnings, existed: true, fromFile };
}

/**
 * Write the config file atomically. Failing to remember a preference is less
 * serious than failing to apply a verb set, so this warns rather than throws.
 */
export function writeConfig(path: string, config: CcverbsConfig): { warnings: string[] } {
  try {
    mkdirSync(dirname(path), { recursive: true });
    const tmp = `${path}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(config, null, 2)}\n`, "utf8");
    renameSync(tmp, path);
    return { warnings: [] };
  } catch (error) {
    return { warnings: [`could not save settings to ${path}: ${(error as Error).message}`] };
  }
}
