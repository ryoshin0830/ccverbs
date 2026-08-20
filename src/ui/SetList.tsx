import { Box, Text } from "ink";
import type { Catalog } from "../i18n/en.js";
import type { SupportedLocale } from "../i18n/locales.js";
import { layoutWidth, localizedName, type VerbSet } from "../registry/schema.js";

export type Row = { kind: "random" } | { kind: "create" } | { kind: "set"; set: VerbSet };

function pad(text: string, width: number): string {
  return text + " ".repeat(Math.max(0, width - layoutWidth(text)));
}

interface SetListProps {
  rows: Row[];
  selected: number;
  height: number;
  t: Catalog;
  locale: SupportedLocale;
}

export function SetList({ rows, selected, height, t, locale }: SetListProps) {
  const start = Math.max(0, Math.min(selected - Math.floor(height / 2), rows.length - height));
  const offset = Math.max(0, start);
  const window = rows.slice(offset, offset + height);

  const nameWidth = Math.max(
    layoutWidth(t.wizard.randomRow),
    layoutWidth(t.wizard.createRow),
    ...rows.map((r) => (r.kind === "set" ? layoutWidth(localizedName(r.set, locale)) : 0)),
  );

  return (
    <Box flexDirection="column" width="50%" paddingRight={1}>
      {window.length === 0 && <Text dimColor>{t.wizard.noMatches}</Text>}
      {window.map((row, i) => {
        const index = offset + i;
        const active = index === selected;
        const marker = active ? ">" : " ";

        if (row.kind === "random") {
          return (
            <Text key="__random__" inverse={active} color="magenta">
              {marker} {pad(t.wizard.randomRow, nameWidth + 6)}
              <Text dimColor={!active}>{t.wizard.randomHint}</Text>
            </Text>
          );
        }

        if (row.kind === "create") {
          return (
            <Text key="__create__" inverse={active} color="green">
              {marker} {pad(t.wizard.createRow, nameWidth + 6)}
              <Text dimColor={!active}>{t.wizard.createHint}</Text>
            </Text>
          );
        }

        const { set } = row;
        return (
          <Text key={set.id} inverse={active}>
            {marker} {set.emoji} {pad(localizedName(set, locale), nameWidth)}{" "}
            <Text dimColor={!active}>
              {String(set.verbs.length).padStart(3)} {set.category}
            </Text>
          </Text>
        );
      })}
      {rows.length > height && (
        <Text dimColor>
          {"  "}
          {selected + 1}/{rows.length}
        </Text>
      )}
    </Box>
  );
}
