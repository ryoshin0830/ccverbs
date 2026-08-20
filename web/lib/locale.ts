"use client";

import { negotiate, type SupportedLocale } from "@ccverbs/i18n/locales.js";

const STORAGE_KEY = "ccverbs.locale";

/**
 * The locale to render in. A previous explicit choice wins, then the browser's
 * own preference order, then English. Reuses the CLI's negotiate() so the web
 * app and the terminal agree on what "zh-TW" or "ja-JP" mean.
 */
export function detectLocale(): SupportedLocale {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const hit = negotiate(stored);
    if (hit) return hit;
  }
  for (const tag of navigator.languages ?? [navigator.language]) {
    const hit = negotiate(tag);
    if (hit) return hit;
  }
  return "en";
}

export function rememberLocale(locale: SupportedLocale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Private browsing can refuse storage; the choice just will not persist.
  }
}
