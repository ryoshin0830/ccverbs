import type { SupportedLocale } from "./i18n/locales.js";
import type { VerbSet } from "./registry/schema.js";

export function searchSets(sets: VerbSet[], query: string): VerbSet[] {
  const q = query.trim().toLowerCase();
  if (!q) return sets;
  return sets.filter((s) =>
    [s.id, s.name, s.description, ...s.tags].some((f) => f.toLowerCase().includes(q)),
  );
}

export function findSet(sets: VerbSet[], id: string): VerbSet | null {
  return sets.find((s) => s.id === id) ?? null;
}

export function pickRandom(sets: VerbSet[], random: () => number = Math.random): VerbSet {
  if (sets.length === 0) throw new Error("no verb sets available");
  const set = sets[Math.min(sets.length - 1, Math.floor(random() * sets.length))];
  if (!set) throw new Error("no verb sets available");
  return set;
}

/**
 * Sets in the reader's own language first, then the mixed term-and-translation
 * sets, then everything else; alphabetical within each band. Nothing is hidden
 * and search still spans every set. JSON output deliberately does not use this,
 * so an agent's view does not change with the user's locale.
 */
export function groupByLocale(sets: VerbSet[], locale: SupportedLocale): VerbSet[] {
  const band = (s: VerbSet) => (s.language === locale ? 0 : s.language === "mixed" ? 1 : 2);
  return [...sets].sort((a, b) => band(a) - band(b) || a.id.localeCompare(b.id));
}
