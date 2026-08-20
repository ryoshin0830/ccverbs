import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { parseArgs } from "../src/args.js";
import { runCommand } from "../src/commands/index.js";
import { DEFAULT_CONFIG, type CcverbsConfig } from "../src/config/io.js";
import { configPath } from "../src/config/paths.js";
import { getCatalog } from "../src/i18n/index.js";
import type { RegistryIndex } from "../src/registry/schema.js";

const set = (id: string, verbs: string[]) => ({
  id,
  name: id,
  emoji: "\u{1FAA8}",
  description: `about ${id}`,
  language: "ja",
  category: "meme",
  tags: [id],
  verbs,
});

const registry = {
  schemaVersion: 1,
  generatedAt: "1970-01-01T00:00:00.000Z",
  totalSets: 2,
  totalVerbs: 3,
  sets: [set("alpha", ["a1", "a2"]), set("beta", ["b1"])],
} as unknown as RegistryIndex;

let home: string;
let lines: string[];
const io = { out: (l: string) => lines.push(l), err: (l: string) => lines.push(l) };

const runWith = (config: Partial<CcverbsConfig>, argv: string[]) => {
  const parsed = parseArgs(argv);
  if (!parsed.ok) throw new Error(parsed.message);
  return runCommand(parsed.options, {
    registry,
    skipped: [],
    io,
    t: getCatalog("en"),
    locale: "en",
    localeSource: "default",
    config: { ...DEFAULT_CONFIG, ...config },
    fromFile: { language: false, mode: false, scope: false },
    configPath: configPath(home),
    cachePath: join(home, ".ccverbs", "cache", "index.json"),
    cacheAgeMs: null,
    warnings: [],
    home,
    cwd: home,
    random: () => 0,
  });
};

const run = (argv: string[]) => runWith({}, argv);

const json = () => JSON.parse(lines.join("\n"));
const settingsPath = () => join(home, ".claude", "settings.json");
const settings = () => JSON.parse(readFileSync(settingsPath(), "utf8"));

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "ccverbs-home-"));
  mkdirSync(join(home, ".claude"), { recursive: true });
  lines = [];
});

describe("list", () => {
  it("emits every set with its verb count as JSON", async () => {
    expect(await run(["list", "--json"])).toBe(0);
    const out = json();
    expect(out.ok).toBe(true);
    expect(out.totalSets).toBe(2);
    expect(out.sets.map((s: { id: string; count: number }) => [s.id, s.count])).toEqual([
      ["alpha", 2],
      ["beta", 1],
    ]);
  });

  it("prints a human table without --json", async () => {
    await run(["list"]);
    expect(lines.join("\n")).toContain("alpha");
  });

  it("keeps --json ordered by id regardless of locale", async () => {
    await run(["list", "--json"]);
    expect(json().sets.map((s: { id: string }) => s.id)).toEqual(["alpha", "beta"]);
  });
});

describe("show", () => {
  it("prints all verbs of a set", async () => {
    expect(await run(["show", "alpha", "--json"])).toBe(0);
    expect(json().set.verbs).toEqual(["a1", "a2"]);
  });

  it("exits 3 for an unknown id", async () => {
    expect(await run(["show", "nope", "--json"])).toBe(3);
    expect(json().ok).toBe(false);
  });
});

describe("search", () => {
  it("filters the set list", async () => {
    await run(["search", "beta", "--json"]);
    expect(json().sets.map((s: { id: string }) => s.id)).toEqual(["beta"]);
  });
});

describe("set", () => {
  it("writes spinnerVerbs with --yes", async () => {
    expect(await run(["set", "alpha", "--yes", "--json"])).toBe(0);
    expect(settings().spinnerVerbs).toEqual({ mode: "replace", verbs: ["a1", "a2"] });
    expect(json().applied).toMatchObject({ id: "alpha", mode: "replace", count: 2 });
  });

  it("honours --mode append", async () => {
    await run(["set", "alpha", "--yes", "--mode", "append"]);
    expect(settings().spinnerVerbs.mode).toBe("append");
  });

  it("preserves unrelated settings keys", async () => {
    writeFileSync(settingsPath(), JSON.stringify({ env: { A: "1" } }, null, 2));
    await run(["set", "alpha", "--yes"]);
    expect(settings().env).toEqual({ A: "1" });
  });

  it("writes nothing with --dry-run", async () => {
    writeFileSync(settingsPath(), "{}");
    expect(await run(["set", "alpha", "--dry-run"])).toBe(0);
    expect(settings().spinnerVerbs).toBeUndefined();
  });

  it("writes nothing without --yes and says how to apply", async () => {
    writeFileSync(settingsPath(), "{}");
    expect(await run(["set", "alpha"])).toBe(0);
    expect(settings().spinnerVerbs).toBeUndefined();
    expect(lines.join("\n")).toContain("--yes");
  });

  it("exits 3 for an unknown id", async () => {
    expect(await run(["set", "nope", "--yes", "--json"])).toBe(3);
  });
});

describe("random", () => {
  it("applies a set chosen by the injected generator", async () => {
    expect(await run(["random", "--yes", "--json"])).toBe(0);
    expect(json().applied.id).toBe("alpha");
  });
});

describe("current", () => {
  it("reports an unconfigured state with the Claude Code default count", async () => {
    await run(["current", "--json"]);
    expect(json()).toMatchObject({
      configured: false,
      effectiveVerbCount: 186,
      defaultVerbCount: 186,
    });
  });

  it("identifies which set is applied", async () => {
    await run(["set", "alpha", "--yes"]);
    lines = [];
    await run(["current", "--json"]);
    expect(json().matchedSet).toMatchObject({ id: "alpha" });
    expect(json().effectiveVerbCount).toBe(2);
  });
});

describe("reset", () => {
  it("removes the spinnerVerbs key", async () => {
    await run(["set", "alpha", "--yes"]);
    expect(await run(["reset", "--yes", "--json"])).toBe(0);
    expect(settings().spinnerVerbs).toBeUndefined();
  });
});

describe("configured mode and scope", () => {
  it("uses the configured mode when --mode is absent", async () => {
    await runWith({ mode: "append" }, ["set", "alpha", "--yes"]);
    expect(settings().spinnerVerbs.mode).toBe("append");
  });

  it("lets --mode override the configured mode", async () => {
    await runWith({ mode: "append" }, ["set", "alpha", "--yes", "--mode", "replace"]);
    expect(settings().spinnerVerbs.mode).toBe("replace");
  });

  it("uses the configured scope when --scope is absent", async () => {
    await runWith({ scope: "local" }, ["set", "alpha", "--yes"]);
    const local = JSON.parse(
      readFileSync(join(home, ".claude", "settings.local.json"), "utf8"),
    );
    expect(local.spinnerVerbs.verbs).toEqual(["a1", "a2"]);
  });

  it("reports the configured mode in the applied payload", async () => {
    await runWith({ mode: "append" }, ["set", "alpha", "--yes", "--json"]);
    expect(json().applied.mode).toBe("append");
  });
});
