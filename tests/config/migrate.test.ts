import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { migrateCache } from "../../src/config/migrate.js";
import { cachePath, legacyCachePath } from "../../src/config/paths.js";

const home = () => mkdtempSync(join(tmpdir(), "ccverbs-home-"));
const seedLegacy = (h: string, body = '{"schemaVersion":1}') => {
  const p = legacyCachePath(h);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, body);
  return p;
};

describe("migrateCache", () => {
  it("moves the 0.1.0 cache to its new home", () => {
    const h = home();
    seedLegacy(h, '{"schemaVersion":1,"marker":"x"}');
    expect(migrateCache(h)).toEqual({ moved: true });
    expect(readFileSync(cachePath(h), "utf8")).toContain("marker");
    expect(existsSync(legacyCachePath(h))).toBe(false);
  });

  it("removes the old directory once empty", () => {
    const h = home();
    seedLegacy(h);
    migrateCache(h);
    expect(existsSync(dirname(legacyCachePath(h)))).toBe(false);
  });

  it("leaves the old directory alone when it holds other files", () => {
    const h = home();
    seedLegacy(h);
    writeFileSync(join(dirname(legacyCachePath(h)), "other.txt"), "keep me");
    migrateCache(h);
    expect(existsSync(dirname(legacyCachePath(h)))).toBe(true);
  });

  it("does nothing when the new cache already exists", () => {
    const h = home();
    seedLegacy(h, '{"old":true}');
    mkdirSync(dirname(cachePath(h)), { recursive: true });
    writeFileSync(cachePath(h), '{"new":true}');
    expect(migrateCache(h)).toEqual({ moved: false });
    expect(readFileSync(cachePath(h), "utf8")).toContain("new");
  });

  it("does nothing when there is no old cache", () => {
    expect(migrateCache(home())).toEqual({ moved: false });
  });

  it("never throws", () => {
    expect(() => migrateCache("/nonexistent/path/that/cannot/be/written")).not.toThrow();
  });
});
