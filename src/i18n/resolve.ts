import { isSupportedLocale, negotiate, type SupportedLocale } from "./locales.js";
import { queryOsLocales } from "./os.js";

export type LocaleSource =
  | "flag"
  | "env"
  | "config"
  | "posix-env"
  | "os"
  | "intl"
  | "default";

export interface ResolveLocaleDeps {
  flagLang?: string | undefined;
  configLanguage?: string | undefined;
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  intlLocale?: string;
  queryOs?: () => string[];
}

const POSIX_VARS = ["LC_ALL", "LC_MESSAGES", "LANG", "LANGUAGE"] as const;

/**
 * Decide which of the five shipped locales to render in, and say where that
 * decision came from so `ccverbs config` can explain itself.
 *
 * Every input is injectable; nothing here reads ambient state unless asked to.
 */
export function resolveLocale(deps: ResolveLocaleDeps = {}): {
  locale: SupportedLocale;
  source: LocaleSource;
} {
  const env = deps.env ?? process.env;
  const platform = deps.platform ?? process.platform;

  if (deps.flagLang) {
    const hit = negotiate(deps.flagLang);
    if (hit) return { locale: hit, source: "flag" };
  }

  if (env.CCVERBS_LANG) {
    const hit = negotiate(env.CCVERBS_LANG);
    if (hit) return { locale: hit, source: "env" };
  }

  if (deps.configLanguage && deps.configLanguage !== "auto") {
    if (isSupportedLocale(deps.configLanguage)) {
      return { locale: deps.configLanguage, source: "config" };
    }
  }

  for (const name of POSIX_VARS) {
    const value = env[name];
    if (!value) continue;
    const hit = negotiate(value);
    if (hit) return { locale: hit, source: "posix-env" };
  }

  if (!env.CCVERBS_NO_OS_LOCALE) {
    const tags = deps.queryOs ? deps.queryOs() : queryOsLocales({ platform });
    for (const tag of tags) {
      const hit = negotiate(tag);
      if (hit) return { locale: hit, source: "os" };
    }
  }

  const intlLocale = deps.intlLocale ?? Intl.DateTimeFormat().resolvedOptions().locale;
  const fromIntl = negotiate(intlLocale);
  if (fromIntl) return { locale: fromIntl, source: "intl" };

  return { locale: "en", source: "default" };
}
