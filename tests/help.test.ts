import { describe, expect, it } from "vitest";
import { COMMANDS, OPTIONS } from "../src/help/model.js";
import { renderHelp } from "../src/help/render.js";
import { getCatalog } from "../src/i18n/index.js";
import { SUPPORTED_LOCALES } from "../src/i18n/locales.js";
import { layoutWidth } from "../src/registry/schema.js";

describe("help model", () => {
  it("lists every command the CLI accepts", () => {
    expect(COMMANDS.map((c) => c.name)).toEqual([
      "list", "show", "search", "set", "random", "current", "reset", "config",
    ]);
  });

  it("lists every option including the new ones", () => {
    const longs = OPTIONS.map((o) => o.long);
    for (const flag of ["mode", "scope", "lang", "json", "no-group", "help", "version"]) {
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
});
