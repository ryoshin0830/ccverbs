import type { FieldErrorCode } from "@ccverbs/contrib/types.js";
import type { Catalog } from "@/i18n";

/**
 * Turn a validator code into a sentence in the reader's language. The validator
 * deliberately does not know any wording, so this is the only place field
 * errors become words.
 */
export function messageFor(
  code: FieldErrorCode | undefined,
  t: Catalog,
): string | undefined {
  if (!code) return undefined;
  switch (code) {
    case "id.empty":
      return t.errors.id.empty;
    case "id.shape":
      return t.errors.id.shape;
    case "name.empty":
      return t.errors.name.empty;
    case "name.long":
      return t.errors.name.long;
    case "emoji.empty":
      return t.errors.emoji.empty;
    case "emoji.many":
      return t.errors.emoji.many;
    case "description.empty":
      return t.errors.description.empty;
    case "description.long":
      return t.errors.description.long;
    case "tags.many":
      return t.errors.tags.many;
    case "tags.shape":
      return t.errors.tags.shape;
    case "source.shape":
      return t.errors.source.shape;
    case "verbs.empty":
      return t.errors.verbs.empty;
    case "verbs.many":
      return t.errors.verbs.many;
    // language and category cannot be wrong through the UI: both are chosen
    // from a select whose options are the valid set.
    case "language.invalid":
    case "category.invalid":
      return undefined;
  }
}

/** Every field error, already worded. */
export function messagesFor(
  fieldErrors: Partial<Record<string, FieldErrorCode>>,
  t: Catalog,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [field, code] of Object.entries(fieldErrors)) {
    const message = messageFor(code, t);
    if (message) out[field] = message;
  }
  return out;
}
