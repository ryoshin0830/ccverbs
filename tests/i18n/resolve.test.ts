import { describe, expect, it, vi } from "vitest";
import { resolveLocale } from "../../src/i18n/resolve.js";

const base = {
  env: {} as NodeJS.ProcessEnv,
  platform: "linux" as NodeJS.Platform,
  intlLocale: "en-US",
  queryOs: () => [] as string[],
};

describe("resolveLocale", () => {
  it("prefers the --lang flag over everything", () => {
    expect(
      resolveLocale({ ...base, flagLang: "ko", configLanguage: "ja", env: { LANG: "en_US.UTF-8" } }),
    ).toEqual({ locale: "ko", source: "flag" });
  });

  it("falls through when the flag is not a shipped locale", () => {
    expect(resolveLocale({ ...base, flagLang: "fr", configLanguage: "ja" })).toEqual({
      locale: "ja",
      source: "config",
    });
  });

  it("uses CCVERBS_LANG next", () => {
    expect(
      resolveLocale({ ...base, env: { CCVERBS_LANG: "zh-Hant" }, configLanguage: "ja" }),
    ).toEqual({ locale: "zh-Hant", source: "env" });
  });

  it("uses the config value", () => {
    expect(resolveLocale({ ...base, configLanguage: "zh-Hans" })).toEqual({
      locale: "zh-Hans",
      source: "config",
    });
  });

  it('skips the config value when it is "auto"', () => {
    expect(
      resolveLocale({ ...base, configLanguage: "auto", env: { LANG: "ja_JP.UTF-8" } }),
    ).toEqual({ locale: "ja", source: "posix-env" });
  });

  it("reads LC_ALL before LC_MESSAGES before LANG before LANGUAGE", () => {
    expect(
      resolveLocale({
        ...base,
        env: { LC_ALL: "ko_KR.UTF-8", LC_MESSAGES: "ja_JP.UTF-8", LANG: "en_US.UTF-8" },
      }),
    ).toEqual({ locale: "ko", source: "posix-env" });
    expect(
      resolveLocale({ ...base, env: { LC_MESSAGES: "ja_JP.UTF-8", LANG: "en_US.UTF-8" } }),
    ).toEqual({ locale: "ja", source: "posix-env" });
    expect(resolveLocale({ ...base, env: { LANGUAGE: "ja" } })).toEqual({
      locale: "ja",
      source: "posix-env",
    });
  });

  // The bug this whole chain exists for.
  it("does not treat LANG=C.UTF-8 as English and reaches the OS instead", () => {
    const queryOs = vi.fn().mockReturnValue(["ja-JP", "zh-Hans-JP"]);
    expect(
      resolveLocale({ ...base, platform: "darwin", env: { LANG: "C.UTF-8" }, queryOs }),
    ).toEqual({ locale: "ja", source: "os" });
    expect(queryOs).toHaveBeenCalledOnce();
  });

  it.each(["C", "POSIX", ""])("treats LANG=%s as no preference", (value) => {
    const queryOs = vi.fn().mockReturnValue(["ko-KR"]);
    expect(resolveLocale({ ...base, env: { LANG: value }, queryOs })).toEqual({
      locale: "ko",
      source: "os",
    });
  });

  it("takes the first OS tag it can resolve", () => {
    const queryOs = () => ["fr-FR", "zh-Hant-HK"];
    expect(resolveLocale({ ...base, queryOs })).toEqual({ locale: "zh-Hant", source: "os" });
  });

  it("falls back to the Intl locale", () => {
    expect(resolveLocale({ ...base, intlLocale: "ja-JP" })).toEqual({
      locale: "ja",
      source: "intl",
    });
  });

  it("ends at en", () => {
    expect(resolveLocale({ ...base, intlLocale: "fr-FR" })).toEqual({
      locale: "en",
      source: "default",
    });
  });

  it("does not query the OS when an earlier rung already decided", () => {
    const queryOs = vi.fn();
    resolveLocale({ ...base, configLanguage: "ja", queryOs });
    expect(queryOs).not.toHaveBeenCalled();
  });

  it("skips the OS query when CCVERBS_NO_OS_LOCALE is set", () => {
    const queryOs = vi.fn().mockReturnValue(["ja-JP"]);
    expect(
      resolveLocale({ ...base, env: { CCVERBS_NO_OS_LOCALE: "1" }, intlLocale: "ko-KR", queryOs }),
    ).toEqual({ locale: "ko", source: "intl" });
    expect(queryOs).not.toHaveBeenCalled();
  });
});
