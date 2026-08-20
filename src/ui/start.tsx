import { render } from "ink";
import type { Options } from "../args.js";
import type { RegistryIndex } from "../registry/schema.js";
import { App } from "./App.js";

export async function startTui(
  registry: RegistryIndex,
  skipped: string[],
  options: Options,
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
      <App
        registry={registry}
        skipped={skipped}
        onExit={finish}
        initialMode={options.mode}
        initialScope={options.scope}
      />,
      { exitOnCtrlC: false },
    );

    void instance.waitUntilExit().then(() => finish(0));
  });
}
