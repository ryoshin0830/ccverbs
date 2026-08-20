export const COMMANDS = [
  { name: "list" },
  { name: "show", arg: "id" },
  { name: "search", arg: "query" },
  { name: "set", arg: "id" },
  { name: "random" },
  { name: "current" },
  { name: "reset" },
  { name: "config", arg: "key value" },
] as const;

export const OPTIONS = [
  { short: "m", long: "mode", value: "replace|append" },
  { short: "S", long: "scope", value: "user|project|local" },
  { long: "lang", value: "code" },
  { long: "json" },
  { short: "y", long: "yes" },
  { short: "n", long: "dry-run" },
  { long: "no-backup" },
  { long: "refresh" },
  { long: "offline" },
  { long: "no-group" },
  { short: "h", long: "help" },
  { short: "v", long: "version" },
] as const;

export type CommandName = (typeof COMMANDS)[number]["name"];
export type OptionName = (typeof OPTIONS)[number]["long"];
