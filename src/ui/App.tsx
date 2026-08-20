import { Box, Text } from "ink";
import { useState } from "react";
import type { CcverbsConfig } from "../config/io.js";
import type { OpenContributionResult } from "../browser.js";
import { EXIT } from "../constants.js";
import type { Catalog } from "../i18n/en.js";
import type { SupportedLocale } from "../i18n/locales.js";
import type { RegistryIndex, VerbSet } from "../registry/schema.js";
import {
  applySpinnerVerbs,
  readSpinnerVerbs,
  type SpinnerVerbs,
} from "../settings/apply.js";
import { readSettings, writeSettings } from "../settings/io.js";
import { resolveSettingsPath } from "../settings/paths.js";
import { ConfirmScreen } from "./screens/ConfirmScreen.js";
import { ContributionScreen } from "./screens/ContributionScreen.js";
import { DoneScreen } from "./screens/DoneScreen.js";
import { SetScreen } from "./screens/SetScreen.js";

type Stage = "set" | "confirm" | "done" | "contribute" | "error";

export interface AppProps {
  registry: RegistryIndex;
  skipped: string[];
  t: Catalog;
  locale: SupportedLocale;
  config: CcverbsConfig;
  onExit: (code: number) => void;
  onCreate: () => OpenContributionResult;
  cwd?: string;
  home?: string;
  random?: () => number;
}

/**
 * The main flow: pick a set, confirm, done. Mode and scope come from the stored
 * config and are never asked about here; `ccverbs config` owns them.
 */
export function App({
  registry,
  skipped,
  t,
  locale,
  config,
  onExit,
  onCreate,
  cwd,
  home,
  random,
}: AppProps) {
  const [stage, setStage] = useState<Stage>("set");
  const [chosen, setChosen] = useState<VerbSet | null>(null);
  const [before, setBefore] = useState<SpinnerVerbs | null>(null);
  const [backupPath, setBackupPath] = useState<string | null>(null);
  const [contribution, setContribution] = useState<OpenContributionResult | null>(null);
  const [message, setMessage] = useState("");

  const settingsPath = resolveSettingsPath(config.scope, cwd, home);
  const after: SpinnerVerbs | null = chosen
    ? { mode: config.mode, verbs: chosen.verbs }
    : null;

  function choose(set: VerbSet) {
    setChosen(set);
    try {
      setBefore(readSpinnerVerbs(readSettings(settingsPath).data));
    } catch {
      setBefore(null);
    }
    setStage("confirm");
  }

  function commit() {
    if (!after) return;
    try {
      const file = readSettings(settingsPath);
      const result = writeSettings(settingsPath, applySpinnerVerbs(file.data, after), {
        indent: file.indent,
        trailingNewline: file.trailingNewline,
        backup: true,
      });
      setBackupPath(result.backupPath);
      setStage("done");
    } catch (error) {
      setMessage((error as Error).message);
      setStage("error");
    }
  }

  function createSet() {
    setContribution(onCreate());
    setStage("contribute");
  }

  if (stage === "set") {
    return (
      <SetScreen
        registry={registry}
        skipped={skipped}
        t={t}
        locale={locale}
        random={random}
        onSelect={choose}
        onCreate={createSet}
        onQuit={() => onExit(EXIT.OK)}
      />
    );
  }

  if (stage === "confirm" && chosen && after) {
    return (
      <ConfirmScreen
        set={chosen}
        before={before}
        after={after}
        mode={config.mode}
        scope={config.scope}
        settingsPath={settingsPath}
        t={t}
        locale={locale}
        onConfirm={commit}
        onBack={() => setStage("set")}
      />
    );
  }

  if (stage === "done" && chosen) {
    return (
      <DoneScreen
        set={chosen}
        mode={config.mode}
        settingsPath={settingsPath}
        backupPath={backupPath}
        t={t}
        locale={locale}
        onExit={() => onExit(EXIT.OK)}
      />
    );
  }

  if (stage === "contribute" && contribution) {
    return (
      <ContributionScreen
        result={contribution}
        t={t}
        onExit={() => onExit(contribution.ok ? EXIT.OK : EXIT.ERROR)}
      />
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="red">ccverbs: {message || t.errors.writeFailed("")}</Text>
      <Text dimColor>{t.wizard.anyKeyToExit}</Text>
    </Box>
  );
}
