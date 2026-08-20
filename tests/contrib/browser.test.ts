import { describe, expect, it } from "vitest";
import {
  browserInvocation,
  CONTRIBUTION_WEB_URL,
  openContributionPage,
} from "../../src/browser.js";

describe("contribution browser launcher", () => {
  it("uses the published contribution app by default", () => {
    expect(CONTRIBUTION_WEB_URL).toBe("https://ccverbs.lolipop-now.app/");
  });

  it.each([
    ["darwin", "open", [CONTRIBUTION_WEB_URL]],
    ["linux", "xdg-open", [CONTRIBUTION_WEB_URL]],
    ["win32", "cmd.exe", ["/c", "start", "", CONTRIBUTION_WEB_URL]],
  ] as const)("builds a safe invocation on %s", (platform, command, args) => {
    expect(browserInvocation(CONTRIBUTION_WEB_URL, platform)).toEqual({ command, args });
  });

  it("returns a manual URL when the browser command fails", () => {
    const result = openContributionPage(
      CONTRIBUTION_WEB_URL,
      "linux",
      () => ({ status: 1, error: undefined }),
    );
    expect(result).toEqual({
      ok: false,
      url: CONTRIBUTION_WEB_URL,
      error: "browser command exited with status 1",
    });
  });

  it("reports a successful launch", () => {
    const result = openContributionPage(
      CONTRIBUTION_WEB_URL,
      "darwin",
      () => ({ status: 0, error: undefined }),
    );
    expect(result).toEqual({ ok: true, url: CONTRIBUTION_WEB_URL });
  });
});
