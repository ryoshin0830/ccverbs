import { DEFAULT_VERB_COUNT } from "../constants.js";
import type { CommandName, OptionName } from "../help/model.js";

/**
 * The English catalog. This object's shape IS the Catalog type, so adding a key
 * here makes every other locale fail to compile until it is translated.
 *
 * Values that interpolate are functions rather than templates with
 * placeholders. That removes the need for a plural library and lets each
 * language count in its own way.
 *
 * Do not add `as const` to the outer object: it would freeze every string into
 * a literal type and force the other catalogs to repeat the English text.
 */
export const en = {
  meta: {
    name: "English",
    nativeName: "English",
    reviewed: true,
  },

  common: {
    appName: "ccverbs",
    verbCount: (n: number) => `${n} verb${n === 1 ? "" : "s"}`,
    setCount: (n: number) => `${n} set${n === 1 ? "" : "s"}`,
    registrySummary: (sets: number, verbs: number) =>
      `${sets} sets · ${verbs} verbs · Claude Code ships ${DEFAULT_VERB_COUNT}`,
    yesNo: "(Y/n)",
    minutesAgo: (n: number) => `${n}m ago`,
    justNow: "just now",
    never: "not fetched yet",
  },

  wizard: {
    searchLabel: "Search:",
    randomRow: "Random",
    randomHint: "pick one set at random",
    noMatches: "No sets matched.",
    footerSet: "up/down move · enter select · type to search · esc quit",
    footerChoice: "up/down move · enter select · esc back",
    footerConfirm: "y apply · n back · esc back",
    pickHint: "Pick a set to preview it.",
    applyTitle: (name: string) => `Applying ${name}`,
    modeLabel: "Mode",
    scopeLabel: "Saves to",
    applyQuestion: "Apply?",
    changeSettings: "change these with: ccverbs config",
    willPickFrom: (n: number) => `Claude Code will pick from ${n} verbs.`,
    appliedTitle: (name: string, n: number, mode: string) =>
      `Applied ${name} — ${n} verbs, ${mode}`,
    settingsPath: "settings:",
    backupPath: "backup:",
    restartHint: "Start a new Claude Code session to see it.",
    anyKeyToExit: "Press any key to exit.",
    skippedSets: (n: number, ids: string) => `skipped ${n} malformed set(s): ${ids}`,
    andMore: (n: number) => `... and ${n} more`,
  },

  modes: {
    replace: "Replace",
    replaceHint: (n: number) => `use only this set's ${n} verbs`,
    append: "Append",
    appendHint: (base: number, add: number) =>
      `Claude Code's ${base} plus these ${add} = ${base + add}`,
  },

  scopes: {
    user: "Everywhere",
    project: "This project",
    local: "This project, local only",
    localNote: "not committed to git",
  },

  list: {
    totals: (sets: number, verbs: number) =>
      `${sets} sets, ${verbs} verbs. Claude Code ships ${DEFAULT_VERB_COUNT}.`,
    noneMatched: "No verb sets matched.",
    byAuthor: (name: string) => `by ${name}`,
    verbTotal: (n: number) => `${n} verbs`,
    noTags: "no tags",
    otherLanguages: "other languages",
  },

  apply: {
    removed: (n: number) =>
      `Removed spinnerVerbs — back to Claude Code's ${n} built-in verbs`,
    dryRun: "Dry run — nothing written.",
    needsYes: "Re-run with --yes to apply.",
  },

  current: {
    notConfigured: (n: number) =>
      `spinnerVerbs is not set — Claude Code uses its ${n} built-in verbs.`,
    customList: "a custom verb list (no matching set in the registry)",
    modeAndCount: (mode: string, n: number) => `mode: ${mode}  verbs: ${n}`,
    willPickFrom: (n: number) => `Claude Code will pick from ${n} verbs.`,
    andMore: (n: number) => `... and ${n} more`,
  },

  config: {
    title: "ccverbs settings",
    language: "Language",
    mode: "Mode",
    scope: "Saves to",
    resetRow: "Restore defaults",
    footerList: "up/down move · enter change · esc quit",
    auto: "Automatic",
    autoDetected: (name: string, source: string) => `detected: ${name} (${source})`,
    unreviewed: "wanted: native-speaker review",
    configLabel: "config",
    cacheLabel: "cache",
    saveFailed: (message: string) => `could not save settings: ${message}`,
    sourceFlag: "from --lang",
    sourceEnv: "from CCVERBS_LANG",
    sourceConfig: "from your settings",
    sourcePosixEnv: "from the LANG environment variable",
    sourceOs: "from your operating system's language setting",
    sourceIntl: "from the runtime locale",
    sourceDefault: "default",
    unreviewedNotice: (name: string) =>
      `${name} has not been reviewed by a native speaker — corrections welcome at https://github.com/ryoshin0830/ccverbs`,
  },

  errors: {
    setNotFound: (id: string) => `no verb set "${id}"`,
    registryUnavailable: (message: string) =>
      `could not reach the verb set registry: ${message}`,
    registryHint: "verb sets are fetched from GitHub; check your connection and retry.",
    noTty: "no TTY available for the interactive UI; use a one-shot command instead.",
    unknownCommand: (name: string) => `unknown command ${name}`,
    unknownOption: (name: string) => `unknown option ${name}`,
    unexpectedArgument: (name: string) => `unexpected argument ${name}`,
    invalidValue: (flag: string, allowed: string, got: string) =>
      `${flag} must be one of ${allowed}, got ${got}`,
    requiresArgument: (command: string, what: string) => `${command} requires a ${what}`,
    exclusiveOptions: (a: string, b: string) => `${a} and ${b} cannot be combined`,
    unknownConfigKey: (key: string, allowed: string) =>
      `unknown setting "${key}"; expected one of ${allowed}`,
    configNeedsValue: (key: string, allowed: string) =>
      `${key} needs a value: one of ${allowed}`,
    writeFailed: (message: string) => `could not write: ${message}`,
    noSets: "no verb sets available",
    setId: "set id",
    query: "query",
  },

  help: {
    tagline: "swap Claude Code's spinner verbs",
    usage: "Usage: ccverbs [command] [options]",
    defaultLine: "Launch the interactive picker (default)",
    commandsHeading: "Commands:",
    optionsHeading: "Options:",
    examplesHeading: "Examples:",
    exitCodes:
      "Exit codes: 0 ok, 1 runtime error, 2 usage error, 3 set not found, 4 registry unavailable",
    footer: "Verb sets live at https://github.com/ryoshin0830/ccverbs — PRs welcome.",
    commands: {
      list: "List all verb sets",
      show: "Print every verb in a set",
      search: "Search sets by id, name, description, tags",
      set: "Apply a set to Claude Code settings",
      random: "Pick one random set and apply it",
      current: "Show the currently applied configuration",
      reset: `Remove spinnerVerbs (restore the ${DEFAULT_VERB_COUNT} defaults)`,
      config: "Show or change settings (language, mode, scope)",
      new: "Validate a set JSON and optionally open a pull request",
    } satisfies Record<CommandName, string>,
    options: {
      mode: "Override the configured mode for this run",
      scope: "Override the configured scope for this run",
      lang: "Override the UI language for this run",
      json: "Machine-readable output",
      yes: "Skip the confirmation prompt",
      "dry-run": "Print the diff, write nothing",
      "no-backup": "Do not create a .ccverbs.bak file",
      refresh: "No effect — fetching fresh is the default",
      offline: "Use the last fetched copy, never hit the network",
      "no-group": "Do not group the list by language",
      input: "Read set JSON from a file or stdin (-)",
      pr: "Open a pull request after validation",
      branch: "Branch name for the pull request",
      help: "Show this help",
      version: "Show the version",
    } satisfies Record<OptionName, string>,
    examples: [
      { cmd: "ccverbs", text: "Browse and pick a set" },
      { cmd: "ccverbs config", text: "Change language, mode, or scope" },
      { cmd: "ccverbs list --json", text: "Every set with its verb count" },
      { cmd: "ccverbs set git-commands --yes", text: "Apply without confirmation" },
      { cmd: "ccverbs random --yes", text: "Surprise me" },
      { cmd: "ccverbs current --json", text: "What is applied right now" },
      { cmd: "ccverbs reset --yes", text: "Back to Claude Code's own verbs" },
    ],
  },
};

export type Catalog = typeof en;
