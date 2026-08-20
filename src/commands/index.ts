import type { Options } from "../args.js";
import { DEFAULT_VERB_COUNT, EXIT } from "../constants.js";
import { layoutWidth, type RegistryIndex, type VerbSet } from "../registry/schema.js";
import { findSet, pickRandom, searchSets } from "../selection.js";
import {
  applySpinnerVerbs,
  effectiveVerbCount,
  matchSet,
  readSpinnerVerbs,
  removeSpinnerVerbs,
  type SpinnerVerbs,
} from "../settings/apply.js";
import { renderDiff } from "../settings/diff.js";
import { readSettings, writeSettings } from "../settings/io.js";
import { resolveSettingsPath } from "../settings/paths.js";

export interface Io {
  out(line: string): void;
  err(line: string): void;
}

export interface CommandDeps {
  registry: RegistryIndex;
  skipped: string[];
  io: Io;
  cwd?: string;
  home?: string;
  random?: () => number;
}

function fail(io: Io, useJson: boolean, code: string, message: string, exit: number): number {
  if (useJson) io.out(JSON.stringify({ ok: false, error: { code, message } }));
  else io.err(`ccverbs: ${message}`);
  return exit;
}

function pad(text: string, width: number): string {
  return text + " ".repeat(Math.max(0, width - layoutWidth(text)));
}

function summary(set: VerbSet) {
  return {
    id: set.id,
    name: set.name,
    emoji: set.emoji,
    description: set.description,
    language: set.language,
    category: set.category,
    tags: set.tags,
    count: set.verbs.length,
  };
}

function renderTable(sets: VerbSet[]): string {
  if (sets.length === 0) return "No verb sets matched.";
  const idWidth = Math.max(...sets.map((s) => layoutWidth(s.id)));
  return sets
    .map((s) => {
      const count = String(s.verbs.length).padStart(3);
      return `${pad(s.emoji, 2)}  ${pad(s.id, idWidth)}  ${count}  ${pad(s.category, 7)}  ${s.description}`;
    })
    .join("\n");
}

function listLike(sets: VerbSet[], all: RegistryIndex, options: Options, io: Io): number {
  const totalVerbs = sets.reduce((n, s) => n + s.verbs.length, 0);
  if (options.json) {
    io.out(
      JSON.stringify({
        ok: true,
        totalSets: sets.length,
        totalVerbs,
        registryTotalSets: all.totalSets,
        sets: sets.map(summary),
      }),
    );
    return EXIT.OK;
  }
  io.out(renderTable(sets));
  io.out("");
  io.out(`${sets.length} sets, ${totalVerbs} verbs. Claude Code ships ${DEFAULT_VERB_COUNT}.`);
  return EXIT.OK;
}

interface WriteOutcome {
  before: SpinnerVerbs | null;
  after: SpinnerVerbs | null;
  path: string;
  diff: string;
}

function prepareWrite(
  options: Options,
  deps: CommandDeps,
  after: SpinnerVerbs | null,
): WriteOutcome {
  const path = resolveSettingsPath(options.scope, deps.cwd, deps.home);
  const file = readSettings(path);
  const before = readSpinnerVerbs(file.data);
  return { before, after, path, diff: renderDiff(before, after) };
}

function commitWrite(
  options: Options,
  deps: CommandDeps,
  outcome: WriteOutcome,
): { backupPath: string | null } {
  const file = readSettings(outcome.path);
  const data = outcome.after
    ? applySpinnerVerbs(file.data, outcome.after)
    : removeSpinnerVerbs(file.data);
  return writeSettings(outcome.path, data, {
    indent: file.indent,
    trailingNewline: file.trailingNewline,
    backup: options.backup,
  });
}

function applyOrPreview(
  options: Options,
  deps: CommandDeps,
  set: VerbSet | null,
  after: SpinnerVerbs | null,
): number {
  const { io } = deps;
  const outcome = prepareWrite(options, deps, after);

  if (options.dryRun || !options.yes) {
    const reason = options.dryRun ? "Dry run - nothing written." : "Re-run with --yes to apply.";
    if (options.json) {
      io.out(
        JSON.stringify({
          ok: true,
          applied: null,
          pending: set ? { id: set.id, mode: options.mode, count: set.verbs.length } : null,
          settingsPath: outcome.path,
          diff: outcome.diff,
          reason,
        }),
      );
    } else {
      io.out(outcome.path);
      io.out(outcome.diff);
      io.out("");
      io.out(reason);
    }
    return EXIT.OK;
  }

  let backupPath: string | null;
  try {
    ({ backupPath } = commitWrite(options, deps, outcome));
  } catch (error) {
    return fail(io, options.json, "write-failed", (error as Error).message, EXIT.ERROR);
  }

  const applied = set ? { id: set.id, mode: options.mode, count: set.verbs.length } : null;
  if (options.json) {
    io.out(
      JSON.stringify({
        ok: true,
        applied,
        removed: after === null,
        settingsPath: outcome.path,
        backupPath,
        previous: outcome.before
          ? { mode: outcome.before.mode, count: outcome.before.verbs.length }
          : null,
        effectiveVerbCount: effectiveVerbCount(after),
      }),
    );
    return EXIT.OK;
  }

  if (set) {
    io.out(`Applied ${set.emoji} ${set.name} (${set.verbs.length} verbs, ${options.mode})`);
    io.out(`  ${set.verbs[0]}...`);
  } else {
    io.out(`Removed spinnerVerbs - back to Claude Code's ${DEFAULT_VERB_COUNT} built-in verbs`);
  }
  io.out(`  settings: ${outcome.path}`);
  if (backupPath) io.out(`  backup:   ${backupPath}`);
  io.out("");
  io.out("Restart Claude Code, or start a new session, to see it.");
  return EXIT.OK;
}

export async function runCommand(options: Options, deps: CommandDeps): Promise<number> {
  const { registry, io, skipped } = deps;

  if (skipped.length > 0 && !options.json) {
    io.err(`ccverbs: skipped ${skipped.length} malformed set(s): ${skipped.join(", ")}`);
  }

  switch (options.command) {
    case "list":
      return listLike(registry.sets, registry, options, io);

    case "search":
      return listLike(searchSets(registry.sets, options.arg ?? ""), registry, options, io);

    case "show": {
      const set = findSet(registry.sets, options.arg ?? "");
      if (!set) {
        return fail(io, options.json, "set-not-found", `no verb set "${options.arg}"`, EXIT.NOT_FOUND);
      }
      if (options.json) {
        io.out(JSON.stringify({ ok: true, set }));
        return EXIT.OK;
      }
      io.out(`${set.emoji} ${set.name}  (${set.id})`);
      io.out(`${set.description}`);
      io.out(`${set.language} - ${set.category} - ${set.tags.join(", ") || "no tags"}`);
      if (set.author) io.out(`by ${set.author.name}`);
      if (set.source) io.out(`${set.source}`);
      io.out("");
      for (const verb of set.verbs) io.out(`  ${verb}...`);
      io.out("");
      io.out(`${set.verbs.length} verbs`);
      return EXIT.OK;
    }

    case "set": {
      const set = findSet(registry.sets, options.arg ?? "");
      if (!set) {
        return fail(io, options.json, "set-not-found", `no verb set "${options.arg}"`, EXIT.NOT_FOUND);
      }
      return applyOrPreview(options, deps, set, { mode: options.mode, verbs: set.verbs });
    }

    case "random": {
      let set: VerbSet;
      try {
        set = pickRandom(registry.sets, deps.random);
      } catch (error) {
        return fail(io, options.json, "no-sets", (error as Error).message, EXIT.ERROR);
      }
      return applyOrPreview(options, deps, set, { mode: options.mode, verbs: set.verbs });
    }

    case "reset":
      return applyOrPreview(options, deps, null, null);

    case "current": {
      const path = resolveSettingsPath(options.scope, deps.cwd, deps.home);
      let file;
      try {
        file = readSettings(path);
      } catch (error) {
        return fail(io, options.json, "unreadable-settings", (error as Error).message, EXIT.ERROR);
      }
      const spinnerVerbs = readSpinnerVerbs(file.data);
      const matched = matchSet(spinnerVerbs, registry.sets);

      if (options.json) {
        io.out(
          JSON.stringify({
            ok: true,
            settingsPath: path,
            settingsExists: file.existed,
            configured: spinnerVerbs !== null,
            spinnerVerbs,
            matchedSet: matched ? summary(matched) : null,
            effectiveVerbCount: effectiveVerbCount(spinnerVerbs),
            defaultVerbCount: DEFAULT_VERB_COUNT,
          }),
        );
        return EXIT.OK;
      }

      io.out(path);
      if (!spinnerVerbs) {
        io.out(`spinnerVerbs is not set - Claude Code uses its ${DEFAULT_VERB_COUNT} built-in verbs.`);
        return EXIT.OK;
      }
      io.out(
        matched
          ? `${matched.emoji} ${matched.name} (${matched.id})`
          : "a custom verb list (no matching set in the registry)",
      );
      io.out(`mode: ${spinnerVerbs.mode}  verbs: ${spinnerVerbs.verbs.length}`);
      io.out(`Claude Code will pick from ${effectiveVerbCount(spinnerVerbs)} verbs.`);
      for (const verb of spinnerVerbs.verbs.slice(0, 3)) io.out(`  ${verb}...`);
      if (spinnerVerbs.verbs.length > 3) io.out(`  ... and ${spinnerVerbs.verbs.length - 3} more`);
      return EXIT.OK;
    }

    default:
      return fail(io, options.json, "unsupported", `cannot run ${options.command}`, EXIT.USAGE);
  }
}
