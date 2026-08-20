import { Box, Text } from "ink";
import type { VerbSet } from "../registry/schema.js";

interface PreviewPaneProps {
  set: VerbSet | null;
  sampleSize?: number;
}

export function PreviewPane({ set, sampleSize = 8 }: PreviewPaneProps) {
  if (!set) {
    return (
      <Box flexDirection="column" width="50%">
        <Text dimColor>Pick a set to preview it.</Text>
        <Text dimColor>Random picks one for you at apply time.</Text>
      </Box>
    );
  }

  const shown = set.verbs.slice(0, sampleSize);
  const remaining = set.verbs.length - shown.length;

  return (
    <Box flexDirection="column" width="50%">
      <Text bold>
        {set.emoji} {set.name}{" "}
        <Text dimColor>
          ({set.verbs.length} verb{set.verbs.length === 1 ? "" : "s"})
        </Text>
      </Text>
      <Text dimColor>{set.description}</Text>
      <Text dimColor>
        {set.language} · {set.category}
        {set.tags.length > 0 ? ` · ${set.tags.join(", ")}` : ""}
      </Text>
      {set.author && <Text dimColor>by {set.author.name}</Text>}
      <Box marginTop={1} flexDirection="column">
        {shown.map((verb) => (
          <Text key={verb}>
            <Text color="cyan">* </Text>
            {verb}
            <Text dimColor>...</Text>
          </Text>
        ))}
        {remaining > 0 && <Text dimColor>{`  ... and ${remaining} more`}</Text>}
      </Box>
    </Box>
  );
}
