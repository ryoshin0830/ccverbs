import { parseArgs } from "./args.js";
import { runCommand } from "./commands/index.js";
import type { CommandDeps } from "./commands/io.js";
import { readConfig } from "./config/io.js";
import { migrateCache } from "./config/migrate.js";
import { cachePath, configPath } from "./config/paths.js";
import { EXIT } from "./constants.js";
import { renderHelp } from "./help/render.js";
import { getCatalog } from "./i18n/index.js";
import { resolveLocale } from "./i18n/resolve.js";
import { runNew } from "./commands/new.js";
import { RegistryError, loadRegistry } from "./registry/index.js";
import { readCache } from "./registry/cache.js";

const io = {
  out: (line: string) => process.stdout.write(`${line}\n`),
  err: (line: string) => process.stderr.write(`${line}\n`),
};

const parsed = parseArgs(process.argv.slice(2));

// The config file and locale are read before anything can fail, so that even a
// usage error or an unreachable registry is reported in the user's language.
migrateCache();
const configFile = configPath();
const { config, warnings, fromFile } = readConfig(configFile);
const { locale, source: localeSource } = resolveLocale({
  flagLang: parsed.ok ? parsed.options.lang : undefined,
  configLanguage: config.language,
});
const t = getCatalog(locale);

if (!parsed.ok) {
  io.err(`ccverbs: ${parsed.message}`);
  io.err("");
  io.err(renderHelp(t));
  process.exit(EXIT.USAGE);
}

const options = parsed.options;

if (options.command === "help") {
  io.out(renderHelp(t));
  process.exit(EXIT.OK);
}

if (options.command === "version") {
  io.out(__CCVERBS_VERSION__);
  process.exit(EXIT.OK);
}

// Creating a set is local validation plus an optional explicit PR workflow; it
// does not need the live registry and should still work while the index is down.
if (options.command === "new") {
  process.exit(runNew(options, { io, t }));
}

const cacheFile = cachePath();
const cached = readCache(cacheFile);
const baseDeps = {
  io,
  t,
  locale,
  localeSource,
  config,
  fromFile,
  configPath: configFile,
  cachePath: cacheFile,
  cacheAgeMs: cached ? Math.round(cached.ageMs) : null,
  warnings,
} satisfies Partial<CommandDeps>;

// `config` with no key is the settings screen; --json, an explicit key, and a
// non-TTY all fall through to the one-shot path.
const wantsConfigTui =
  options.command === "config" && !options.configKey && !options.json && process.stdout.isTTY;

if (wantsConfigTui) {
  const { startConfigTui } = await import("./ui/start.js");
  process.exit(await startConfigTui({ ...baseDeps }));
}

if (options.command === "tui" && !process.stdout.isTTY) {
  io.err(`ccverbs: ${t.errors.noTty}`);
  io.err("");
  io.err(renderHelp(t));
  process.exit(EXIT.USAGE);
}

try {
  const { index, skipped } = await loadRegistry({
    refresh: options.refresh,
    offline: options.offline,
  });

  if (options.command === "tui") {
    const { startTui } = await import("./ui/start.js");
    process.exit(await startTui({ ...baseDeps, registry: index, skipped }));
  }

  process.exit(await runCommand(options, { ...baseDeps, registry: index, skipped }));
} catch (error) {
  if (error instanceof RegistryError) {
    io.err(`ccverbs: ${t.errors.registryUnavailable(error.message)}`);
    if (error.code === "registry-unavailable") io.err(`ccverbs: ${t.errors.registryHint}`);
    process.exit(EXIT.REGISTRY);
  }
  io.err(`ccverbs: ${(error as Error).message}`);
  process.exit(EXIT.ERROR);
}
