import type { SupportedLocale } from "@ccverbs/i18n/locales.js";
import { SUPPORTED_LOCALES } from "@ccverbs/i18n/locales.js";
import { en, type Catalog } from "./en";
import { ja } from "./ja";
import { ko } from "./ko";
import { zhHans } from "./zh-Hans";
import { zhHant } from "./zh-Hant";

// Data only. Browser detection lives in ./detect so this module graph stays
// DOM-free and can be typechecked alongside the CLI.

const CATALOGS: Record<SupportedLocale, Catalog> = {
  en,
  ja,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
  ko,
};

export function getCatalog(locale: SupportedLocale): Catalog {
  return CATALOGS[locale];
}

export { SUPPORTED_LOCALES };
export type { Catalog, SupportedLocale };
