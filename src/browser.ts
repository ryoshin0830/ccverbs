import { spawnSync } from "node:child_process";

/** The hosted, no-login form for creating a verb-set contribution. */
export const CONTRIBUTION_WEB_URL = "https://ccverbs.lolipop-now.app/";

export interface OpenContributionSuccess {
  ok: true;
  url: string;
}

export interface OpenContributionFailure {
  ok: false;
  url: string;
  error: string;
}

export type OpenContributionResult = OpenContributionSuccess | OpenContributionFailure;

export interface BrowserRunResult {
  status: number | null;
  error?: Error;
}

export type BrowserRunner = (command: string, args: string[]) => BrowserRunResult;

export function contributionWebUrl(env: NodeJS.ProcessEnv = process.env): string {
  return env.CCVERBS_CONTRIBUTION_URL?.trim() || CONTRIBUTION_WEB_URL;
}

/** Build an argv array without passing the URL through a shell. */
export function browserInvocation(
  url: string,
  platform: NodeJS.Platform,
): { command: string; args: string[] } {
  if (platform === "darwin") return { command: "open", args: [url] };
  if (platform === "win32") {
    return { command: "cmd.exe", args: ["/c", "start", "", url] };
  }
  return { command: "xdg-open", args: [url] };
}

const runBrowser: BrowserRunner = (command, args) => {
  const result = spawnSync(command, args, { stdio: "ignore" });
  return { status: result.status, ...(result.error ? { error: result.error } : {}) };
};

export function openContributionPage(
  url = contributionWebUrl(),
  platform: NodeJS.Platform = process.platform,
  run: BrowserRunner = runBrowser,
): OpenContributionResult {
  const invocation = browserInvocation(url, platform);
  try {
    const result = run(invocation.command, invocation.args);
    if (result.error) {
      return { ok: false, url, error: `could not open browser: ${result.error.message}` };
    }
    if (result.status !== 0) {
      return {
        ok: false,
        url,
        error: `browser command exited with status ${result.status ?? "unknown"}`,
      };
    }
    return { ok: true, url };
  } catch (error) {
    return { ok: false, url, error: `could not open browser: ${(error as Error).message}` };
  }
}
