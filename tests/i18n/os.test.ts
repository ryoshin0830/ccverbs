import { describe, expect, it, vi } from "vitest";
import { queryOsLocales } from "../../src/i18n/os.js";

const APPLE_OUTPUT = `(
    "ja-JP",
    "zh-Hans-JP"
)
`;

describe("queryOsLocales", () => {
  it("parses the macOS AppleLanguages plist array in order", () => {
    const run = vi.fn().mockReturnValue(APPLE_OUTPUT);
    expect(queryOsLocales({ platform: "darwin", run })).toEqual(["ja-JP", "zh-Hans-JP"]);
    expect(run).toHaveBeenCalledWith("defaults", ["read", "-g", "AppleLanguages"]);
  });

  it("parses a single-entry AppleLanguages array", () => {
    const run = vi.fn().mockReturnValue('(\n    "en-US"\n)\n');
    expect(queryOsLocales({ platform: "darwin", run })).toEqual(["en-US"]);
  });

  it("parses Windows Get-UICulture output", () => {
    const run = vi.fn().mockReturnValue("ja-JP\r\n");
    expect(queryOsLocales({ platform: "win32", run })).toEqual(["ja-JP"]);
  });

  it("returns an empty array on linux without running anything", () => {
    const run = vi.fn();
    expect(queryOsLocales({ platform: "linux", run })).toEqual([]);
    expect(run).not.toHaveBeenCalled();
  });

  it("returns an empty array when the command throws", () => {
    const run = vi.fn().mockImplementation(() => {
      throw new Error("ENOENT");
    });
    expect(queryOsLocales({ platform: "darwin", run })).toEqual([]);
  });

  it("returns an empty array for unparsable output", () => {
    const run = vi.fn().mockReturnValue("wat");
    expect(queryOsLocales({ platform: "darwin", run })).toEqual([]);
  });

  it("returns an empty array for empty output", () => {
    const run = vi.fn().mockReturnValue("");
    expect(queryOsLocales({ platform: "win32", run })).toEqual([]);
  });
});
