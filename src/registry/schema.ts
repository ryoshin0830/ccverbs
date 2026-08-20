import { z } from "zod";
import type { SupportedLocale } from "../i18n/locales.js";

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const TRAILING_ELLIPSIS = /(…|\.\.\.|。)$/;
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Terminal columns a string occupies; CJK and emoji count as two. */
export function displayWidth(text: string): number {
  let width = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    const wide =
      (cp >= 0x1100 && cp <= 0x115f) ||
      (cp >= 0x2e80 && cp <= 0xa4cf) ||
      (cp >= 0xac00 && cp <= 0xd7a3) ||
      (cp >= 0xf900 && cp <= 0xfaff) ||
      (cp >= 0xfe30 && cp <= 0xfe6f) ||
      (cp >= 0xff00 && cp <= 0xff60) ||
      (cp >= 0xffe0 && cp <= 0xffe6) ||
      (cp >= 0x1f300 && cp <= 0x1faff);
    width += wide ? 2 : 1;
  }
  return width;
}

const verbSchema = z
  .string()
  .min(1)
  .max(120)
  .refine((v) => v === v.trim(), "must not have leading or trailing whitespace")
  .refine((v) => !CONTROL_CHARS.test(v), "must not contain control characters")
  .refine(
    (v) => !TRAILING_ELLIPSIS.test(v),
    "must not end with an ellipsis - Claude Code appends one itself",
  );

const localizedTextSchema = z.object({
  name: z.string().min(1).max(40).optional(),
  description: z.string().min(1).max(120).optional(),
});

export const verbSetSchema = z.object({
  $schema: z.string().optional(),
  id: z.string().regex(KEBAB, "id must be kebab-case"),
  name: z.string().min(1).max(40),
  emoji: z.string().min(1).max(8),
  description: z.string().min(1).max(120),
  language: z.enum(["ja", "en", "zh-Hans", "zh-Hant", "ko", "mixed"]),
  category: z.enum(["meme", "study", "classic"]),
  tags: z.array(z.string().regex(KEBAB)).max(8),
  author: z.object({ name: z.string().min(1), github: z.string().optional() }).optional(),
  source: z.string().url().optional(),
  i18n: z
    .object({
      en: localizedTextSchema.optional(),
      ja: localizedTextSchema.optional(),
      "zh-Hans": localizedTextSchema.optional(),
      "zh-Hant": localizedTextSchema.optional(),
      ko: localizedTextSchema.optional(),
    })
    .strict()
    .optional(),
  verbs: z
    .array(verbSchema)
    .min(1)
    .max(500)
    .refine((v) => new Set(v).size === v.length, "verbs must be unique within a set"),
});

export type VerbSet = z.infer<typeof verbSetSchema>;

export const registryIndexSchema = z.object({
  schemaVersion: z.number().int().positive(),
  generatedAt: z.string(),
  totalSets: z.number().int().nonnegative(),
  totalVerbs: z.number().int().nonnegative(),
  sets: z.array(verbSetSchema),
});

export type RegistryIndex = z.infer<typeof registryIndexSchema>;

/**
 * A set's display name in the given locale. Falls back per field rather than
 * per locale, so a set that translates only its description still shows a
 * translated description.
 */
export function localizedName(set: VerbSet, locale: SupportedLocale): string {
  return set.i18n?.[locale]?.name ?? set.name;
}

export function localizedDescription(set: VerbSet, locale: SupportedLocale): string {
  return set.i18n?.[locale]?.description ?? set.description;
}

const EMOJI_GRAPHEME = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

/**
 * Layout width in terminal columns, measured per grapheme cluster so that
 * multi-codepoint emoji (flags, ZWJ sequences) count as two columns rather
 * than once per codepoint. Use this for aligning columns; use displayWidth
 * for the verb-length rule.
 */
export function layoutWidth(text: string): number {
  let width = 0;
  for (const { segment } of segmenter.segment(text)) {
    width += EMOJI_GRAPHEME.test(segment) ? 2 : displayWidth(segment);
  }
  return width;
}
