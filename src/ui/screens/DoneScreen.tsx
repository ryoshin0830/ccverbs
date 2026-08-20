import { Box, Text, useInput } from "ink";
import type { Catalog } from "../../i18n/en.js";
import type { SupportedLocale } from "../../i18n/locales.js";
import { localizedName, type VerbSet } from "../../registry/schema.js";

interface DoneScreenProps {
  set: VerbSet;
  mode: "replace" | "append";
  settingsPath: string;
  backupPath: string | null;
  t: Catalog;
  locale: SupportedLocale;
  onExit: () => void;
}

export function DoneScreen({
  set,
  mode,
  settingsPath,
  backupPath,
  t,
  locale,
  onExit,
}: DoneScreenProps) {
  useInput(() => onExit());

  const modeText = mode === "replace" ? t.modes.replace : t.modes.append;

  return (
    <Box flexDirection="column">
      <Text color="green">
        {t.wizard.appliedTitle(
          `${set.emoji} ${localizedName(set, locale)}`,
          set.verbs.length,
          modeText,
        )}
      </Text>
      <Text dimColor>
        {t.wizard.settingsPath} {settingsPath}
      </Text>
      {backupPath && (
        <Text dimColor>
          {t.wizard.backupPath} {backupPath}
        </Text>
      )}
      <Box marginTop={1}>
        <Text dimColor>
          {t.wizard.restartHint} {t.wizard.anyKeyToExit}
        </Text>
      </Box>
    </Box>
  );
}
