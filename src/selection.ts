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
