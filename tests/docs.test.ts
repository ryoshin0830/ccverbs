import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readme = readFileSync("README.md", "utf8");
const readmeJa = readFileSync("README.ja.md", "utf8");
const contributing = readFileSync("CONTRIBUTING.md", "utf8");

describe("README", () => {
  it("documents the researched Claude Code limits", () => {
    for (const token of ["186", "No limit", "`mode`", "`replace`", "`append`"]) {
      expect(readme).toContain(token);
    }
  });

  it("documents every command", () => {
    for (const c of ["list", "show", "search", "set", "random", "current", "reset"]) {
      expect(readme).toContain(`ccverbs ${c}`);
    }
  });

  it("has an agent-facing section with the exit codes", () => {
    expect(readme).toContain("--json");
    for (const code of ["0", "1", "2", "3", "4"]) expect(readme).toContain(`| ${code} |`);
  });

  it("links to the Japanese translation and contributing guide", () => {
    expect(readme).toContain("README.ja.md");
    expect(readme).toContain("CONTRIBUTING.md");
  });
});

describe("README.ja.md", () => {
  it("also records the 186 default verbs", () => {
    expect(readmeJa).toContain("186");
  });
  it("links back to the English README", () => {
    expect(readmeJa).toContain("README.md");
  });
});

describe("CONTRIBUTING", () => {
  it("explains the set file workflow", () => {
    expect(contributing).toContain("sets/");
    expect(contributing).toContain("index.json");
    expect(contributing).toContain("npm run sets:validate");
  });
  it("warns about the trailing ellipsis", () => {
    expect(contributing).toContain("…");
  });
});
