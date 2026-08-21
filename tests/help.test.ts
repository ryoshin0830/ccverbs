import { describe, expect, it } from "vitest";
import { COMMANDS, OPTIONS } from "../src/help/model.js";
import { renderHelp } from "../src/help/render.js";
import { getCatalog } from "../src/i18n/index.js";
import { SUPPORTED_LOCALES } from "../src/i18n/locales.js";
import { layoutWidth } from "../src/registry/schema.js";

describe("help model", () => {
  it("lists every command the CLI accepts", () => {
    expect(COMMANDS.map((c) => c.name)).toEqual([
      "list", "show", "search", "set", "random", "current", "reset", "config", "new",
    ]);
  });

  it("lists every option including the new ones", () => {
    const longs = OPTIONS.map((o) => o.long);
    for (const flag of [
      "mode", "scope", "lang", "json", "no-group", "input", "pr", "branch", "help", "version",
    ]) {
      expect(longs).toContain(flag);
    }
  });
});

describe("renderHelp", () => {
  it.each(SUPPORTED_LOCALES)("names every command and option in %s", (locale) => {
    const out = renderHelp(getCatalog(locale));
    for (const c of COMMANDS) expect(out).toContain(c.name);
    for (const o of OPTIONS) expect(out).toContain(`--${o.long}`);
  });

  it.each(SUPPORTED_LOCALES)("aligns option descriptions in one column in %s", (locale) => {
    const out = renderHelp(getCatalog(locale));
    const rows = out.split("\n").filter((l) => /^\s+(-[a-zA-Z], |    )--[a-z-]+/.test(l));
    expect(rows.length).toBe(OPTIONS.length);
    const columns = new Set(
      rows.map((line) => {
        const desc = line.replace(/\s+$/, "");
        const idx = desc.search(/ {2}\S(?!.*? {2}\S)/);
        return layoutWidth(desc.slice(0, idx + 2));
      }),
    );
    expect(columns.size, `descriptions must share one column, got ${[...columns]}`).toBe(1);
  });

  it("keeps flag names untranslated", () => {
    expect(renderHelp(getCatalog("ja"))).toContain("--dry-run");
    expect(renderHelp(getCatalog("ko"))).toContain("--no-backup");
    expect(renderHelp(getCatalog("zh-Hant"))).toContain("--offline");
  });

  it("translates the surrounding prose", () => {
    expect(renderHelp(getCatalog("ja"))).toContain("使い方");
    expect(renderHelp(getCatalog("zh-Hans"))).toContain("用法");
  });

  it("includes the exit code line", () => {
    expect(renderHelp(getCatalog("en"))).toContain("Exit codes:");
  });

  it.each(SUPPORTED_LOCALES)("tells an agent how to drive the CLI in %s", (locale) => {
    const out = renderHelp(getCatalog(locale));
    for (const token of [
      "ccverbs list --json",
      "ccverbs show <id> --json",
      "ccverbs set <id> --json",
      "ccverbs set <id> --yes --json",
      "ccverbs current --json",
    ]) {
      expect(out, token).toContain(token);
    }
  });

  it.each(SUPPORTED_LOCALES)("tells an agent how to add a verb set in %s", (locale) => {
    const out = renderHelp(getCatalog(locale));
    for (const token of [
      "cat set.json | ccverbs new --input - --json",
      "error.issues",
      "--pr",
      "ccverbs new --help",
      "docs/ai-agents.md",
      "Create a new set",
    ]) {
      expect(out, token).toContain(token);
    }
  });

  it("puts the two agent sections between the examples and the exit codes", () => {
    const out = renderHelp(getCatalog("en"));
    const at = (heading: string) => out.indexOf(heading);
    expect(at("For AI agents:")).toBeGreaterThan(at("Examples:"));
    expect(at("Adding a verb set (for AI agents):")).toBeGreaterThan(at("For AI agents:"));
    expect(at("Adding a verb set (for AI agents):")).toBeLessThan(at("Exit codes:"));
  });

  it("translates the agent headings away from English", () => {
    for (const locale of SUPPORTED_LOCALES.filter((l) => l !== "en")) {
      expect(getCatalog(locale).help.agentsHeading).not.toBe(getCatalog("en").help.agentsHeading);
      expect(getCatalog(locale).help.contributeHeading).not.toBe(
        getCatalog("en").help.contributeHeading,
      );
    }
  });

  it("renders an agent-friendly page for ccverbs new --help", () => {
    const out = renderHelp(getCatalog("en"), "new");
    expect(out).toContain("Usage: ccverbs new --input <path|->");
    expect(out).toContain("error.issues");
    expect(out).toContain("--pr");
    expect(out).toContain("explicitly authorize");
    expect(out).toContain("cat set.json | ccverbs new --input - --json");
  });

  it("renders the command-specific page in Japanese", () => {
    const out = renderHelp(getCatalog("ja"), "new");
    expect(out).toContain("ccverbs new");
    expect(out).toContain("--input");
    expect(out).toContain("明示的");
  });
});
