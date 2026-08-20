import { Box, Text, useInput } from "ink";
import type { OpenContributionResult } from "../../browser.js";
import type { Catalog } from "../../i18n/en.js";

interface ContributionScreenProps {
  result: OpenContributionResult;
  t: Catalog;
  onExit: () => void;
}

export function ContributionScreen({ result, t, onExit }: ContributionScreenProps) {
  useInput(() => onExit());

  return (
    <Box flexDirection="column">
      <Text color={result.ok ? "green" : "yellow"}>
        {result.ok ? t.wizard.createOpened : t.wizard.createFailed(result.error)}
      </Text>
      <Text>
        {t.wizard.createManual} {result.url}
      </Text>
      <Box marginTop={1}>
        <Text dimColor>{t.wizard.anyKeyToExit}</Text>
      </Box>
    </Box>
  );
}
