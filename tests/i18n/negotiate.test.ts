import { describe, expect, it } from "vitest";
import { isSupportedLocale, negotiate, SUPPORTED_LOCALES } from "../../src/i18n/locales.js";

describe("negotiate", () => {
  it.each([
    ["en", "en"], ["en-US", "en"], ["en_GB.UTF-8", "en"], ["EN-us", "en"],
    ["ja", "ja"], ["ja-JP", "ja"], ["ja_JP.UTF-8", "ja"],
    ["zh-Hans", "zh-Hans"], ["zh-Hans-JP", "zh-Hans"], ["zh-CN", "zh-Hans"],
    ["zh-SG", "zh-Hans"], ["zh_CN.UTF-8", "zh-Hans"], ["zh", "zh-Hans"],
    ["zh-Hant", "zh-Hant"], ["zh-TW", "zh-Hant"], ["zh-HK", "zh-Hant"],
    ["zh-MO", "zh-Hant"], ["zh-Hant-HK", "zh-Hant"],
    ["ko", "ko"], ["ko-KR", "ko"], ["ko_KR.UTF-8", "ko"],
  ])("resolves %s to %s", (tag, expected) => {
    expect(negotiate(tag)).toBe(expected);
  });

  it.each(["C", "POSIX", "c", "posix", "", "   ", "fr-FR", "de", "es", "xx"])(
    "returns null for %s because it is not a language we ship",
    (tag) => {
      expect(negotiate(tag)).toBeNull();
    },
  );

  it("strips an @modifier suffix", () => {
    expect(negotiate("ja_JP.UTF-8@calendar=japanese")).toBe("ja");
  });

  it("prefers simplified for a bare zh", () => {
    expect(negotiate("zh")).toBe("zh-Hans");
  });
});

describe("SUPPORTED_LOCALES", () => {
  it("lists exactly five locales with en first", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "ja", "zh-Hans", "zh-Hant", "ko"]);
  });
});

describe("isSupportedLocale", () => {
  it("accepts a shipped locale", () => {
    expect(isSupportedLocale("ja")).toBe(true);
  });
  it.each([["auto"], ["fr"], [null], [42]])("rejects %s", (v) => {
    expect(isSupportedLocale(v)).toBe(false);
  });
});
