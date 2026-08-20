import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { render } from "ink-testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIG, type CcverbsConfig } from "../../src/config/io.js";
import type { OpenContributionResult } from "../../src/browser.js";
import { getCatalog } from "../../src/i18n/index.js";
import type { RegistryIndex } from "../../src/registry/schema.js";
import { App } from "../../src/ui/App.js";

const set = (id: string, name: string, verbs: string[], language = "ja") => ({
  id,
  name,
  emoji: "S",
  description: `about ${id}`,
  language,
  category: "meme",
  tags: [],
  verbs,
});

const registry = {
  schemaVersion: 1,
  generatedAt: "1970-01-01T00:00:00.000Z",
  totalSets: 2,
  totalVerbs: 3,
  sets: [set("alpha", "Alpha", ["a1", "a2"], "en"), set("beta", "Beta", ["b1"], "ja")],
} as unknown as RegistryIndex;

const ESC = "\u001B";
const DOWN = "\u001B[B";
const ENTER = "\r";

const tick = () => new Promise((r) => setTimeout(r, 40));

let home: string;
beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "ccverbs-ui-"));
});

const mount = (
  over: {
    onExit?: (code: number) => void;
    onCreate?: () => OpenContributionResult;
    config?: Partial<CcverbsConfig>;
    skipped?: string[];
  } = {},
) =>
  render(
    <App
      registry={registry}
      skipped={over.skipped ?? []}
      t={getCatalog("en")}
      locale="en"
      config={{ ...DEFAULT_CONFIG, ...over.config }}
      onExit={over.onExit ?? (() => {})}
      onCreate={over.onCreate ?? (() => ({ ok: true as const, url: "https://ccverbs.example/new" }))}
      home={home}
      cwd={home}
      random={() => 0}
    />,
  );

const settings = (file = "settings.json") =>
  JSON.parse(readFileSync(join(home, ".claude", file), "utf8"));

/** Move off the pinned random row and open the first real set. */
const openFirstSet = async (stdin: { write: (s: string) => void }) => {
  stdin.write(DOWN);
  await tick();
  stdin.write(DOWN);
  await tick();
  stdin.write(ENTER);
  await tick();
};

describe("App — set screen", () => {
  it("lists the sets and the random row", async () => {
    const { lastFrame } = mount();
    await tick();
    expect(lastFrame()).toContain("Alpha");
    expect(lastFrame()).toContain("Beta");
    expect(lastFrame()).toContain("Random");
  });

  it("offers a create row and opens the contribution web app", async () => {
    const onCreate = vi.fn(() => ({ ok: true as const, url: "https://ccverbs.example/new" }));
    const { lastFrame, stdin } = mount({ onCreate });
    await tick();
    expect(lastFrame()).toContain("Create a new set");

    stdin.write(DOWN);
    await tick();
    stdin.write(ENTER);
    await tick();

    expect(onCreate).toHaveBeenCalledOnce();
    expect(lastFrame()).toContain("https://ccverbs.example/new");
  });

  it("shows a manual URL when browser launch fails", async () => {
    const onExit = vi.fn();
    const { lastFrame, stdin } = mount({
      onExit,
      onCreate: () => ({
        ok: false as const,
        url: "https://ccverbs.example/new",
        error: "xdg-open is unavailable",
      }),
    });
    await tick();
    stdin.write(DOWN);
    await tick();
    stdin.write(ENTER);
    await tick();

    expect(lastFrame()).toContain("Could not open the browser");
    expect(lastFrame()).toContain("https://ccverbs.example/new");
    stdin.write("q");
    await tick();
    expect(onExit).toHaveBeenCalledWith(1);
  });

  it("does not offer a language row — that lives in ccverbs config", async () => {
    const { lastFrame } = mount();
    await tick();
    expect(lastFrame()).not.toContain("Language");
  });

  it("filters as the user types", async () => {
    const { lastFrame, stdin } = mount();
    await tick();
    stdin.write("bet");
    await tick();
    expect(lastFrame()).toContain("Beta");
    expect(lastFrame()).not.toContain("Alpha");
  });

  it("previews the highlighted set's verbs", async () => {
    const { lastFrame, stdin } = mount();
    await tick();
    stdin.write(DOWN);
    await tick();
    stdin.write(DOWN);
    await tick();
    expect(lastFrame()).toContain("a1");
  });

  it("warns about skipped sets", async () => {
    const { lastFrame } = mount({ skipped: ["broken"] });
    await tick();
    expect(lastFrame()).toContain("broken");
  });

  it("exits on escape", async () => {
    const onExit = vi.fn();
    const { stdin } = mount({ onExit });
    await tick();
    stdin.write(ESC);
    await tick();
    expect(onExit).toHaveBeenCalledWith(0);
  });
});

describe("App — confirm screen", () => {
  it("shows a human-readable change summary instead of a raw JSON diff", async () => {
    const { lastFrame, stdin } = mount();
    await tick();
    await openFirstSet(stdin);
    const frame = lastFrame() ?? "";

    expect(frame).toContain("Apply this change?");
    expect(frame).toContain("Target");
    expect(frame).toContain("Change");
    expect(frame).toContain("Current");
    expect(frame).toContain("After");
    expect(frame).toContain("Effect");
    expect(frame).toContain(join(home, ".claude", "settings.json"));
    expect(frame).toContain("not configured");
    expect(frame).toContain("Alpha's 2 verbs");
    expect(frame).not.toContain('    "spinnerVerbs": {');
    expect(frame).not.toContain('+   "verbs": [');
  });

  it("explains the built-in verbs and resulting total in append mode", async () => {
    const { lastFrame, stdin } = mount({ config: { mode: "append" } });
    await tick();
    await openFirstSet(stdin);
    const frame = lastFrame() ?? "";

    expect(frame).toContain("Append Alpha's 2 verbs to Claude Code's 186 built-in verbs");
    expect(frame).toContain("not configured (Claude Code's 186 built-in verbs)");
    expect(frame).toContain("Alpha's 2 verbs added (188 total)");
    expect(frame).toContain("Claude Code will pick loading verbs from 188 verbs.");
  });

  it("states the mode and scope it did not ask about", async () => {
    const { lastFrame, stdin } = mount();
    await tick();
    await openFirstSet(stdin);
    const frame = lastFrame() ?? "";
    expect(frame).toContain("Replace");
    expect(frame).toContain("Everywhere");
    expect(frame).toContain(join(home, ".claude", "settings.json"));
    expect(frame).toContain("ccverbs config");
  });

  it("shows the configured scope's real path", async () => {
    const { lastFrame, stdin } = mount({ config: { scope: "local" } });
    await tick();
    await openFirstSet(stdin);
    expect(lastFrame()).toContain("settings.local.json");
  });

  it("never asks for mode or scope", async () => {
    const { lastFrame, stdin } = mount();
    await tick();
    await openFirstSet(stdin);
    // The unchosen mode is absent: this is a statement, not a question.
    expect(lastFrame()).not.toContain("Append");
  });

  it("returns to the set screen on n", async () => {
    const { lastFrame, stdin } = mount();
    await tick();
    await openFirstSet(stdin);
    stdin.write("n");
    await tick();
    expect(lastFrame()).toContain("Search:");
  });

  it("returns to the set screen on escape", async () => {
    const { lastFrame, stdin } = mount();
    await tick();
    await openFirstSet(stdin);
    stdin.write(ESC);
    await tick();
    expect(lastFrame()).toContain("Search:");
  });
});

describe("App — applying", () => {
  it("writes the settings file on y and reports it", async () => {
    const { lastFrame, stdin } = mount();
    await tick();
    await openFirstSet(stdin);
    stdin.write("y");
    await tick();
    expect(settings().spinnerVerbs).toEqual({ mode: "replace", verbs: ["a1", "a2"] });
    expect(lastFrame()).toContain("Applied");
  });

  it("honours the configured append mode", async () => {
    const { stdin } = mount({ config: { mode: "append" } });
    await tick();
    await openFirstSet(stdin);
    stdin.write("y");
    await tick();
    expect(settings().spinnerVerbs.mode).toBe("append");
  });

  it("writes to the configured scope", async () => {
    const { stdin } = mount({ config: { scope: "local" } });
    await tick();
    await openFirstSet(stdin);
    stdin.write("y");
    await tick();
    expect(settings("settings.local.json").spinnerVerbs.verbs).toEqual(["a1", "a2"]);
  });

  it("applies the random row's pick", async () => {
    const { lastFrame, stdin } = mount();
    await tick();
    stdin.write(ENTER);
    await tick();
    expect(lastFrame()).toContain("Apply this change?");
    stdin.write("y");
    await tick();
    expect(settings().spinnerVerbs.verbs).toEqual(["a1", "a2"]);
  });

  it("exits from the done screen on any key", async () => {
    const onExit = vi.fn();
    const { stdin } = mount({ onExit });
    await tick();
    await openFirstSet(stdin);
    stdin.write("y");
    await tick();
    stdin.write("q");
    await tick();
    expect(onExit).toHaveBeenCalledWith(0);
  });
});

describe("App — localization", () => {
  it("renders the confirm screen in Japanese", async () => {
    const { lastFrame, stdin } = render(
      <App
        registry={registry}
        skipped={[]}
        t={getCatalog("ja")}
        locale="ja"
        config={DEFAULT_CONFIG}
        onExit={() => {}}
        onCreate={() => ({ ok: true as const, url: "https://ccverbs.example/new" })}
        home={home}
        cwd={home}
        random={() => 0}
      />,
    );
    await tick();
    await openFirstSet(stdin);
    const frame = lastFrame() ?? "";
    expect(frame).toContain("この変更を適用しますか？");
    expect(frame).toContain("変更対象");
    expect(frame).toContain("変更内容");
    expect(frame).toContain("現在");
    expect(frame).toContain("適用後");
    expect(frame).toContain("反映後");
    expect(frame).toContain("未設定");
    expect(frame).toContain("置き換える");
    expect(frame).toContain("全体");
  });
});
