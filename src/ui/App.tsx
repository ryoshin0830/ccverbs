import { Box, Text, useInput } from "ink";
import { useMemo, useState } from "react";
import { DEFAULT_VERB_COUNT, EXIT } from "../constants.js";
import type { RegistryIndex, VerbSet } from "../registry/schema.js";
import { pickRandom, searchSets } from "../selection.js";
import {
  applySpinnerVerbs,
  effectiveVerbCount,
  readSpinnerVerbs,
  type SpinnerVerbs,
} from "../settings/apply.js";
import { renderDiff } from "../settings/diff.js";
import { readSettings, writeSettings } from "../settings/io.js";
import { resolveSettingsPath, type Scope } from "../settings/paths.js";
import { PreviewPane } from "./PreviewPane.js";
import { SetList, type Row } from "./SetList.js";

const MODES = ["replace", "append"] as const;
const SCOPES: Scope[] = ["user", "project", "local"];
const LIST_HEIGHT = 12;

type Stage = "browse" | "configure" | "confirm" | "done" | "error";

export interface AppProps {
  registry: RegistryIndex;
  skipped: string[];
  onExit: (code: number) => void;
  initialMode?: (typeof MODES)[number];
  initialScope?: Scope;
  cwd?: string;
  home?: string;
  random?: () => number;
}

export function App({
  registry,
  skipped,
  onExit,
  initialMode = "replace",
  initialScope = "user",
  cwd,
  home,
  random,
}: AppProps) {
  const [stage, setStage] = useState<Stage>("browse");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [chosen, setChosen] = useState<VerbSet | null>(null);
  const [mode, setMode] = useState<(typeof MODES)[number]>(initialMode);
  const [scope, setScope] = useState<Scope>(initialScope);
  const [field, setField] = useState<"mode" | "scope">("mode");
  const [result, setResult] = useState<{ backupPath: string | null; path: string } | null>(null);
  const [message, setMessage] = useState("");

  const matches = useMemo(() => searchSets(registry.sets, query), [registry.sets, query]);
  const rows: Row[] = useMemo(
    () => [
      ...(query.trim() === "" ? [{ kind: "random" } as Row] : []),
      ...matches.map((set) => ({ kind: "set", set }) as Row),
    ],
    [matches, query],
  );

  const clamped = Math.min(selected, Math.max(0, rows.length - 1));
  const activeRow = rows[clamped];
  const previewSet =
    activeRow?.kind === "set" ? activeRow.set : (matches[0] ?? registry.sets[0] ?? null);

  const settingsPath = resolveSettingsPath(scope, cwd, home);

  const pending: SpinnerVerbs | null = chosen ? { mode, verbs: chosen.verbs } : null;
  const before = useMemo(() => {
    if (stage !== "confirm") return null;
    try {
      return readSpinnerVerbs(readSettings(settingsPath).data);
    } catch {
      return null;
    }
  }, [stage, settingsPath]);

  function commit() {
    if (!chosen || !pending) return;
    try {
      const file = readSettings(settingsPath);
      const { backupPath } = writeSettings(settingsPath, applySpinnerVerbs(file.data, pending), {
        indent: file.indent,
        trailingNewline: file.trailingNewline,
        backup: true,
      });
      setResult({ backupPath, path: settingsPath });
      setStage("done");
    } catch (error) {
      setMessage((error as Error).message);
      setStage("error");
    }
  }

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      onExit(EXIT.OK);
      return;
    }

    if (stage === "done" || stage === "error") {
      onExit(stage === "done" ? EXIT.OK : EXIT.ERROR);
      return;
    }

    if (stage === "browse") {
      if (key.escape) {
        onExit(EXIT.OK);
        return;
      }
      if (key.upArrow) {
        setSelected((s) => Math.max(0, s - 1));
        return;
      }
      if (key.downArrow) {
        setSelected((s) => Math.min(rows.length - 1, s + 1));
        return;
      }
      if (key.return) {
        if (!activeRow) return;
        const set =
          activeRow.kind === "random"
            ? pickRandom(registry.sets, random)
            : activeRow.set;
        setChosen(set);
        setStage("configure");
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
      return;
    }

    if (stage === "configure") {
      if (key.escape) {
        setStage("browse");
        return;
      }
      if (key.upArrow || key.downArrow || key.tab) {
        setField((f) => (f === "mode" ? "scope" : "mode"));
        return;
      }
      if (key.leftArrow || key.rightArrow) {
        if (field === "mode") setMode((m) => (m === "replace" ? "append" : "replace"));
        else setScope((s) => SCOPES[(SCOPES.indexOf(s) + 1) % SCOPES.length] as Scope);
        return;
      }
      if (key.return) {
        setStage("confirm");
      }
      return;
    }

    if (stage === "confirm") {
      if (key.escape || input === "n" || input === "N") {
        setStage("configure");
        return;
      }
      if (key.return || input === "y" || input === "Y") commit();
    }
  });

  const header = (
    <Box flexDirection="column">
      <Text>
        <Text bold>ccverbs</Text>
        <Text dimColor>
          {"  "}
          {registry.totalSets} sets · {registry.totalVerbs} verbs · Claude Code ships{" "}
          {DEFAULT_VERB_COUNT}
        </Text>
      </Text>
      {skipped.length > 0 && (
        <Text color="yellow">
          skipped {skipped.length} malformed set(s): {skipped.join(", ")}
        </Text>
      )}
    </Box>
  );

  if (stage === "browse") {
    return (
      <Box flexDirection="column">
        {header}
        <Box marginTop={1}>
          <Text>
            <Text color="cyan">Search: </Text>
            {query}
            <Text inverse> </Text>
          </Text>
        </Box>
        <Box marginTop={1}>
          <SetList rows={rows} selected={clamped} height={LIST_HEIGHT} />
          <PreviewPane set={previewSet} />
        </Box>
        <Box marginTop={1}>
          <Text dimColor>up/down move · enter select · type to search · esc quit</Text>
        </Box>
      </Box>
    );
  }

  if (stage === "configure" && chosen) {
    return (
      <Box flexDirection="column">
        {header}
        <Box marginTop={1}>
          <Text>
            {chosen.emoji} <Text bold>{chosen.name}</Text>{" "}
            <Text dimColor>({chosen.verbs.length} verbs)</Text>
          </Text>
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text>
            <Text inverse={field === "mode"}> mode </Text>{" "}
            {MODES.map((m) => (
              <Text key={m} color={m === mode ? "green" : undefined} dimColor={m !== mode}>
                {m === mode ? `[${m}] ` : `${m} `}
              </Text>
            ))}
            <Text dimColor>
              {mode === "replace"
                ? "- use only these verbs"
                : `- add to Claude Code's ${DEFAULT_VERB_COUNT}`}
            </Text>
          </Text>
          <Text>
            <Text inverse={field === "scope"}> scope </Text>{" "}
            {SCOPES.map((s) => (
              <Text key={s} color={s === scope ? "green" : undefined} dimColor={s !== scope}>
                {s === scope ? `[${s}] ` : `${s} `}
              </Text>
            ))}
          </Text>
          <Box marginTop={1}>
            <Text dimColor>{settingsPath}</Text>
          </Box>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>up/down switch field · left/right change · enter continue · esc back</Text>
        </Box>
      </Box>
    );
  }

  if (stage === "confirm" && chosen && pending) {
    return (
      <Box flexDirection="column">
        {header}
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>{settingsPath}</Text>
          <Box marginTop={1} flexDirection="column">
            {renderDiff(before, pending)
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
            <Text dimColor>
              Claude Code will pick from {effectiveVerbCount(pending)} verbs after this.
            </Text>
          </Box>
        </Box>
        <Box marginTop={1}>
          <Text>
            Apply? <Text bold>(Y/n)</Text>
          </Text>
        </Box>
      </Box>
    );
  }

  if (stage === "done" && chosen && result) {
    return (
      <Box flexDirection="column">
        <Text color="green">
          Applied {chosen.emoji} {chosen.name} ({chosen.verbs.length} verbs, {mode})
        </Text>
        <Text dimColor>settings: {result.path}</Text>
        {result.backupPath && <Text dimColor>backup:   {result.backupPath}</Text>}
        <Box marginTop={1}>
          <Text dimColor>Start a new Claude Code session to see it. Press any key to exit.</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="red">ccverbs: {message || "something went wrong"}</Text>
      <Text dimColor>Press any key to exit.</Text>
    </Box>
  );
}
