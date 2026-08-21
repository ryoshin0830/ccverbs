import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readme = readFileSync("README.md", "utf8");
const readmeJa = readFileSync("README.ja.md", "utf8");
const contributing = readFileSync("CONTRIBUTING.md", "utf8");
const aiAgents = readFileSync("docs/ai-agents.md", "utf8");
const contributionSkill = readFileSync(".claude/skills/ccverbs-contribute/SKILL.md", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));

describe("version", () => {
  it("is 0.5.0", () => {
    expect(pkg.version).toBe("0.5.0");
  });
});

describe("README", () => {
  it("still documents the researched Claude Code limits", () => {
    for (const token of ["186", "No limit", "`mode`", "`replace`", "`append`"]) {
      expect(readme).toContain(token);
    }
  });

  it("documents every command", () => {
    for (const c of [
      "list",
      "show",
      "search",
      "set",
      "random",
      "current",
      "reset",
      "config",
      "new",
    ]) {
      expect(readme).toContain(`ccverbs ${c}`);
    }
  });

  it("documents the new options", () => {
    for (const flag of ["--lang", "--no-group", "--json", "--dry-run", "--input", "--pr", "--branch"]) {
      expect(readme).toContain(flag);
    }
  });

  it("documents ~/.ccverbs as the current home for config and cache", () => {
    expect(readme).toContain("~/.ccverbs/");
    expect(readme).toContain("config.json");
    expect(readme).toContain("~/.ccverbs/cache/");
    // The 0.1.0 path may only appear while describing the migration away from it.
    for (const line of readme.split("\n").filter((l) => l.includes("~/.cache/ccverbs/"))) {
      expect(line.toLowerCase()).toMatch(/upgrad|migrat/);
    }
  });

  it("lists all five locales and the detection order", () => {
    for (const t of ["English", "日本語", "简体中文", "繁體中文", "한국어"]) {
      expect(readme).toContain(t);
    }
    expect(readme).toContain("LC_ALL");
    expect(readme).toContain("AppleLanguages");
    expect(readme).toContain("CCVERBS_LANG");
  });

  it("explains that C and POSIX are not treated as English", () => {
    expect(readme).toContain("C.UTF-8");
    expect(readme).toContain("no preference");
  });

  it("asks for native-speaker review of the unreviewed locales", () => {
    expect(readme.toLowerCase()).toContain("native");
    expect(readme).toContain("not yet");
  });

  it("says mode and scope are settings rather than per-run questions", () => {
    expect(readme).toContain("settings, not questions");
  });

  it("keeps the exit code table and the agent section", () => {
    for (const code of ["0", "1", "2", "3", "4"]) expect(readme).toContain(`| ${code} |`);
    expect(readme).toContain("For AI agents");
  });

  it("links to the Japanese translation and contributing guide", () => {
    expect(readme).toContain("README.ja.md");
    expect(readme).toContain("CONTRIBUTING.md");
    expect(readme).toContain("docs/ai-agents.md");
  });

  it("documents the interactive contribution entry point and command help", () => {
    expect(readme).toContain("Create a new set");
    expect(readme).toContain("npx ccverbs new --help");
    expect(readme).toContain("https://ccverbs.lolipop-now.app");
  });

  it("says the top-level help carries the agent contract too", () => {
    expect(readme).toContain("npx ccverbs --help");
    expect(readme).toContain("For AI agents");
    expect(readmeJa).toContain("npx ccverbs --help");
  });
});

describe("AI contribution documentation", () => {
  it("documents the validation-first stdin and PR workflow", () => {
    for (const token of [
      "ccverbs new --input <path|-> --json",
      "ccverbs new --input - --pr --json",
      "--pr",
      "--branch",
      "ok",
      "validated",
      "manual",
      "sets/index.json",
      "ccverbs --help",
      "ccverbs new --help",
      "Create a new set",
    ]) {
      expect(aiAgents).toContain(token);
    }
  });

  it("makes the skill discoverable and authorization-aware", () => {
    expect(aiAgents).toContain(".claude/skills/ccverbs-contribute/SKILL.md");
    expect(contributionSkill).toContain("explicit authorization");
    expect(contributionSkill).toContain("ccverbs new");
    expect(contributionSkill).toContain("--pr");
    expect(contributionSkill).toContain("new --help");
    expect(contributionSkill).toContain("Create a new set");
  });
});

describe("README.ja.md", () => {
  it("documents the config command and ~/.ccverbs", () => {
    expect(readmeJa).toContain("ccverbs config");
    expect(readmeJa).toContain("~/.ccverbs/");
  });
  it("records the 186 default verbs", () => {
    expect(readmeJa).toContain("186");
  });
  it("explains the C.UTF-8 case", () => {
    expect(readmeJa).toContain("C.UTF-8");
  });
  it("only mentions the old cache path while describing the migration", () => {
    for (const line of readmeJa.split("\n").filter((l) => l.includes("~/.cache/ccverbs/"))) {
      expect(line).toMatch(/移動|移行/);
    }
  });
  it("links back to the English README", () => {
    expect(readmeJa).toContain("README.md");
  });
});

describe("CONTRIBUTING", () => {
  it("explains the set file workflow", () => {
    expect(contributing).toContain("sets/");
    expect(contributing).toContain("npm run sets:validate");
    expect(contributing).toContain("index.json");
  });
  it("explains how to add or fix a locale", () => {
    expect(contributing).toContain("src/i18n/");
    expect(contributing).toContain("Catalog");
    expect(contributing).toContain("reviewed");
    expect(contributing).toContain("tsc --noEmit");
  });
  it("documents the optional set i18n block", () => {
    expect(contributing).toContain('"i18n"');
    expect(contributing).toContain("per field");
  });
  it("lists every set language", () => {
    for (const l of ["zh-Hans", "zh-Hant", "ko", "mixed"]) expect(contributing).toContain(l);
  });
  it("explains the AI-generated set path", () => {
    for (const token of ["AI-generated", "ccverbs new", "--input", "--pr", "human review"]) {
      expect(contributing).toContain(token);
    }
  });
});

describe("README ordering", () => {
  const at = (text: string, heading: string) => text.indexOf(heading);

  it("puts contributing above the reference material", () => {
    expect(at(readme, "## Add a verb set")).toBeGreaterThan(0);
    expect(at(readme, "## Add a verb set")).toBeLessThan(at(readme, "## Usage"));
    expect(at(readme, "## Add a verb set")).toBeLessThan(at(readme, "## For AI agents"));
  });

  it("offers both an easy path and a by-hand path", () => {
    const section = readme.slice(at(readme, "## Add a verb set"), at(readme, "## Usage"));
    expect(section).toContain("sets/");
    expect(section).toContain("npm run sets:index");
    expect(section).toMatch(/https:\/\/\S+/);
  });

  it("folds the research into a details block near the end", () => {
    expect(readme).toContain("<details>");
    expect(readme).toContain("</details>");
    expect(at(readme, "<details>")).toBeGreaterThan(at(readme, "## For AI agents"));
  });

  it("keeps every researched fact", () => {
    for (const token of [
      "186",
      "No limit",
      "`replace`",
      "`append`",
      "2.1.235",
      "Flibbertigibbeting",
      "Whatchamacalliting",
      "Expected object, but received array",
    ]) {
      expect(readme, token).toContain(token);
    }
  });
});

describe("README.ja.md ordering", () => {
  it("matches the English order", () => {
    expect(readmeJa.indexOf("## 単語セットを追加する")).toBeLessThan(
      readmeJa.indexOf("## 使い方"),
    );
    expect(readmeJa).toContain("<details>");
    expect(readmeJa.indexOf("<details>")).toBeGreaterThan(
      readmeJa.indexOf("## AI エージェント向け"),
    );
  });
});
