import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readSettings, writeSettings } from "../../src/settings/io.js";
import { resolveSettingsPath } from "../../src/settings/paths.js";

const dir = () => mkdtempSync(join(tmpdir(), "ccverbs-"));

describe("resolveSettingsPath", () => {
  it("maps user scope to the home settings file", () => {
    expect(resolveSettingsPath("user", "/w", "/h")).toBe("/h/.claude/settings.json");
  });
  it("maps project scope to the cwd settings file", () => {
    expect(resolveSettingsPath("project", "/w", "/h")).toBe("/w/.claude/settings.json");
  });
  it("maps local scope to the cwd local settings file", () => {
    expect(resolveSettingsPath("local", "/w", "/h")).toBe("/w/.claude/settings.local.json");
  });
});

describe("readSettings", () => {
  it("returns an empty object when the file is absent", () => {
    const result = readSettings(join(dir(), "settings.json"));
    expect(result.data).toEqual({});
    expect(result.existed).toBe(false);
    expect(result.indent).toBe(2);
  });

  it("detects a four-space indent", () => {
    const file = join(dir(), "settings.json");
    writeFileSync(file, '{\n    "a": 1\n}\n');
    expect(readSettings(file).indent).toBe(4);
  });

  it("throws on malformed JSON rather than silently overwriting", () => {
    const file = join(dir(), "settings.json");
    writeFileSync(file, "{ broken");
    expect(() => readSettings(file)).toThrow();
  });
});

describe("writeSettings", () => {
  it("creates missing parent directories", () => {
    const file = join(dir(), "nested", "settings.json");
    writeSettings(file, { a: 1 }, { indent: 2, trailingNewline: true, backup: false });
    expect(JSON.parse(readFileSync(file, "utf8"))).toEqual({ a: 1 });
  });

  it("writes a backup beside the original", () => {
    const file = join(dir(), "settings.json");
    writeFileSync(file, '{\n  "a": 1\n}\n');
    const { backupPath } = writeSettings(
      file,
      { a: 2 },
      { indent: 2, trailingNewline: true, backup: true },
    );
    expect(backupPath).toBe(`${file}.ccverbs.bak`);
    expect(JSON.parse(readFileSync(backupPath!, "utf8"))).toEqual({ a: 1 });
  });

  it("skips the backup when asked", () => {
    const file = join(dir(), "settings.json");
    writeFileSync(file, "{}\n");
    const { backupPath } = writeSettings(
      file,
      { a: 1 },
      { indent: 2, trailingNewline: true, backup: false },
    );
    expect(backupPath).toBeNull();
    expect(existsSync(`${file}.ccverbs.bak`)).toBe(false);
  });

  it("preserves the requested indent and trailing newline", () => {
    const file = join(dir(), "settings.json");
    writeSettings(file, { a: 1 }, { indent: 4, trailingNewline: false, backup: false });
    expect(readFileSync(file, "utf8")).toBe('{\n    "a": 1\n}');
  });

  it("leaves no temp file behind", () => {
    const file = join(dir(), "settings.json");
    writeSettings(file, { a: 1 }, { indent: 2, trailingNewline: true, backup: false });
    expect(existsSync(`${file}.ccverbs.tmp`)).toBe(false);
  });
});
