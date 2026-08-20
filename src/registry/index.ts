import { z } from "zod";
import { CACHE_FILE, CACHE_TTL_MS, REGISTRY_URL } from "../constants.js";
import { isFresh, readCache, writeCache } from "./cache.js";
import { fetchIndex } from "./fetch.js";
import {
  registryIndexSchema,
  verbSetSchema,
  type RegistryIndex,
  type VerbSet,
} from "./schema.js";

export class RegistryError extends Error {
  constructor(
    message: string,
    readonly code: "registry-unavailable" | "registry-invalid",
  ) {
    super(message);
    this.name = "RegistryError";
  }
}

const envelopeSchema = registryIndexSchema
  .omit({ sets: true })
  .extend({ sets: z.array(z.unknown()) });

function coerce(raw: unknown): { index: RegistryIndex; skipped: string[] } {
  const envelope = envelopeSchema.safeParse(raw);
  if (!envelope.success) throw new RegistryError("registry index is malformed", "registry-invalid");

  const sets: VerbSet[] = [];
  const skipped: string[] = [];
  for (const entry of envelope.data.sets) {
    const parsed = verbSetSchema.safeParse(entry);
    if (parsed.success) sets.push(parsed.data);
    else skipped.push(String((entry as { id?: unknown } | null)?.id ?? "<unknown>"));
  }
  if (sets.length === 0) throw new RegistryError("no valid verb sets", "registry-invalid");

  sets.sort((a, b) => a.id.localeCompare(b.id));
  return {
    index: {
      ...envelope.data,
      sets,
      totalSets: sets.length,
      totalVerbs: sets.reduce((n, s) => n + s.verbs.length, 0),
    },
    skipped,
  };
}

export interface LoadOptions {
  refresh?: boolean;
  offline?: boolean;
  url?: string;
  cacheFile?: string;
  fetchImpl?: (url: string) => Promise<unknown>;
}

export async function loadRegistry(
  opts: LoadOptions = {},
): Promise<{ index: RegistryIndex; source: "network" | "cache"; skipped: string[] }> {
  const file = opts.cacheFile ?? CACHE_FILE;
  const cached = readCache(file);

  if (!opts.refresh && cached && isFresh(cached.ageMs, CACHE_TTL_MS)) {
    return { ...coerce(cached.index), source: "cache" };
  }

  if (opts.offline) {
    if (!cached) throw new RegistryError("no cached registry available", "registry-unavailable");
    return { ...coerce(cached.index), source: "cache" };
  }

  try {
    const raw = await (opts.fetchImpl ?? fetchIndex)(opts.url ?? REGISTRY_URL);
    const result = coerce(raw);
    writeCache(file, result.index);
    return { ...result, source: "network" };
  } catch (error) {
    if (error instanceof RegistryError && !cached) throw error;
    if (cached) return { ...coerce(cached.index), source: "cache" };
    throw new RegistryError(
      `could not reach the verb set registry: ${(error as Error).message}`,
      "registry-unavailable",
    );
  }
}
