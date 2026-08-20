import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readCache, writeCache } from "../../src/registry/cache.js";

const index = {
  schemaVersion: 1,
  generatedAt: "1970-01-01T00:00:00.000Z",
  totalSets: 0,
  totalVerbs: 0,
  sets: [],
};

const tmpFile = () => join(mkdtempSync(join(tmpdir(), "ccverbs-")), "index.json");

describe("cache", () => {
  it("returns null when nothing is cached", () => {
    expect(readCache(tmpFile())).toBeNull();
  });

  it("round-trips a written index and creates missing directories", () => {
    const file = join(mkdtempSync(join(tmpdir(), "ccverbs-")), "nested", "index.json");
    writeCache(file, index);
    expect(readCache(file)?.index).toEqual(index);
  });

  it("reports a near-zero age for a freshly written cache", () => {
    const file = tmpFile();
    writeCache(file, index);
    expect(readCache(file)!.ageMs).toBeLessThan(5_000);
  });

  it("returns null for unparsable cache content", () => {
    const file = tmpFile();
    writeFileSync(file, "{ not json");
    expect(readCache(file)).toBeNull();
  });
});
