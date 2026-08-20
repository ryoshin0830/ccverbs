import { Box, Text, useInput } from "ink";
import { useState } from "react";
import type { Catalog } from "../../i18n/en.js";
import { layoutWidth } from "../../registry/schema.js";

export type SettingsRow = "language" | "mode" | "scope" | "reset";

export interface SettingsEntry {
  row: SettingsRow;
  key: string;
  value: string;
  source: string;
}

interface SettingsListScreenProps {
  title: string;
  entries: SettingsEntry[];
  resetLabel: string;
  configPath: string;
  cacheLine: string;
  footer: string;
  warning: string | null;
  notice: string | null;
  t: Catalog;
  onSelect: (row: SettingsRow) => void;
  onQuit: () => void;
}

function pad(text: string, width: number): string {
  return text + " ".repeat(Math.max(0, width - layoutWidth(text)));
}

export function SettingsListScreen({
  title,
  entries,
  resetLabel,
  configPath,
  cacheLine,
  footer,
  warning,
  notice,
  onSelect,
  onQuit,
}: SettingsListScreenProps) {
  const [index, setIndex] = useState(0);
  const rowCount = entries.length + 1; // + the reset row

  useInput((_input, key) => {
    if (key.escape) return onQuit();
    if (key.upArrow) return setIndex((i) => Math.max(0, i - 1));
    if (key.downArrow) return setIndex((i) => Math.min(rowCount - 1, i + 1));
    if (key.return) {
      const entry = entries[index];
      onSelect(entry ? entry.row : "reset");
    }
  });

  const keyWidth = Math.max(...entries.map((e) => layoutWidth(e.key)));
  const valueWidth = Math.max(...entries.map((e) => layoutWidth(e.value)));

  return (
    <Box flexDirection="column">
      <Text bold>{title}</Text>
      <Box marginTop={1} flexDirection="column">
        {entries.map((entry, i) => (
          <Text key={entry.row} inverse={i === index}>
            {i === index ? "> " : "  "}
            {pad(entry.key, keyWidth + 2)}
            {pad(entry.value, valueWidth + 2)}
            <Text dimColor={i !== index}>{entry.source}</Text>
          </Text>
        ))}
        <Text dimColor>{`  ${"-".repeat(keyWidth + valueWidth + 4)}`}</Text>
        <Text inverse={index === entries.length}>
          {index === entries.length ? "> " : "  "}
          {resetLabel}
        </Text>
      </Box>
      {warning && (
        <Box marginTop={1}>
          <Text color="red">{warning}</Text>
        </Box>
      )}
      <Box marginTop={1} flexDirection="column">
        <Text dimColor>{configPath}</Text>
        <Text dimColor>{cacheLine}</Text>
      </Box>
      {notice && (
        <Box marginTop={1}>
          <Text color="yellow">{notice}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text dimColor>{footer}</Text>
      </Box>
    </Box>
  );
}
