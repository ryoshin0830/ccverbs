import { Box, Text, useInput } from "ink";
import { useState } from "react";
import { layoutWidth } from "../../registry/schema.js";

export interface Choice<T> {
  value: T;
  label: string;
  hint?: string;
  note?: string;
}

export interface ChoiceScreenProps<T> {
  title: string;
  choices: Choice<T>[];
  initialValue: T;
  footer: string;
  onSelect: (value: T) => void;
  onBack: () => void;
}

/**
 * One question, one screen. Up/down and Enter are the whole interaction: no
 * left/right, and no invisible "which field has focus" state. Used by the
 * settings screen for language, mode and scope alike.
 */
export function ChoiceScreen<T extends string>({
  title,
  choices,
  initialValue,
  footer,
  onSelect,
  onBack,
}: ChoiceScreenProps<T>) {
  const start = Math.max(
    0,
    choices.findIndex((c) => c.value === initialValue),
  );
  const [index, setIndex] = useState(start);
  const labelWidth = Math.max(...choices.map((c) => layoutWidth(c.label)));

  useInput((_input, key) => {
    if (key.escape) return onBack();
    if (key.upArrow) return setIndex((i) => Math.max(0, i - 1));
    if (key.downArrow) return setIndex((i) => Math.min(choices.length - 1, i + 1));
    if (key.return) {
      const chosen = choices[index];
      if (chosen) onSelect(chosen.value);
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>{title}</Text>
      <Box marginTop={1} flexDirection="column">
        {choices.map((choice, i) => {
          const active = i === index;
          const gap = " ".repeat(Math.max(0, labelWidth - layoutWidth(choice.label)) + 4);
          return (
            <Text key={choice.value} inverse={active}>
              {active ? "> " : "  "}
              {choice.label}
              {gap}
              <Text dimColor={!active}>
                {choice.hint ?? ""}
                {choice.note ? `   ${choice.note}` : ""}
              </Text>
            </Text>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>{footer}</Text>
      </Box>
    </Box>
  );
}
