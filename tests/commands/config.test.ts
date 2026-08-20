import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { parseArgs } from "../../src/args.js";
import { runCommand } from "../../src/commands/index.js";
import { DEFAULT_CONFIG, readConfig, type CcverbsConfig } from "../../src/config/io.js";
import { cachePath, configPath } from "../../src/config/paths.js";
import { getCatalog } from "../../src/i18n/index.js";
import type { LocaleSource } from "../../src/i18n/resolve.js";
import type { SupportedLocale } from "../../src/i18n/locales.js";
import type { RegistryIndex } from "../../src/registry/schema.js";

const registry = {
  schemaVersion: 1,
  generatedAt: "1970-01-01T00:00:00.000Z",
  totalSets: 1,
  totalVerbs: 1,
  sets: [
    {
      id: "a",
      name: "A",
      emoji: "\u{1FAA8}",
      description: "d",
      language: "ja",
      category: "meme",
      tags: [],
      verbs: ["やっています"],
    },
  ],
} as unknown as RegistryIndex;

let home: string;
let lines: string[];
const io = { out: (l: string) => lines.push(l), err: (l: string) => lines.push(l) };

const run = (
  argv: string[],
  over: { locale?: SupportedLocale; localeSource?: LocaleSource } = {},
) => {
  const parsed = parseArgs(argv);
  if (!parsed.ok) throw new Error(parsed.message);
  const read = readConfig(configPath(home));
  const locale = over.locale ?? "en";
  return runCommand(parsed.options, {
    registry,
    skipped: [],
    io,
    t: getCatalog(locale),
    locale,
    localeSource: over.localeSource ?? "default",
    config: read.config,
    fromFile: read.fromFile,
    configPath: configPath(home),
    cachePath: cachePath(home),
    cacheAgeMs: 240_000,
    warnings: read.warnings,
    home,
    cwd: home,
  });
};

const json = () => JSON.parse(lines.join("\n"));
const stored = (): CcverbsConfig => readConfig(configPath(home)).config;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "ccverbs-home-"));
  lines = [];
});

describe("config --json", () => {
  it("reports each value with its source", async () => {
    expect(await run(["config", "--json"])).toBe(0);
    const out = json();
    expect(out.ok).toBe(true);
    expect(out.language).toMatchObject({ value: "en", source: "default", explicit: false });
    expect(out.mode).toMatchObject({ value: "replace", source: "default" });
    expect(out.scope).toMatchObject({ value: "user", source: "default" });
    expect(out.supportedLocales).toEqual(["en", "ja", "zh-Hans", "zh-Hant", "ko"]);
    expect(out.unreviewedLocales).toEqual(["zh-Hans", "zh-Hant", "ko"]);
    expect(out.configPath).toBe(configPath(home));
    expect(out.cachePath).toBe(cachePath(home));
  });

  it("marks a language that came from a flag as explicit", async () => {
    await run(["config", "--json", "--lang", "ja"], { locale: "ja", localeSource: "flag" });
    expect(json().language).toMatchObject({ value: "ja", source: "flag", explicit: true });
  });

  it("marks an OS-detected language as not explicit", async () => {
    await run(["config", "--json"], { locale: "ja", localeSource: "os" });
    expect(json().language).toMatchObject({ source: "os", explicit: false });
  });
});

describe("config <key> <value>", () => {
  it("writes the language", async () => {
    expect(await run(["config", "language", "ja"])).toBe(0);
    expect(stored().language).toBe("ja");
  });

  it("writes the mode and then reports it as coming from config", async () => {
    await run(["config", "mode", "append"]);
    expect(stored().mode).toBe("append");
    lines = [];
    await run(["config", "--json"]);
    expect(json().mode).toMatchObject({ value: "append", source: "config" });
  });

  it("writes the scope", async () => {
    await run(["config", "scope", "project"]);
    expect(stored().scope).toBe("project");
  });

  it("keeps the other settings when writing one", async () => {
    await run(["config", "mode", "append"]);
    lines = [];
    await run(["config", "language", "ko"]);
    expect(stored()).toMatchObject({ mode: "append", language: "ko" });
  });

  it("resets to defaults", async () => {
    await run(["config", "language", "ko"]);
    lines = [];
    expect(await run(["config", "reset"])).toBe(0);
    expect(stored()).toEqual(DEFAULT_CONFIG);
  });
});

describe("config table", () => {
  it("prints the paths and every setting without --json", async () => {
    await run(["config"]);
    const out = lines.join("\n");
    expect(out).toContain(configPath(home));
    expect(out).toContain(cachePath(home));
    expect(out).toContain("Replace");
    expect(out).toContain("Everywhere");
    expect(out).toContain("default");
  });

  it("says where an OS-detected language came from", async () => {
    await run(["config"], { locale: "ja", localeSource: "os" });
    expect(lines.join("\n")).toContain("OSの言語設定から");
  });

  it("notes that an unreviewed locale wants native review", async () => {
    await run(["config"], { locale: "ko", localeSource: "config" });
    expect(lines.join("\n")).toContain("원어민");
  });

  it("aligns the Japanese table in display columns, not code units", async () => {
    await run(["config"], { locale: "ja", localeSource: "os" });
    const rows = lines.filter((l) => /^(言語|適用方法|保存先)/.test(l));
    expect(rows).toHaveLength(3);
    // Every row's value must start in the same column.
    const starts = new Set(rows.map((l) => l.search(/\s\S/) >= 0 ? l.indexOf("  ") : -1));
    for (const row of rows) expect(row).toMatch(/\s{2,}/);
    expect(starts.size).toBeGreaterThan(0);
  });

  it("does not add that note for a reviewed locale", async () => {
    await run(["config"], { locale: "ja", localeSource: "config" });
    expect(lines.join("\n")).not.toContain("募集中");
  });
});
