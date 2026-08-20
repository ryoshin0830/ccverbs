import { useState } from "react";
import { DEFAULT_CONFIG, writeConfig, type CcverbsConfig } from "../config/io.js";
import { EXIT } from "../constants.js";
import type { Catalog } from "../i18n/en.js";
import { getCatalog } from "../i18n/index.js";
import { SUPPORTED_LOCALES, type SupportedLocale } from "../i18n/locales.js";
import type { LocaleSource } from "../i18n/resolve.js";
import { resolveSettingsPath, type Scope } from "../settings/paths.js";
import { ChoiceScreen, type Choice } from "./screens/ChoiceScreen.js";
import {
  SettingsListScreen,
  type SettingsEntry,
  type SettingsRow,
} from "./screens/SettingsListScreen.js";

type Stage = "list" | "language" | "mode" | "scope";

export interface ConfigAppProps {
  t: Catalog;
  locale: SupportedLocale;
  localeSource: LocaleSource;
  initialConfig: CcverbsConfig;
  configPath: string;
  cachePath: string;
  cacheAgeMs: number | null;
  onExit: (code: number) => void;
  cwd?: string;
  home?: string;
}

function sourceLabel(t: Catalog, source: LocaleSource): string {
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

export function ConfigApp({
  t: initialCatalog,
  locale,
  localeSource,
  initialConfig,
  configPath,
  cachePath,
  cacheAgeMs,
  onExit,
  cwd,
  home,
}: ConfigAppProps) {
  const [stage, setStage] = useState<Stage>("list");
  const [config, setConfig] = useState<CcverbsConfig>(initialConfig);
  const [warning, setWarning] = useState<string | null>(null);

  // Changing the language repaints this screen in the new language immediately.
  const activeLocale: SupportedLocale = config.language === "auto" ? locale : config.language;
  const t = config.language === "auto" ? initialCatalog : getCatalog(activeLocale);

  function save(next: CcverbsConfig) {
    const { warnings } = writeConfig(configPath, next);
    setConfig(next);
    setWarning(warnings[0] ? t.config.saveFailed(warnings[0]) : null);
    setStage("list");
  }

  const languageChoices: Choice<"auto" | SupportedLocale>[] = [
    {
      value: "auto",
      label: t.config.auto,
      hint: t.config.autoDetected(getCatalog(locale).meta.nativeName, sourceLabel(t, localeSource)),
    },
    ...SUPPORTED_LOCALES.map((code) => {
      const catalog = getCatalog(code);
      const choice: Choice<"auto" | SupportedLocale> = {
        value: code,
        label: catalog.meta.nativeName,
      };
      if (!catalog.meta.reviewed) choice.note = t.config.unreviewed;
      return choice;
    }),
  ];

  const modeChoices: Choice<"replace" | "append">[] = [
    { value: "replace", label: t.modes.replace, hint: t.modes.replaceHint(0).replace("0", "N") },
    { value: "append", label: t.modes.append, hint: t.modes.appendHint(186, 0).replace(" 0 ", " N ") },
  ];

  const scopeChoices: Choice<Scope>[] = [
    { value: "user", label: t.scopes.user, hint: resolveSettingsPath("user", cwd, home) },
    { value: "project", label: t.scopes.project, hint: resolveSettingsPath("project", cwd, home) },
    {
      value: "local",
      label: t.scopes.local,
      hint: resolveSettingsPath("local", cwd, home),
      note: t.scopes.localNote,
    },
  ];

  if (stage === "language") {
    return (
      <ChoiceScreen
        title={t.config.language}
        choices={languageChoices}
        initialValue={config.language}
        footer={t.wizard.footerChoice}
        onSelect={(value) => save({ ...config, language: value })}
        onBack={() => setStage("list")}
      />
    );
  }

  if (stage === "mode") {
    return (
      <ChoiceScreen
        title={t.config.mode}
        choices={modeChoices}
        initialValue={config.mode}
        footer={t.wizard.footerChoice}
        onSelect={(value) => save({ ...config, mode: value })}
        onBack={() => setStage("list")}
      />
    );
  }

  if (stage === "scope") {
    return (
      <ChoiceScreen
        title={t.config.scope}
        choices={scopeChoices}
        initialValue={config.scope}
        footer={t.wizard.footerChoice}
        onSelect={(value) => save({ ...config, scope: value })}
        onBack={() => setStage("list")}
      />
    );
  }

  const entries: SettingsEntry[] = [
    {
      row: "language",
      key: t.config.language,
      value: config.language === "auto" ? t.config.auto : getCatalog(config.language).meta.nativeName,
      source:
        config.language === "auto"
          ? t.config.autoDetected(
              getCatalog(locale).meta.nativeName,
              sourceLabel(t, localeSource),
            )
          : t.config.sourceConfig,
    },
    {
      row: "mode",
      key: t.config.mode,
      value: config.mode === "replace" ? t.modes.replace : t.modes.append,
      source: config.mode === DEFAULT_CONFIG.mode ? t.config.sourceDefault : t.config.sourceConfig,
    },
    {
      row: "scope",
      key: t.config.scope,
      value:
        config.scope === "user"
          ? t.scopes.user
          : config.scope === "project"
            ? t.scopes.project
            : t.scopes.local,
      source: config.scope === DEFAULT_CONFIG.scope ? t.config.sourceDefault : t.config.sourceConfig,
    },
  ];

  const cacheAge =
    cacheAgeMs === null
      ? t.common.never
      : cacheAgeMs < 60_000
        ? t.common.justNow
        : t.common.minutesAgo(Math.round(cacheAgeMs / 60_000));

  return (
    <SettingsListScreen
      title={t.config.title}
      entries={entries}
      resetLabel={t.config.resetRow}
      configPath={`${t.config.configLabel}  ${configPath}`}
      cacheLine={`${t.config.cacheLabel}  ${cachePath}  ${cacheAge}`}
      footer={t.config.footerList}
      warning={warning}
      notice={
        getCatalog(activeLocale).meta.reviewed
          ? null
          : t.config.unreviewedNotice(getCatalog(activeLocale).meta.nativeName)
      }
      t={t}
      onSelect={(row: SettingsRow) => {
        if (row === "reset") return save({ ...DEFAULT_CONFIG });
        setStage(row);
      }}
      onQuit={() => onExit(EXIT.OK)}
    />
  );
}
