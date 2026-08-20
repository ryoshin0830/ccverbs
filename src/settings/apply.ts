import { DEFAULT_VERB_COUNT } from "../constants.js";
import type { VerbSet } from "../registry/schema.js";

export interface SpinnerVerbs {
  mode: "replace" | "append";
  verbs: string[];
}

export function readSpinnerVerbs(data: Record<string, unknown>): SpinnerVerbs | null {
  const value = data.spinnerVerbs;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const { mode, verbs } = value as Partial<SpinnerVerbs>;
  if (mode !== "replace" && mode !== "append") return null;
  if (!Array.isArray(verbs) || verbs.some((v) => typeof v !== "string")) return null;
  return { mode, verbs };
}

export function applySpinnerVerbs(
  data: Record<string, unknown>,
  next: SpinnerVerbs,
): Record<string, unknown> {
  if (!("spinnerVerbs" in data)) return { ...data, spinnerVerbs: next };
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, k === "spinnerVerbs" ? next : v]),
  );
}

export function removeSpinnerVerbs(data: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...data };
  delete copy.spinnerVerbs;
  return copy;
}

export function effectiveVerbCount(v: SpinnerVerbs | null): number {
  if (!v) return DEFAULT_VERB_COUNT;
  if (v.mode === "replace") return v.verbs.length > 0 ? v.verbs.length : DEFAULT_VERB_COUNT;
  return DEFAULT_VERB_COUNT + v.verbs.length;
}

export function matchSet(v: SpinnerVerbs | null, sets: VerbSet[]): VerbSet | null {
  if (!v || v.verbs.length === 0) return null;
  const key = JSON.stringify([...v.verbs].sort());
  return sets.find((s) => JSON.stringify([...s.verbs].sort()) === key) ?? null;
}
