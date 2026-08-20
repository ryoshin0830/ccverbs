import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { displayWidth, registryIndexSchema, verbSetSchema } from "../src/registry/schema.js";

const SETS_DIR = join(process.cwd(), "sets");
const files = readdirSync(SETS_DIR).filter((f) => f.endsWith(".json") && f !== "index.json");
const read = (f: string) => JSON.parse(readFileSync(join(SETS_DIR, f), "utf8"));

describe("bundled verb sets", () => {
  it("ships at least 21 sets", () => {
    expect(files.length).toBeGreaterThanOrEqual(21);
  });

  it.each(files)("%s validates and matches its filename", (file) => {
    const set = verbSetSchema.parse(read(file));
    expect(`${set.id}.json`).toBe(file);
  });

  it("has globally unique ids", () => {
    const ids = files.map((f) => read(f).id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps every verb within 40 display columns", () => {
    const tooWide = files.flatMap((f) =>
      (read(f).verbs as string[]).filter((v) => displayWidth(v) > 40),
    );
    expect(tooWide).toEqual([]);
  });

  it("includes the sisyphus set from the original article", () => {
    const set = read("sisyphus.json");
    expect(set.verbs).toContain("岩を押し上げています");
    expect(set.verbs).toHaveLength(10);
  });

  it("has a valid index.json", () => {
    const index = registryIndexSchema.parse(read("index.json"));
    const ids = index.sets.map((s) => s.id);
    expect(ids).toEqual([...ids].sort());
  });

  // Not "the committed index is current": a pull request from the web builder
  // adds one set file and nothing else, and main rebuilds the index after the
  // merge. What has to hold on a branch is that the index still *builds*
  // correctly from whatever set files are present.
  it("builds an index that accounts for every set file", () => {
    const built = {
      schemaVersion: 1,
      generatedAt: "1970-01-01T00:00:00.000Z",
      totalSets: files.length,
      totalVerbs: files.reduce((sum, f) => sum + read(f).verbs.length, 0),
      sets: files
        .map((f) => read(f))
        .sort((a, b) => a.id.localeCompare(b.id)),
    };
    const parsed = registryIndexSchema.parse(built);
    expect(parsed.totalSets).toBe(files.length);
    expect(parsed.sets.map((s) => s.id)).toEqual([...parsed.sets.map((s) => s.id)].sort());
  });
});
