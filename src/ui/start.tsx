import { render } from "ink";
import type { CommandDeps } from "../commands/io.js";
import { openContributionPage, type OpenContributionResult } from "../browser.js";
import { App } from "./App.js";
import { ConfigApp } from "./ConfigApp.js";

type MainDeps = Omit<CommandDeps, "random"> & {
  random?: () => number;
  openContribution?: () => OpenContributionResult;
};

function run(element: React.ReactElement, resolveWith: (code: number) => void) {
  return element;
}

export async function startTui(deps: MainDeps): Promise<number> {
  return new Promise<number>((resolve) => {
    let settled = false;
    const finish = (code: number) => {
      if (settled) return;
      settled = true;
      instance.unmount();
      resolve(code);
    };

    const instance = render(
      <App
        registry={deps.registry}
        skipped={deps.skipped}
        t={deps.t}
        locale={deps.locale}
        config={deps.config}
        onExit={finish}
        cwd={deps.cwd}
        home={deps.home}
        random={deps.random}
        onCreate={deps.openContribution ?? (() => openContributionPage())}
      />,
      { exitOnCtrlC: false },
    );

    void instance.waitUntilExit().then(() => finish(0));
  });
}

export async function startConfigTui(
  deps: Omit<CommandDeps, "registry" | "skipped" | "random">,
): Promise<number> {
  return new Promise<number>((resolve) => {
    let settled = false;
    const finish = (code: number) => {
      if (settled) return;
      settled = true;
      instance.unmount();
      resolve(code);
    };

    const instance = render(
      <ConfigApp
        t={deps.t}
        locale={deps.locale}
        localeSource={deps.localeSource}
        initialConfig={deps.config}
        configPath={deps.configPath}
        cachePath={deps.cachePath}
        cacheAgeMs={deps.cacheAgeMs}
        onExit={finish}
        cwd={deps.cwd}
        home={deps.home}
      />,
      { exitOnCtrlC: false },
    );

    void instance.waitUntilExit().then(() => finish(0));
  });
}
