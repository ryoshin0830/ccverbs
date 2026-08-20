import { describe, expect, it } from "vitest";
import { HELP, parseArgs } from "../src/args.js";

const ok = (argv: string[]) => {
  const r = parseArgs(argv);
  if (!r.ok) throw new Error(r.message);
  return r.options;
};

describe("parseArgs", () => {
  it("defaults to the TUI with no arguments", () => {
    expect(ok([])).toMatchObject({
      command: "tui",
      mode: "replace",
      scope: "user",
      backup: true,
      json: false,
    });
  });

  it("parses every command", () => {
    for (const c of ["list", "search", "set", "random", "current", "reset"] as const) {
      expect(ok([c, "x"]).command).toBe(c);
    }
    expect(ok(["show", "sql"]).arg).toBe("sql");
  });

  it("parses long and short flags", () => {
    expect(
      ok(["set", "sql", "--mode", "append", "-S", "project", "--json", "-y", "-n"]),
    ).toMatchObject({ mode: "append", scope: "project", json: true, yes: true, dryRun: true });
  });

  it("supports the flag=value form", () => {
    expect(ok(["set", "sql", "--mode=append"]).mode).toBe("append");
  });

  it("turns off backups with --no-backup", () => {
    expect(ok(["set", "sql", "--no-backup"]).backup).toBe(false);
  });

  it("maps -h and -v to help and version", () => {
    expect(ok(["--help"]).command).toBe("help");
    expect(ok(["-v"]).command).toBe("version");
  });

  it("rejects an unknown command", () => {
    expect(parseArgs(["frobnicate"]).ok).toBe(false);
  });

  it("rejects an unknown flag", () => {
    expect(parseArgs(["list", "--wat"]).ok).toBe(false);
  });

  it("rejects an invalid mode", () => {
    expect(parseArgs(["set", "sql", "--mode", "merge"]).ok).toBe(false);
  });

  it("rejects an invalid scope", () => {
    expect(parseArgs(["set", "sql", "-S", "global"]).ok).toBe(false);
  });

  it("requires an id for set, show, and search", () => {
    expect(parseArgs(["set"]).ok).toBe(false);
    expect(parseArgs(["show"]).ok).toBe(false);
    expect(parseArgs(["search"]).ok).toBe(false);
  });

  it("rejects --offline together with --refresh", () => {
    expect(parseArgs(["list", "--offline", "--refresh"]).ok).toBe(false);
  });
});

describe("HELP", () => {
  it("documents every command and option", () => {
    for (const token of [
      "list",
      "show",
      "search",
      "set",
      "random",
      "current",
      "reset",
      "--mode",
      "--scope",
      "--json",
      "--yes",
      "--dry-run",
      "--no-backup",
      "--refresh",
      "--offline",
      "--help",
      "--version",
    ]) {
      expect(HELP).toContain(token);
    }
  });
});
