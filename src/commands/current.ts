import type { Options } from "../args.js";
import { DEFAULT_VERB_COUNT, EXIT } from "../constants.js";
import { localizedName } from "../registry/schema.js";
import { effectiveVerbCount, matchSet, readSpinnerVerbs } from "../settings/apply.js";
import { readSettings } from "../settings/io.js";
import { resolveSettingsPath } from "../settings/paths.js";
import { effectiveScope, fail, modeLabel, type CommandDeps } from "./io.js";

export function runCurrent(options: Options, deps: CommandDeps): number {
  const { io, t, locale } = deps;
  const path = resolveSettingsPath(effectiveScope(options, deps), deps.cwd, deps.home);

  let file;
  try {
    file = readSettings(path);
  } catch (error) {
    return fail(io, options.json, "unreadable-settings", (error as Error).message, EXIT.ERROR);
  }

  const spinnerVerbs = readSpinnerVerbs(file.data);
  const matched = matchSet(spinnerVerbs, deps.registry.sets);

  if (options.json) {
    io.out(
      JSON.stringify({
        ok: true,
        settingsPath: path,
        settingsExists: file.existed,
        configured: spinnerVerbs !== null,
        spinnerVerbs,
        matchedSet: matched
          ? {
              id: matched.id,
              name: matched.name,
              emoji: matched.emoji,
              description: matched.description,
              language: matched.language,
              category: matched.category,
              tags: matched.tags,
              count: matched.verbs.length,
            }
          : null,
        effectiveVerbCount: effectiveVerbCount(spinnerVerbs),
        defaultVerbCount: DEFAULT_VERB_COUNT,
      }),
    );
    return EXIT.OK;
  }

  io.out(path);
  if (!spinnerVerbs) {
    io.out(t.current.notConfigured(DEFAULT_VERB_COUNT));
    return EXIT.OK;
  }
  io.out(
    matched
      ? `${matched.emoji} ${localizedName(matched, locale)} (${matched.id})`
      : t.current.customList,
  );
  io.out(t.current.modeAndCount(modeLabel(t, spinnerVerbs.mode), spinnerVerbs.verbs.length));
  io.out(t.current.willPickFrom(effectiveVerbCount(spinnerVerbs)));
  for (const verb of spinnerVerbs.verbs.slice(0, 3)) io.out(`  ${verb}…`);
  if (spinnerVerbs.verbs.length > 3) io.out(`  ${t.current.andMore(spinnerVerbs.verbs.length - 3)}`);
  return EXIT.OK;
}
