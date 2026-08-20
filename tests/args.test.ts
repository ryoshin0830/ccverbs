import { describe, expect, it } from "vitest";
import { parseArgs } from "../src/args.js";

const ok = (argv: string[]) => {
  const r = parseArgs(argv);
  if (!r.ok) throw new Error(r.message);
  return r.options;
};
const bad = (argv: string[]) => {
  const r = parseArgs(argv);
  expect(r.ok, `expected ${argv.join(" ")} to be rejected`).toBe(false);
  return r.ok ? "" : r.message;
};

describe("parseArgs", () => {
  it("defaults to the TUI and leaves mode and scope unset", () => {
    const o = ok([]);
    expect(o).toMatchObject({ command: "tui", json: false, backup: true, group: true });
    // Absent, not merely falsy: the config file supplies these.
    expect(o.mode).toBeUndefined();
    expect(o.scope).toBeUndefined();
  });

  it("parses every command", () => {
    for (const c of ["list", "random", "current", "reset", "config"] as const) {
      expect(ok([c]).command).toBe(c);
    }
    expect(ok(["new", "--input", "-"]).command).toBe("new");
    expect(ok(["show", "sql"]).arg).toBe("sql");
    expect(ok(["search", "git"]).arg).toBe("git");
    expect(ok(["set", "sql"]).arg).toBe("sql");
  });

  it("parses --lang", () => {
    expect(ok(["list", "--lang", "ja"]).lang).toBe("ja");
    expect(ok(["list", "--lang=ko"]).lang).toBe("ko");
  });

  it("rejects a --lang value we do not ship", () => {
    expect(bad(["list", "--lang", "fr"])).toContain("fr");
  });

  it("parses --no-group", () => {
    expect(ok(["list", "--no-group"]).group).toBe(false);
  });

  it("records mode and scope only when given", () => {
    expect(ok(["set", "sql", "-m", "append", "-S", "local"])).toMatchObject({
      mode: "append",
      scope: "local",
    });
  });

  it("accepts config with no key for the settings screen", () => {
    const o = ok(["config"]);
    expect(o.command).toBe("config");
    expect(o.configKey).toBeUndefined();
  });

  it("parses a config key and value", () => {
    expect(ok(["config", "language", "ja"])).toMatchObject({
      command: "config",
      configKey: "language",
      configValue: "ja",
    });
  });

  it("parses config reset with no value", () => {
    const o = ok(["config", "reset"]);
    expect(o.configKey).toBe("reset");
    expect(o.configValue).toBeUndefined();
  });

  it("rejects a config key that needs a value but has none", () => {
    expect(bad(["config", "language"])).toContain("language");
  });

  it("rejects an unknown config key", () => {
    expect(bad(["config", "colour", "blue"])).toContain("colour");
  });

  it("rejects an invalid config value and names the allowed set", () => {
    const message = bad(["config", "mode", "merge"]);
    expect(message).toContain("merge");
    expect(message).toContain("replace");
  });

  it("rejects an unknown command, option, mode and scope", () => {
    expect(bad(["frobnicate"])).toContain("frobnicate");
    expect(bad(["list", "--wat"])).toContain("--wat");
    expect(bad(["set", "sql", "--mode", "merge"])).toContain("merge");
    expect(bad(["set", "sql", "-S", "global"])).toContain("global");
  });

  it("requires an argument for show, search and set", () => {
    for (const c of ["show", "search", "set"]) expect(bad([c])).toContain(c);
  });

  it("rejects a stray third argument", () => {
    expect(bad(["show", "sql", "extra"])).toContain("extra");
  });

  it("rejects --offline together with --refresh", () => {
    expect(bad(["list", "--offline", "--refresh"])).toContain("--refresh");
  });

  it("maps -h and -v", () => {
    expect(ok(["--help"]).command).toBe("help");
    expect(ok(["-v"]).command).toBe("version");
  });

  it("parses new with a file input", () => {
    expect(ok(["new", "--input", "set.json"])).toMatchObject({
      command: "new",
      input: "set.json",
      pr: false,
    });
  });

  it("parses stdin input, PR mode, and branch", () => {
    expect(ok(["new", "--input=-", "--pr", "--branch", "add-gym", "--json"])).toMatchObject({
      command: "new",
      input: "-",
      pr: true,
      branch: "add-gym",
      json: true,
    });
  });

  it("requires input and rejects new-only flags on other commands", () => {
    expect(bad(["new"])).toContain("--input");
    expect(bad(["list", "--pr"])).toContain("new");
  });
});
