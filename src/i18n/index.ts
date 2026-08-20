import { en, type Catalog } from "./en.js";
import { ja } from "./ja.js";
import { ko } from "./ko.js";
import type { SupportedLocale } from "./locales.js";
import { zhHans } from "./zh-Hans.js";
import { zhHant } from "./zh-Hant.js";

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

export { en };
export type { Catalog };
