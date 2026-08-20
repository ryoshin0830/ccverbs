import { Box, Text } from "ink";
import type { Catalog } from "../i18n/en.js";
import type { SupportedLocale } from "../i18n/locales.js";
import { localizedDescription, localizedName, type VerbSet } from "../registry/schema.js";

interface PreviewPaneProps {
  set: VerbSet | null;
  t: Catalog;
  locale: SupportedLocale;
  sampleSize?: number;
}

export function PreviewPane({ set, t, locale, sampleSize = 8 }: PreviewPaneProps) {
  if (!set) {
    return (
      <Box flexDirection="column" width="50%">
        <Text dimColor>{t.wizard.pickHint}</Text>
      </Box>
    );
  }

  const shown = set.verbs.slice(0, sampleSize);
  const remaining = set.verbs.length - shown.length;

  return (
    <Box flexDirection="column" width="50%">
      <Text bold>
        {set.emoji} {localizedName(set, locale)}{" "}
        <Text dimColor>({t.common.verbCount(set.verbs.length)})</Text>
      </Text>
      <Text dimColor>{localizedDescription(set, locale)}</Text>
      <Text dimColor>
        {set.language} · {set.category}
        {set.tags.length > 0 ? ` · ${set.tags.join(", ")}` : ""}
      </Text>
      {set.author && <Text dimColor>{t.list.byAuthor(set.author.name)}</Text>}
      <Box marginTop={1} flexDirection="column">
        {shown.map((verb) => (
          <Text key={verb}>
            <Text color="cyan">* </Text>
            {verb}
            <Text dimColor>…</Text>
          </Text>
        ))}
        {remaining > 0 && <Text dimColor>{`  ${t.wizard.andMore(remaining)}`}</Text>}
      </Box>
    </Box>
  );
}
