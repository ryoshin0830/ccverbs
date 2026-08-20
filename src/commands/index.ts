import type { Options } from "../args.js";
import { EXIT } from "../constants.js";
import { runRandom, runReset, runSet } from "./apply.js";
import { runConfig } from "./config.js";
import { runCurrent } from "./current.js";
import { fail, type CommandDeps, type Io } from "./io.js";
import { runList, runSearch, runShow } from "./list.js";

export type { CommandDeps, Io };

export async function runCommand(options: Options, deps: CommandDeps): Promise<number> {
  const { io, t, skipped } = deps;

  if (skipped.length > 0 && !options.json) {
    io.err(`ccverbs: ${t.wizard.skippedSets(skipped.length, skipped.join(", "))}`);
  }
  if (!options.json) {
    for (const warning of deps.warnings) io.err(`ccverbs: ${warning}`);
  }

  switch (options.command) {
    case "list":
      return runList(options, deps);
    case "search":
      return runSearch(options, deps);
    case "show":
      return runShow(options, deps);
    case "set":
      return runSet(options, deps);
    case "random":
      return runRandom(options, deps);
    case "reset":
      return runReset(options, deps);
    case "current":
      return runCurrent(options, deps);
    case "config":
      return runConfig(options, deps);
    default:
      return fail(
        io,
        options.json,
        "unsupported",
        t.errors.unknownCommand(options.command),
        EXIT.USAGE,
      );
  }
}
