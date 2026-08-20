import { SUPPORTED_LOCALES } from "./i18n/locales.js";
import type { Scope } from "./settings/paths.js";

export type Command =
  | "tui"
  | "list"
  | "show"
  | "search"
  | "set"
  | "random"
  | "current"
  | "reset"
  | "config"
  | "new"
  | "help"
  | "version";

export interface Options {
  command: Command;
  arg?: string;
  input?: string;
  pr: boolean;
  branch?: string;
  /** undefined means "use the configured value". */
  mode?: "replace" | "append";
  /** undefined means "use the configured value". */
  scope?: Scope;
  lang?: string;
  json: boolean;
  yes: boolean;
  dryRun: boolean;
  backup: boolean;
  refresh: boolean;
  offline: boolean;
  group: boolean;
  configKey?: string;
  configValue?: string;
}

export type ParseResult =
  | { ok: true; options: Options }
  | { ok: false; message: string };

const COMMANDS = new Set<string>([
  "list",
  "show",
  "search",
  "set",
  "random",
  "current",
  "reset",
  "config",
  "new",
]);
const NEEDS_ARG = new Set<Command>(["show", "search", "set"]);

const MODES = ["replace", "append"] as const;
const SCOPES = ["user", "project", "local"] as const;

const CONFIG_KEYS = ["language", "mode", "scope", "reset"] as const;
const CONFIG_VALUES: Record<string, readonly string[]> = {
  language: ["auto", ...SUPPORTED_LOCALES],
  mode: MODES,
  scope: SCOPES,
};

const list = (values: readonly string[]) => values.join(", ");

export function parseArgs(argv: string[]): ParseResult {
  const options: Options = {
    command: "tui",
    pr: false,
    json: false,
    yes: false,
    dryRun: false,
    backup: true,
    refresh: false,
    offline: false,
    group: true,
  };

  const bare: string[] = [];
  let wantHelp = false;
  let wantVersion = false;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i] as string;

    if (!token.startsWith("-")) {
      bare.push(token);
      continue;
    }

    const eq = token.indexOf("=");
    const flag = eq === -1 ? token : token.slice(0, eq);
    const inlineValue = eq === -1 ? undefined : token.slice(eq + 1);
    const takeValue = (): string | undefined => {
      if (inlineValue !== undefined) return inlineValue;
      i += 1;
      return argv[i];
    };

    switch (flag) {
      case "-h":
      case "--help":
        wantHelp = true;
        break;
      case "-v":
      case "--version":
        wantVersion = true;
        break;
      case "--json":
        options.json = true;
        break;
      case "-y":
      case "--yes":
        options.yes = true;
        break;
      case "-n":
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--no-backup":
        options.backup = false;
        break;
      case "--refresh":
        options.refresh = true;
        break;
      case "--offline":
        options.offline = true;
        break;
      case "--no-group":
        options.group = false;
        break;
      case "--input": {
        const value = takeValue();
        if (value === undefined || value === "") {
          return { ok: false, message: "--input needs a path or -" };
        }
        options.input = value;
        break;
      }
      case "--pr":
        options.pr = true;
        break;
      case "--branch": {
        const value = takeValue();
        if (!value || !/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value) || value.includes("..")) {
          return { ok: false, message: `--branch must be a safe branch name, got ${value ?? "nothing"}` };
        }
        options.branch = value;
        break;
      }
      case "-m":
      case "--mode": {
        const value = takeValue();
        if (!value || !(MODES as readonly string[]).includes(value)) {
          return {
            ok: false,
            message: `--mode must be one of ${list(MODES)}, got ${value ?? "nothing"}`,
          };
        }
        options.mode = value as Options["mode"];
        break;
      }
      case "-S":
      case "--scope": {
        const value = takeValue();
        if (!value || !(SCOPES as readonly string[]).includes(value)) {
          return {
            ok: false,
            message: `--scope must be one of ${list(SCOPES)}, got ${value ?? "nothing"}`,
          };
        }
        options.scope = value as Scope;
        break;
      }
      case "--lang": {
        const value = takeValue();
        const allowed = SUPPORTED_LOCALES as readonly string[];
        if (!value || !allowed.includes(value)) {
          return {
            ok: false,
            message: `--lang must be one of ${list(allowed)}, got ${value ?? "nothing"}`,
          };
        }
        options.lang = value;
        break;
      }
      default:
        return { ok: false, message: `unknown option ${flag}` };
    }
  }

  if (wantHelp) return { ok: true, options: { ...options, command: "help" } };
  if (wantVersion) return { ok: true, options: { ...options, command: "version" } };

  if (bare.length > 0) {
    const command = bare[0] as string;
    if (!COMMANDS.has(command)) {
      return { ok: false, message: `unknown command ${command}` };
    }
    options.command = command as Command;

    // `config` takes two extra words, ordinary commands one, and `new` none.
    const maxExtra = command === "config" ? 2 : command === "new" ? 0 : 1;
    if (bare.length > 1 + maxExtra) {
      return { ok: false, message: `unexpected argument ${bare[1 + maxExtra]}` };
    }

    if (command === "config") {
      const key = bare[1];
      const value = bare[2];
      if (key !== undefined) {
        if (!(CONFIG_KEYS as readonly string[]).includes(key)) {
          return {
            ok: false,
            message: `unknown setting "${key}"; expected one of ${list(CONFIG_KEYS)}`,
          };
        }
        options.configKey = key;
        if (key === "reset") {
          if (value !== undefined) {
            return { ok: false, message: `unexpected argument ${value}` };
          }
        } else {
          const allowed = CONFIG_VALUES[key] as readonly string[];
          if (value === undefined) {
            return { ok: false, message: `${key} needs a value: one of ${list(allowed)}` };
          }
          if (!allowed.includes(value)) {
            return {
              ok: false,
              message: `${key} must be one of ${list(allowed)}, got ${value}`,
            };
          }
          options.configValue = value;
        }
      }
    } else if (command !== "new" && bare[1] !== undefined) {
      options.arg = bare[1];
    }
  }

  if (NEEDS_ARG.has(options.command) && !options.arg) {
    const what = options.command === "search" ? "query" : "set id";
    return { ok: false, message: `${options.command} requires a ${what}` };
  }

  if (options.offline && options.refresh) {
    return { ok: false, message: "--offline and --refresh cannot be combined" };
  }

  if (options.command === "new" && options.input === undefined) {
    return { ok: false, message: "new requires --input <path|->" };
  }
  if (
    options.command !== "new" &&
    (options.input !== undefined || options.pr || options.branch !== undefined)
  ) {
    return { ok: false, message: "--input, --pr, and --branch are only valid with new" };
  }

  return { ok: true, options };
}
