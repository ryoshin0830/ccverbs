import { Box, Text, useInput } from "ink";
import type { Catalog } from "../../i18n/en.js";
import type { SupportedLocale } from "../../i18n/locales.js";
import { localizedName, type VerbSet } from "../../registry/schema.js";
import { effectiveVerbCount, type SpinnerVerbs } from "../../settings/apply.js";
import { renderDiff } from "../../settings/diff.js";
import type { Scope } from "../../settings/paths.js";

interface ConfirmScreenProps {
  set: VerbSet;
  before: SpinnerVerbs | null;
  after: SpinnerVerbs;
  mode: "replace" | "append";
  scope: Scope;
  settingsPath: string;
  t: Catalog;
  locale: SupportedLocale;
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * The wizard no longer asks for mode and scope, so this screen states them.
 * A setting that is applied without being asked about must be visible before it
 * takes effect.
 */
export function ConfirmScreen({
  set,
  before,
  after,
  mode,
  scope,
  settingsPath,
  t,
  locale,
  onConfirm,
  onBack,
}: ConfirmScreenProps) {
  useInput((input, key) => {
    if (key.escape || input === "n" || input === "N") return onBack();
    if (key.return || input === "y" || input === "Y") onConfirm();
  });

  const modeText = mode === "replace" ? t.modes.replace : t.modes.append;
  const modeHint =
    mode === "replace"
      ? t.modes.replaceHint(set.verbs.length)
      : t.modes.appendHint(186, set.verbs.length);
  const scopeText =
    scope === "user" ? t.scopes.user : scope === "project" ? t.scopes.project : t.scopes.local;

  return (
    <Box flexDirection="column">
      <Text bold>
        {t.wizard.applyTitle(`${set.emoji} ${localizedName(set, locale)}`)}
      </Text>

      <Box marginTop={1} flexDirection="column">
        <Text>
          <Text dimColor>{t.wizard.modeLabel}</Text>
          {"   "}
          {modeText}
          {"   "}
          <Text dimColor>{modeHint}</Text>
        </Text>
        <Text>
          <Text dimColor>{t.wizard.scopeLabel}</Text>
          {"   "}
          {scopeText}
          {"   "}
          <Text dimColor>{settingsPath}</Text>
        </Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        {renderDiff(before, after)
          .split("\n")
          .map((line, i) => (
            <Text
              key={`${i}-${line}`}
              color={line.startsWith("+") ? "green" : line.startsWith("-") ? "red" : undefined}
            >
              {line}
            </Text>
          ))}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>{t.wizard.willPickFrom(effectiveVerbCount(after))}</Text>
      </Box>

      <Box marginTop={1}>
        <Text>
          {t.wizard.applyQuestion} <Text bold>{t.common.yesNo}</Text>
          {"        "}
          <Text dimColor>{t.wizard.changeSettings}</Text>
        </Text>
      </Box>
    </Box>
  );
}
