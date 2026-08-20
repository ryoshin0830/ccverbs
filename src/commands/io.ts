import type { Options } from "../args.js";
import type { CcverbsConfig, FromFile } from "../config/io.js";
import type { Catalog } from "../i18n/en.js";
import type { LocaleSource } from "../i18n/resolve.js";
import type { SupportedLocale } from "../i18n/locales.js";
import { layoutWidth, type RegistryIndex } from "../registry/schema.js";
import type { Scope } from "../settings/paths.js";

export interface Io {
  out(line: string): void;
  err(line: string): void;
}

export interface CommandDeps {
  registry: RegistryIndex;
  skipped: string[];
  io: Io;
  t: Catalog;
  locale: SupportedLocale;
  localeSource: LocaleSource;
  config: CcverbsConfig;
  fromFile: FromFile;
  configPath: string;
  cachePath: string;
  cacheAgeMs: number | null;
  warnings: string[];
  cwd?: string;
  home?: string;
  random?: () => number;
}

/** The single place where a flag beats the stored setting. */
export function effectiveMode(options: Options, deps: CommandDeps): "replace" | "append" {
  return options.mode ?? deps.config.mode;
}

export function effectiveScope(options: Options, deps: CommandDeps): Scope {
  return options.scope ?? deps.config.scope;
}

export function fail(
  io: Io,
  useJson: boolean,
  code: string,
  message: string,
  exit: number,
): number {
  if (useJson) io.out(JSON.stringify({ ok: false, error: { code, message } }));
  else io.err(`ccverbs: ${message}`);
  return exit;
}

export function pad(text: string, width: number): string {
  return text + " ".repeat(Math.max(0, width - layoutWidth(text)));
}

export function modeLabel(t: Catalog, mode: "replace" | "append"): string {
  return mode === "replace" ? t.modes.replace : t.modes.append;
}

export function scopeLabel(t: Catalog, scope: Scope): string {
  if (scope === "user") return t.scopes.user;
  if (scope === "project") return t.scopes.project;
  return t.scopes.local;
}

export function localeSourceLabel(t: Catalog, source: LocaleSource): string {
  switch (source) {
    case "flag":
      return t.config.sourceFlag;
    case "env":
      return t.config.sourceEnv;
    case "config":
      return t.config.sourceConfig;
    case "posix-env":
      return t.config.sourcePosixEnv;
    case "os":
      return t.config.sourceOs;
    case "intl":
      return t.config.sourceIntl;
    default:
      return t.config.sourceDefault;
  }
}
