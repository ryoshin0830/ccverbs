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
  | "help"
  | "version";

export interface Options {
  command: Command;
  arg?: string;
  mode: "replace" | "append";
  scope: Scope;
  json: boolean;
  yes: boolean;
  dryRun: boolean;
  backup: boolean;
  refresh: boolean;
  offline: boolean;
}

export const HELP = `ccverbs - swap Claude Code's spinner verbs

Usage: ccverbs [command] [options]

  ccverbs                        Launch the interactive TUI (default)

Commands:
  list                           List all verb sets
  show <id>                      Print every verb in a set
  search <query>                 Search sets by id, name, description, tags
  set <id>                       Apply a set to Claude Code settings
  random                         Pick one random set and apply it
  current                        Show the currently applied configuration
  reset                          Remove spinnerVerbs (restore the 186 defaults)

Options:
  -m, --mode <replace|append>       Default: replace
  -S, --scope <user|project|local>  Default: user
      --json                        Machine-readable output
  -y, --yes                         Skip the confirmation prompt
  -n, --dry-run                     Print the diff, write nothing
      --no-backup                   Do not create a .ccverbs.bak file
      --refresh                     Ignore the cache and refetch
      --offline                     Use the cache only, never hit the network
  -h, --help                        Show this help
  -v, --version                     Show the version

Examples:
  ccverbs                                  Browse and pick a set interactively
  ccverbs list --json                      Every set with its verb count
  ccverbs set git-commands --yes           Apply a set without confirmation
  ccverbs random --yes                     Surprise me
  ccverbs current --json                   What is applied right now
  ccverbs reset --yes                      Back to Claude Code's own verbs

Scopes:
  user      ~/.claude/settings.json            (default)
  project   ./.claude/settings.json
  local     ./.claude/settings.local.json

Exit codes: 0 ok, 1 runtime error, 2 usage error, 3 set not found,
            4 registry unavailable

Verb sets live at https://github.com/ryoshin0830/ccverbs - PRs welcome.
`;

const COMMANDS = new Set<string>([
  "list",
  "show",
  "search",
  "set",
  "random",
  "current",
  "reset",
]);
const NEEDS_ARG = new Set<Command>(["show", "search", "set"]);
const MODES = new Set(["replace", "append"]);
const SCOPES = new Set(["user", "project", "local"]);

export type ParseResult =
  | { ok: true; options: Options }
  | { ok: false; message: string };

export function parseArgs(argv: string[]): ParseResult {
  const options: Options = {
    command: "tui",
    mode: "replace",
    scope: "user",
    json: false,
    yes: false,
    dryRun: false,
    backup: true,
    refresh: false,
    offline: false,
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
      case "-m":
      case "--mode": {
        const value = takeValue();
        if (!value || !MODES.has(value)) {
          return {
            ok: false,
            message: `--mode must be replace or append, got ${value ?? "nothing"}`,
          };
        }
        options.mode = value as Options["mode"];
        break;
      }
      case "-S":
      case "--scope": {
        const value = takeValue();
        if (!value || !SCOPES.has(value)) {
          return {
            ok: false,
            message: `--scope must be user, project, or local, got ${value ?? "nothing"}`,
          };
        }
        options.scope = value as Scope;
        break;
      }
      default:
        return { ok: false, message: `unknown option ${flag}` };
    }
  }

  if (wantHelp) return { ok: true, options: { ...options, command: "help" } };
  if (wantVersion) return { ok: true, options: { ...options, command: "version" } };

  if (bare.length > 0) {
    const [command, arg, ...extra] = bare as [string, string | undefined, ...string[]];
    if (!COMMANDS.has(command)) {
      return { ok: false, message: `unknown command ${command}` };
    }
    if (extra.length > 0) {
      return { ok: false, message: `unexpected argument ${extra[0]}` };
    }
    options.command = command as Command;
    if (arg !== undefined) options.arg = arg;
  }

  if (NEEDS_ARG.has(options.command) && !options.arg) {
    const what = options.command === "search" ? "query" : "set id";
    return { ok: false, message: `${options.command} requires a ${what}` };
  }

  if (options.offline && options.refresh) {
    return { ok: false, message: "--offline and --refresh cannot be combined" };
  }

  return { ok: true, options };
}
