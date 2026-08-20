import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { writeCache } from "../../src/registry/cache.js";
import { RegistryError, loadRegistry } from "../../src/registry/index.js";
import type { RegistryIndex } from "../../src/registry/schema.js";

const set = (id: string) => ({
  id,
  name: id,
  emoji: "\u{1FAA8}",
  description: "d",
  language: "ja",
  category: "meme",
  tags: [],
  verbs: ["押しています"],
});

const index = (ids: string[]) =>
  ({
    schemaVersion: 1,
    generatedAt: "1970-01-01T00:00:00.000Z",
    totalSets: ids.length,
    totalVerbs: ids.length,
    sets: ids.map(set),
  }) as unknown as RegistryIndex;

const cacheFile = () => join(mkdtempSync(join(tmpdir(), "ccverbs-")), "index.json");

describe("loadRegistry", () => {
  it("fetches from the network and caches the result", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(index(["a"]));
    const result = await loadRegistry({ cacheFile: cacheFile(), fetchImpl });
    expect(result.source).toBe("network");
    expect(result.index.sets).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("serves a fresh cache without touching the network", async () => {
    const file = cacheFile();
    writeCache(file, index(["a"]));
    const fetchImpl = vi.fn();
    const result = await loadRegistry({ cacheFile: file, fetchImpl });
    expect(result.source).toBe("cache");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("refetches when refresh is set", async () => {
    const file = cacheFile();
    writeCache(file, index(["a"]));
    const fetchImpl = vi.fn().mockResolvedValue(index(["a", "b"]));
    const result = await loadRegistry({ cacheFile: file, fetchImpl, refresh: true });
    expect(result.source).toBe("network");
    expect(result.index.sets).toHaveLength(2);
  });

  it("falls back to a stale cache when the network fails", async () => {
    const file = cacheFile();
    writeCache(file, index(["a"]));
    const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));
    const result = await loadRegistry({ cacheFile: file, fetchImpl, refresh: true });
    expect(result.source).toBe("cache");
  });

  it("throws registry-unavailable when the network fails with no cache", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(loadRegistry({ cacheFile: cacheFile(), fetchImpl })).rejects.toMatchObject({
      code: "registry-unavailable",
    });
  });

  it("throws registry-unavailable in offline mode with no cache", async () => {
    const fetchImpl = vi.fn();
    await expect(
      loadRegistry({ cacheFile: cacheFile(), fetchImpl, offline: true }),
    ).rejects.toBeInstanceOf(RegistryError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("skips an individual malformed set but keeps the rest", async () => {
    const payload = index(["a"]) as unknown as { sets: unknown[] };
    payload.sets.push({ ...set("bad"), verbs: [] });
    const result = await loadRegistry({
      cacheFile: cacheFile(),
      fetchImpl: vi.fn().mockResolvedValue(payload),
    });
    expect(result.index.sets.map((s) => s.id)).toEqual(["a"]);
    expect(result.skipped).toEqual(["bad"]);
  });

  it("throws registry-invalid when every set is malformed", async () => {
    const payload = index([]) as unknown as { sets: unknown[] };
    payload.sets.push({ ...set("bad"), verbs: [] });
    await expect(
      loadRegistry({ cacheFile: cacheFile(), fetchImpl: vi.fn().mockResolvedValue(payload) }),
    ).rejects.toMatchObject({ code: "registry-invalid" });
  });
});
