import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, readConfig, writeConfig } from "../../src/config/io.js";
import { cachePath, configPath, legacyCachePath } from "../../src/config/paths.js";

const dir = () => mkdtempSync(join(tmpdir(), "ccverbs-cfg-"));
const file = () => join(dir(), "config.json");

describe("paths", () => {
  it("puts config and cache under ~/.ccverbs", () => {
    expect(configPath("/h")).toBe("/h/.ccverbs/config.json");
    expect(cachePath("/h")).toBe("/h/.ccverbs/cache/index.json");
  });
  it("remembers where 0.1.0 kept the cache", () => {
    expect(legacyCachePath("/h")).toBe("/h/.cache/ccverbs/index.json");
  });
});

describe("readConfig", () => {
  it("returns defaults when the file is absent", () => {
    const r = readConfig(file());
    expect(r.config).toEqual(DEFAULT_CONFIG);
    expect(r.existed).toBe(false);
    expect(r.warnings).toEqual([]);
  });

  it("defaults to auto language, replace mode and user scope", () => {
    expect(DEFAULT_CONFIG).toEqual({
      version: 1,
      language: "auto",
      mode: "replace",
      scope: "user",
    });
  });

  it("reads a valid file", () => {
    const f = file();
    writeFileSync(f, JSON.stringify({ version: 1, language: "ja", mode: "append", scope: "project" }));
    expect(readConfig(f).config).toEqual({
      version: 1,
      language: "ja",
      mode: "append",
      scope: "project",
    });
  });

  it("never throws on malformed JSON and warns instead", () => {
    const f = file();
    writeFileSync(f, "{ not json");
    const r = readConfig(f);
    expect(r.config).toEqual(DEFAULT_CONFIG);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("keeps the valid keys when one key is invalid", () => {
    const f = file();
    writeFileSync(f, JSON.stringify({ version: 1, language: "klingon", mode: "append", scope: "user" }));
    const r = readConfig(f);
    expect(r.config.mode).toBe("append");
    expect(r.config.language).toBe("auto");
    expect(r.warnings.length).toBe(1);
  });

  it("accepts auto as a language", () => {
    const f = file();
    writeFileSync(f, JSON.stringify({ version: 1, language: "auto", mode: "replace", scope: "user" }));
    expect(readConfig(f).warnings).toEqual([]);
  });

  it("reports which keys came from the file", () => {
    const f = file();
    writeFileSync(f, JSON.stringify({ version: 1, mode: "append" }));
    const r = readConfig(f);
    expect(r.fromFile).toEqual({ language: false, mode: true, scope: false });
  });

  it("falls back to defaults for an unknown version but keeps reading", () => {
    const f = file();
    writeFileSync(f, JSON.stringify({ version: 99, language: "ja", mode: "replace", scope: "user" }));
    const r = readConfig(f);
    expect(r.config.language).toBe("ja");
    expect(r.warnings.length).toBe(1);
  });

  it("returns defaults for a JSON array", () => {
    const f = file();
    writeFileSync(f, "[1,2,3]");
    expect(readConfig(f).config).toEqual(DEFAULT_CONFIG);
  });
});

describe("writeConfig", () => {
  it("round-trips and creates the directory", () => {
    const f = join(dir(), "nested", "config.json");
    const next = { ...DEFAULT_CONFIG, language: "ko" as const };
    expect(writeConfig(f, next).warnings).toEqual([]);
    expect(JSON.parse(readFileSync(f, "utf8"))).toEqual(next);
    expect(readConfig(f).config).toEqual(next);
  });

  it("returns a warning instead of throwing when the path is unwritable", () => {
    const d = dir();
    mkdirSync(join(d, "blocked"), { mode: 0o500 });
    const r = writeConfig(join(d, "blocked", "sub", "config.json"), DEFAULT_CONFIG);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});
