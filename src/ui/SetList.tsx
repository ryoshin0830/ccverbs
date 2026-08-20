import { Box, Text } from "ink";
import { layoutWidth, type VerbSet } from "../registry/schema.js";

export const RANDOM_ROW = "__random__";

export type Row = { kind: "random" } | { kind: "set"; set: VerbSet };

function pad(text: string, width: number): string {
  return text + " ".repeat(Math.max(0, width - layoutWidth(text)));
}

interface SetListProps {
  rows: Row[];
  selected: number;
  height: number;
}

export function SetList({ rows, selected, height }: SetListProps) {
  const start = Math.max(0, Math.min(selected - Math.floor(height / 2), rows.length - height));
  const window = rows.slice(Math.max(0, start), Math.max(0, start) + height);
  const offset = Math.max(0, start);

  const nameWidth = Math.max(
    11,
    ...rows.map((r) => (r.kind === "set" ? layoutWidth(r.set.name) : 0)),
  );

  return (
    <Box flexDirection="column" width="50%" paddingRight={1}>
      {window.length === 0 && <Text dimColor>No sets matched.</Text>}
      {window.map((row, i) => {
        const index = offset + i;
        const active = index === selected;
        const marker = active ? ">" : " ";

        if (row.kind === "random") {
          return (
            <Text key={RANDOM_ROW} inverse={active} color="magenta">
              {marker} {pad("Random set", nameWidth)}      surprise me
            </Text>
          );
        }

        const { set } = row;
        return (
          <Text key={set.id} inverse={active}>
            {marker} {set.emoji} {pad(set.name, nameWidth)}{" "}
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
