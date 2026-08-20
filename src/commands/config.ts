import type { Options } from "../args.js";
import { DEFAULT_CONFIG, writeConfig, type CcverbsConfig } from "../config/io.js";
import { EXIT } from "../constants.js";
import { SUPPORTED_LOCALES, UNREVIEWED_LOCALES } from "../i18n/locales.js";
import { layoutWidth } from "../registry/schema.js";
import {
  localeSourceLabel,
  modeLabel,
  pad,
  scopeLabel,
  type CommandDeps,
} from "./io.js";

function describeConfig(deps: CommandDeps) {
  const explicit =
    deps.localeSource === "flag" ||
    deps.localeSource === "env" ||
    deps.localeSource === "config";
  return {
    language: { value: deps.locale, source: deps.localeSource, explicit },
    mode: {
      value: deps.config.mode,
      source: deps.fromFile.mode ? ("config" as const) : ("default" as const),
    },
    scope: {
      value: deps.config.scope,
      source: deps.fromFile.scope ? ("config" as const) : ("default" as const),
    },
    supportedLocales: SUPPORTED_LOCALES,
    unreviewedLocales: UNREVIEWED_LOCALES,
    configPath: deps.configPath,
    cachePath: deps.cachePath,
    cacheAgeMs: deps.cacheAgeMs,
    warnings: deps.warnings,
  };
}

function cacheAge(deps: CommandDeps): string {
  if (deps.cacheAgeMs === null) return deps.t.common.never;
  const minutes = Math.round(deps.cacheAgeMs / 60_000);
  return minutes < 1 ? deps.t.common.justNow : deps.t.common.minutesAgo(minutes);
}

function renderConfigTable(deps: CommandDeps): string[] {
  const { t } = deps;
  const rows = [
    {
      key: t.config.language,
      value: deps.t.meta.nativeName,
      source: localeSourceLabel(t, deps.localeSource),
    },
    {
      key: t.config.mode,
      value: modeLabel(t, deps.config.mode),
      source: deps.fromFile.mode ? t.config.sourceConfig : t.config.sourceDefault,
    },
    {
      key: t.config.scope,
      value: scopeLabel(t, deps.config.scope),
      source: deps.fromFile.scope ? t.config.sourceConfig : t.config.sourceDefault,
    },
  ];

  // Display columns, not code units: 適用方法 is 4 characters but 8 columns wide.
  const keyWidth = Math.max(...rows.map((r) => layoutWidth(r.key)));
  const valueWidth = Math.max(...rows.map((r) => layoutWidth(r.value)));
  const lines = rows.map(
    (r) => `${pad(r.key, keyWidth + 2)}${pad(r.value, valueWidth + 2)}${r.source}`,
  );

  lines.push("");
  lines.push(`${t.config.configLabel}  ${deps.configPath}`);
  lines.push(`${t.config.cacheLabel}  ${deps.cachePath}  ${cacheAge(deps)}`);

  if (!deps.t.meta.reviewed) {
    lines.push("");
    lines.push(t.config.unreviewedNotice(deps.t.meta.nativeName));
  }
  return lines;
}

export function runConfig(options: Options, deps: CommandDeps): number {
  const { io, t } = deps;

  if (options.configKey) {
    const next: CcverbsConfig =
      options.configKey === "reset"
        ? { ...DEFAULT_CONFIG }
        : ({ ...deps.config, [options.configKey]: options.configValue } as CcverbsConfig);

    const { warnings } = writeConfig(deps.configPath, next);

    if (options.json) {
      io.out(
        JSON.stringify({
          ok: warnings.length === 0,
          saved: next,
          configPath: deps.configPath,
          warnings,
        }),
      );
    } else {
      for (const w of warnings) io.err(`ccverbs: ${w}`);
      if (warnings.length === 0) io.out(`${deps.configPath}`);
    }
    return EXIT.OK;
  }

  if (options.json) {
    io.out(JSON.stringify({ ok: true, ...describeConfig(deps) }));
    return EXIT.OK;
  }

  io.out(t.config.title);
  io.out("");
  for (const line of renderConfigTable(deps)) io.out(line);
  return EXIT.OK;
}
