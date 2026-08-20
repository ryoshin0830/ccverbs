import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { RegistryIndex } from "./schema.js";

export function readCache(file: string): { index: unknown; ageMs: number } | null {
  try {
    const raw = readFileSync(file, "utf8");
    const ageMs = Date.now() - statSync(file).mtimeMs;
    return { index: JSON.parse(raw), ageMs };
  } catch {
    return null;
  }
}

export function writeCache(file: string, index: RegistryIndex): void {
  try {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(index));
  } catch {
    // A read-only cache directory must never break the command.
  }
}

export function isFresh(ageMs: number, ttlMs: number): boolean {
  return ageMs < ttlMs;
}
