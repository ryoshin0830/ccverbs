import { Box, Text, useInput } from "ink";
import { useMemo, useState } from "react";
import type { Catalog } from "../../i18n/en.js";
import type { SupportedLocale } from "../../i18n/locales.js";
import type { RegistryIndex, VerbSet } from "../../registry/schema.js";
import { groupByLocale, pickRandom, searchSets } from "../../selection.js";
import { PreviewPane } from "../PreviewPane.js";
import { SetList, type Row } from "../SetList.js";

const LIST_HEIGHT = 12;

interface SetScreenProps {
  registry: RegistryIndex;
  skipped: string[];
  t: Catalog;
  locale: SupportedLocale;
  random?: () => number;
  onSelect: (set: VerbSet) => void;
  onCreate: () => void;
  onQuit: () => void;
}

export function SetScreen({
  registry,
  skipped,
  t,
  locale,
  random,
  onSelect,
  onCreate,
  onQuit,
}: SetScreenProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  const matches = useMemo(
    () => groupByLocale(searchSets(registry.sets, query), locale),
    [registry.sets, query, locale],
  );
  const rows: Row[] = useMemo(
    () => [
      ...(query.trim() === "" ? ([{ kind: "random" }, { kind: "create" }] as Row[]) : []),
      ...matches.map((set) => ({ kind: "set", set }) as Row),
    ],
    [matches, query],
  );

  const clamped = Math.min(selected, Math.max(0, rows.length - 1));
  const activeRow = rows[clamped];
  const previewSet = activeRow?.kind === "set" ? activeRow.set : (matches[0] ?? null);
  const isCreateRow = activeRow?.kind === "create";

  useInput((input, key) => {
    if (key.escape) return onQuit();
    if (key.upArrow) return setSelected((s) => Math.max(0, s - 1));
    if (key.downArrow) return setSelected((s) => Math.min(rows.length - 1, s + 1));
    if (key.return) {
      if (!activeRow) return;
      if (activeRow.kind === "create") return onCreate();
      onSelect(activeRow.kind === "random" ? pickRandom(registry.sets, random) : activeRow.set);
      return;
    }
    if (key.backspace || key.delete) {
      setQuery((q) => q.slice(0, -1));
      setSelected(0);
      return;
    }
    if (input && !key.ctrl && !key.meta) {
      setQuery((q) => q + input);
      setSelected(0);
    }
  });

  return (
    <Box flexDirection="column">
      <Text>
        <Text bold>{t.common.appName}</Text>
        <Text dimColor>
          {"  "}
          {t.common.registrySummary(registry.totalSets, registry.totalVerbs)}
        </Text>
      </Text>
      {skipped.length > 0 && (
        <Text color="yellow">{t.wizard.skippedSets(skipped.length, skipped.join(", "))}</Text>
      )}
      <Box marginTop={1}>
        <Text>
          <Text color="cyan">{t.wizard.searchLabel} </Text>
          {query}
          <Text inverse> </Text>
        </Text>
      </Box>
      <Box marginTop={1}>
        <SetList rows={rows} selected={clamped} height={LIST_HEIGHT} t={t} locale={locale} />
        {isCreateRow ? (
          <Box flexDirection="column" width="50%">
            <Text bold>{t.wizard.createTitle}</Text>
            <Text dimColor>{t.wizard.createPreview}</Text>
          </Box>
        ) : (
          <PreviewPane set={previewSet} t={t} locale={locale} />
        )}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>{t.wizard.footerSet}</Text>
      </Box>
    </Box>
  );
}
