import { HELP, parseArgs } from "./args.js";
import { runCommand } from "./commands/index.js";
import { EXIT } from "./constants.js";
import { RegistryError, loadRegistry } from "./registry/index.js";

const io = {
  out: (line: string) => process.stdout.write(`${line}\n`),
  err: (line: string) => process.stderr.write(`${line}\n`),
};

const parsed = parseArgs(process.argv.slice(2));
if (!parsed.ok) {
  io.err(`ccverbs: ${parsed.message}`);
  io.err("");
  io.err(HELP);
  process.exit(EXIT.USAGE);
}

const options = parsed.options;

if (options.command === "help") {
  io.out(HELP);
  process.exit(EXIT.OK);
}

if (options.command === "version") {
  io.out(__CCVERBS_VERSION__);
  process.exit(EXIT.OK);
}

if (options.command === "tui" && !process.stdout.isTTY) {
  io.err("ccverbs: no TTY available for the interactive UI; use a one-shot command instead.");
  io.err("");
  io.err(HELP);
  process.exit(EXIT.USAGE);
}

try {
  const { index, skipped } = await loadRegistry({
    refresh: options.refresh,
    offline: options.offline,
  });

  if (options.command === "tui") {
    const { startTui } = await import("./ui/start.js");
    process.exit(await startTui(index, skipped, options));
  }

  process.exit(await runCommand(options, { registry: index, skipped, io }));
} catch (error) {
  if (error instanceof RegistryError) {
    io.err(`ccverbs: ${error.message}`);
    if (error.code === "registry-unavailable") {
      io.err("ccverbs: verb sets are fetched from GitHub; check your connection and retry.");
    }
    process.exit(EXIT.REGISTRY);
  }
  io.err(`ccverbs: ${(error as Error).message}`);
  process.exit(EXIT.ERROR);
}
