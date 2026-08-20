import type { Catalog } from "../i18n/en.js";
import { layoutWidth } from "../registry/schema.js";
import { COMMANDS, OPTIONS, type HelpCommand } from "./model.js";

const INDENT = "  ";
const GAP = 2;

function pad(text: string, width: number): string {
  return text + " ".repeat(Math.max(0, width - layoutWidth(text)));
}

/** One aligned two-column block. Widths are measured, never hand-counted. */
function table(rows: { left: string; right: string }[]): string[] {
  const width = Math.max(...rows.map((r) => layoutWidth(r.left)));
  return rows.map((r) => `${INDENT}${pad(r.left, width + GAP)}${r.right}`);
}

function commandLeft(c: (typeof COMMANDS)[number]): string {
  return "arg" in c && c.arg ? `${c.name} <${c.arg}>` : c.name;
}

function optionLeft(o: (typeof OPTIONS)[number]): string {
  const short = "short" in o && o.short ? `-${o.short}, ` : "    ";
  const value = "value" in o && o.value ? ` <${o.value}>` : "";
  return `${short}--${o.long}${value}`;
}

export function renderHelp(t: Catalog, command?: HelpCommand): string {
  if (command === "new") return renderNewHelp(t);

  return [
    `${t.common.appName} - ${t.help.tagline}`,
    "",
    t.help.usage,
    "",
    `${INDENT}${pad(t.common.appName, 24)}${t.help.defaultLine}`,
    "",
    t.help.commandsHeading,
    ...table(COMMANDS.map((c) => ({ left: commandLeft(c), right: t.help.commands[c.name] }))),
    "",
    t.help.optionsHeading,
    ...table(OPTIONS.map((o) => ({ left: optionLeft(o), right: t.help.options[o.long] }))),
    "",
    t.help.examplesHeading,
    ...table(t.help.examples.map((e) => ({ left: e.cmd, right: e.text }))),
    "",
    t.help.exitCodes,
    "",
    t.help.footer,
    "",
  ].join("\n");
}

function renderNewHelp(t: Catalog): string {
  const help = t.help.new;
  const examples = help.examples.map((e) => `  ${e.cmd}\n      ${e.text}`);

  return [
    help.title,
    "",
    help.usage,
    "",
    help.description,
    "",
    help.inputHeading,
    help.input,
    "",
    help.inputExample,
    "",
    help.workflowHeading,
    ...help.workflow.map((line) => `  ${line}`),
    "",
    help.outputHeading,
    ...help.output.map((line) => `  ${line}`),
    "",
    help.safetyHeading,
    ...help.safety.map((line) => `  ${line}`),
    "",
    help.examplesHeading,
    ...examples,
    "",
    help.footer,
    "",
  ].join("\n");
}
