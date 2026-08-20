import type { Options } from "../args.js";
import { DEFAULT_VERB_COUNT, EXIT } from "../constants.js";
import type { VerbSet } from "../registry/schema.js";
import { localizedName } from "../registry/schema.js";
import { pickRandom } from "../selection.js";
import {
  applySpinnerVerbs,
  effectiveVerbCount,
  readSpinnerVerbs,
  removeSpinnerVerbs,
  type SpinnerVerbs,
} from "../settings/apply.js";
import { renderDiff } from "../settings/diff.js";
import { readSettings, writeSettings } from "../settings/io.js";
import { resolveSettingsPath } from "../settings/paths.js";
import {
  effectiveMode,
  effectiveScope,
  fail,
  modeLabel,
  type CommandDeps,
} from "./io.js";

function applyOrPreview(
  options: Options,
  deps: CommandDeps,
  set: VerbSet | null,
  after: SpinnerVerbs | null,
): number {
  const { io, t, locale } = deps;
  const path = resolveSettingsPath(effectiveScope(options, deps), deps.cwd, deps.home);

  let before: SpinnerVerbs | null;
  try {
    before = readSpinnerVerbs(readSettings(path).data);
  } catch (error) {
    return fail(io, options.json, "unreadable-settings", (error as Error).message, EXIT.ERROR);
  }
  const diff = renderDiff(before, after);
  const mode = effectiveMode(options, deps);

  if (options.dryRun || !options.yes) {
    const reason = options.dryRun ? t.apply.dryRun : t.apply.needsYes;
    if (options.json) {
      io.out(
        JSON.stringify({
          ok: true,
          applied: null,
          pending: set ? { id: set.id, mode, count: set.verbs.length } : null,
          settingsPath: path,
          diff,
          reason,
        }),
      );
    } else {
      io.out(path);
      io.out(diff);
      io.out("");
      io.out(reason);
    }
    return EXIT.OK;
  }

  let backupPath: string | null;
  try {
    const file = readSettings(path);
    const data = after ? applySpinnerVerbs(file.data, after) : removeSpinnerVerbs(file.data);
    ({ backupPath } = writeSettings(path, data, {
      indent: file.indent,
      trailingNewline: file.trailingNewline,
      backup: options.backup,
    }));
  } catch (error) {
    return fail(io, options.json, "write-failed", (error as Error).message, EXIT.ERROR);
  }

  if (options.json) {
    io.out(
      JSON.stringify({
        ok: true,
        applied: set ? { id: set.id, mode, count: set.verbs.length } : null,
        removed: after === null,
        settingsPath: path,
        backupPath,
        previous: before ? { mode: before.mode, count: before.verbs.length } : null,
        effectiveVerbCount: effectiveVerbCount(after),
      }),
    );
    return EXIT.OK;
  }

  if (set) {
    io.out(
      t.wizard.appliedTitle(
        `${set.emoji} ${localizedName(set, locale)}`,
        set.verbs.length,
        modeLabel(t, mode),
      ),
    );
  } else {
    io.out(t.apply.removed(DEFAULT_VERB_COUNT));
  }
  io.out(`  ${t.wizard.settingsPath} ${path}`);
  if (backupPath) io.out(`  ${t.wizard.backupPath} ${backupPath}`);
  io.out("");
  io.out(t.wizard.restartHint);
  return EXIT.OK;
}

export function runSet(options: Options, deps: CommandDeps): number {
  const set = deps.registry.sets.find((s) => s.id === options.arg);
  if (!set) {
    return fail(
      deps.io,
      options.json,
      "set-not-found",
      deps.t.errors.setNotFound(options.arg ?? ""),
      EXIT.NOT_FOUND,
    );
  }
  return applyOrPreview(options, deps, set, {
    mode: effectiveMode(options, deps),
    verbs: set.verbs,
  });
}

export function runRandom(options: Options, deps: CommandDeps): number {
  let set: VerbSet;
  try {
    set = pickRandom(deps.registry.sets, deps.random);
  } catch {
    return fail(deps.io, options.json, "no-sets", deps.t.errors.noSets, EXIT.ERROR);
  }
  return applyOrPreview(options, deps, set, {
    mode: effectiveMode(options, deps),
    verbs: set.verbs,
  });
}

export function runReset(options: Options, deps: CommandDeps): number {
  return applyOrPreview(options, deps, null, null);
}
