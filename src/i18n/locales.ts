export type SupportedLocale = "en" | "ja" | "zh-Hans" | "zh-Hant" | "ko";

export const SUPPORTED_LOCALES = ["en", "ja", "zh-Hans", "zh-Hant", "ko"] as const;

/** Locales not yet reviewed by a native speaker. See the spec, section 3.6. */
export const UNREVIEWED_LOCALES = ["zh-Hans", "zh-Hant", "ko"] as const;

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Regions that write Chinese with traditional characters. */
const HANT_REGIONS = new Set(["tw", "hk", "mo"]);

/**
 * Resolve a BCP 47 tag to one of the five locales we ship, or null.
 *
 * "C" and "POSIX" mean "no locale configured" and must NOT resolve to English:
 * a Japanese Mac reports LANG=C.UTF-8 while its actual UI language is Japanese,
 * so treating C as English would show that user the wrong language.
 */
export function negotiate(tag: string): SupportedLocale | null {
  const withoutModifier = tag.trim().replace(/_/g, "-").split("@")[0] ?? "";
  const cleaned = (withoutModifier.split(".")[0] ?? "").toLowerCase();
  if (!cleaned) return null;

  const parts = cleaned.split("-").filter(Boolean);
  const language = parts[0];
  if (!language) return null;

  if (language === "c" || language === "posix") return null;

  if (language === "en") return "en";
  if (language === "ja") return "ja";
  if (language === "ko") return "ko";

  if (language === "zh") {
    const script = parts.find((p) => p === "hans" || p === "hant");
    if (script === "hant") return "zh-Hant";
    if (script === "hans") return "zh-Hans";
    const region = parts.slice(1).find((p) => p.length === 2);
    if (region && HANT_REGIONS.has(region)) return "zh-Hant";
    return "zh-Hans";
  }

  return null;
}
