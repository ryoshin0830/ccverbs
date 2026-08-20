import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { render } from "ink-testing-library";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIG, readConfig, type CcverbsConfig } from "../../src/config/io.js";
import { cachePath, configPath } from "../../src/config/paths.js";
import { getCatalog } from "../../src/i18n/index.js";
import type { SupportedLocale } from "../../src/i18n/locales.js";
import type { LocaleSource } from "../../src/i18n/resolve.js";
import { ConfigApp } from "../../src/ui/ConfigApp.js";

const ESC = "\u001B";
const DOWN = "\u001B[B";
const ENTER = "\r";

const tick = () => new Promise((r) => setTimeout(r, 40));

let home: string;
beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "ccverbs-cfg-ui-"));
});

const mount = (
  over: {
    onExit?: (code: number) => void;
    locale?: SupportedLocale;
    localeSource?: LocaleSource;
    config?: Partial<CcverbsConfig>;
    cacheAgeMs?: number | null;
  } = {},
) => {
  const locale = over.locale ?? "en";
  return render(
    <ConfigApp
      t={getCatalog(locale)}
      locale={locale}
      localeSource={over.localeSource ?? "default"}
      initialConfig={{ ...DEFAULT_CONFIG, ...over.config }}
      configPath={configPath(home)}
      cachePath={cachePath(home)}
      cacheAgeMs={over.cacheAgeMs ?? 240_000}
      onExit={over.onExit ?? (() => {})}
      home={home}
      cwd={home}
    />,
  );
};

const stored = (): CcverbsConfig => readConfig(configPath(home)).config;

describe("ConfigApp — the list", () => {
  it("lists the three settings with their current values", async () => {
    const { lastFrame } = mount();
    await tick();
    const frame = lastFrame() ?? "";
    expect(frame).toContain("Language");
    expect(frame).toContain("Mode");
    expect(frame).toContain("Replace");
    expect(frame).toContain("Everywhere");
  });

  it("offers a restore-defaults row and shows both paths", async () => {
    const { lastFrame } = mount();
    await tick();
    const frame = lastFrame() ?? "";
    expect(frame).toContain("Restore defaults");
    expect(frame).toContain(configPath(home));
    expect(frame).toContain(cachePath(home));
  });

  it("labels values that came from defaults", async () => {
    const { lastFrame } = mount();
    await tick();
    expect(lastFrame()).toContain("default");
  });

  it("shows the detection source for an automatic language", async () => {
    const { lastFrame } = mount({ locale: "ja", localeSource: "os" });
    await tick();
    expect(lastFrame()).toContain("OSの言語設定から");
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

describe("ConfigApp — language", () => {
  it("opens the chooser and saves the choice", async () => {
    const { lastFrame, stdin } = mount();
    await tick();
    stdin.write(ENTER);
    await tick();
    expect(lastFrame()).toContain("日本語");

    stdin.write(DOWN); // Automatic -> English
    await tick();
    stdin.write(DOWN); // English -> 日本語
    await tick();
    stdin.write(ENTER);
    await tick();

    expect(stored().language).toBe("ja");
    // Back on the list, now rendered in the language just chosen.
    expect(lastFrame()).toContain("言語");
  });

  it("marks unreviewed locales in the chooser", async () => {
    const { lastFrame, stdin } = mount();
    await tick();
    stdin.write(ENTER);
    await tick();
    expect(lastFrame()).toContain("native-speaker review");
  });

  it("offers Automatic with the detected language named", async () => {
    const { lastFrame, stdin } = mount({ locale: "ja", localeSource: "os" });
    await tick();
    stdin.write(ENTER);
    await tick();
    expect(lastFrame()).toContain("自動");
  });
});

describe("ConfigApp — mode and scope", () => {
  it("saves append", async () => {
    const { stdin } = mount();
    await tick();
    stdin.write(DOWN); // Mode row
    await tick();
    stdin.write(ENTER);
    await tick();
    stdin.write(DOWN); // Replace -> Append
    await tick();
    stdin.write(ENTER);
    await tick();
    expect(stored().mode).toBe("append");
  });

  it("saves project scope and shows each option's real path", async () => {
    const { lastFrame, stdin } = mount();
    await tick();
    stdin.write(DOWN);
    await tick();
    stdin.write(DOWN); // Scope row
    await tick();
    stdin.write(ENTER);
    await tick();
    expect(lastFrame()).toContain(join(home, ".claude", "settings.local.json"));

    stdin.write(DOWN); // Everywhere -> This project
    await tick();
    stdin.write(ENTER);
    await tick();
    expect(stored().scope).toBe("project");
  });

  it("returns to the list on escape without saving", async () => {
    const { lastFrame, stdin } = mount();
    await tick();
    stdin.write(DOWN);
    await tick();
    stdin.write(ENTER);
    await tick();
    stdin.write(ESC);
    await tick();
    expect(lastFrame()).toContain("Restore defaults");
    expect(stored().mode).toBe("replace");
  });
});

describe("ConfigApp — restore defaults", () => {
  it("writes the defaults back", async () => {
    const { stdin } = mount({ config: { mode: "append", scope: "project" } });
    await tick();
    stdin.write(DOWN);
    stdin.write(DOWN);
    stdin.write(DOWN); // Restore defaults row
    await tick();
    stdin.write(ENTER);
    await tick();
    expect(stored()).toEqual(DEFAULT_CONFIG);
  });
});
