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

  it("has an index.json regenerated from the set files", () => {
    const index = registryIndexSchema.parse(read("index.json"));
    expect(index.totalSets).toBe(files.length);
    expect(index.totalVerbs).toBe(files.reduce((sum, f) => sum + read(f).verbs.length, 0));
    const ids = index.sets.map((s) => s.id);
    expect(ids).toEqual([...ids].sort());
  });
});
