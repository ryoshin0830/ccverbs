import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// This script must run before any build, so it cannot import the TypeScript
// schema. It restates the same rules in plain JS to give contributors a fast,
// dependency-free check; tests/sets.test.ts is the authoritative gate.

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;
const TRAILING_ELLIPSIS = /(…|\.\.\.|。)$/;
const LANGUAGES = new Set(["ja", "en", "zh-Hans", "zh-Hant", "ko", "mixed"]);
const CATEGORIES = new Set(["meme", "study", "classic"]);
const MAX_WIDTH = 40;
const MAX_INDEX_BYTES = 500_000;

function displayWidth(text) {
  let width = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0);
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

const dir = join(process.cwd(), "sets");
const files = readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "index.json");

const errors = [];
const warnings = [];
const ids = new Set();

for (const file of files.sort()) {
  const where = `sets/${file}`;
  let set;
  try {
    set = JSON.parse(readFileSync(join(dir, file), "utf8"));
  } catch (error) {
    errors.push(`${where}: invalid JSON - ${error.message}`);
    continue;
  }

  if (typeof set.id !== "string" || !KEBAB.test(set.id)) {
    errors.push(`${where}: id must be kebab-case`);
  }
  if (`${set.id}.json` !== file) {
    errors.push(`${where}: id "${set.id}" does not match the filename`);
  }
  if (ids.has(set.id)) errors.push(`${where}: duplicate id "${set.id}"`);
  ids.add(set.id);

  for (const field of ["name", "emoji", "description"]) {
    if (typeof set[field] !== "string" || set[field].length === 0) {
      errors.push(`${where}: ${field} is required`);
    }
  }
  if (!LANGUAGES.has(set.language)) {
    errors.push(`${where}: language must be ja, en, or mixed`);
  }
  if (!CATEGORIES.has(set.category)) {
    errors.push(`${where}: category must be meme, study, or classic`);
  }
  if (!Array.isArray(set.tags) || set.tags.some((t) => typeof t !== "string" || !KEBAB.test(t))) {
    errors.push(`${where}: tags must be an array of kebab-case strings`);
  }

  if (set.i18n !== undefined) {
    const locales = new Set(["en", "ja", "zh-Hans", "zh-Hant", "ko"]);
    if (typeof set.i18n !== "object" || set.i18n === null || Array.isArray(set.i18n)) {
      errors.push(`${where}: i18n must be an object keyed by locale`);
    } else {
      for (const [locale, block] of Object.entries(set.i18n)) {
        if (!locales.has(locale)) {
          errors.push(`${where}: i18n has an unknown locale "${locale}"`);
          continue;
        }
        if (typeof block !== "object" || block === null || Array.isArray(block)) {
          errors.push(`${where}: i18n.${locale} must be an object`);
          continue;
        }
        for (const [field, value] of Object.entries(block)) {
          if (field !== "name" && field !== "description") {
            errors.push(`${where}: i18n.${locale} has an unknown field "${field}"`);
          } else if (typeof value !== "string" || value.length === 0) {
            errors.push(`${where}: i18n.${locale}.${field} must be a non-empty string`);
          }
        }
      }
    }
  }

  if (!Array.isArray(set.verbs) || set.verbs.length === 0) {
    errors.push(`${where}: verbs must be a non-empty array`);
    continue;
  }
  if (new Set(set.verbs).size !== set.verbs.length) {
    errors.push(`${where}: verbs contains duplicates`);
  }
  for (const verb of set.verbs) {
    if (typeof verb !== "string" || verb.length === 0) {
      errors.push(`${where}: every verb must be a non-empty string`);
    } else if (verb !== verb.trim()) {
      errors.push(`${where}: "${verb}" has leading or trailing whitespace`);
    } else if (CONTROL_CHARS.test(verb)) {
      errors.push(`${where}: "${verb}" contains a control character`);
    } else if (TRAILING_ELLIPSIS.test(verb)) {
      errors.push(`${where}: "${verb}" must not end with an ellipsis - Claude Code appends one`);
    } else if (displayWidth(verb) > MAX_WIDTH) {
      warnings.push(`${where}: "${verb}" is ${displayWidth(verb)} columns wide (over ${MAX_WIDTH})`);
    }
  }
}

try {
  const bytes = statSync(join(dir, "index.json")).size;
  if (bytes > MAX_INDEX_BYTES) {
    warnings.push(`sets/index.json is ${Math.round(bytes / 1024)} KB - consider splitting it`);
  }
} catch {
  errors.push("sets/index.json is missing - run `npm run sets:index`");
}

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
console.log(`${files.length} sets checked, ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length > 0 ? 1 : 0);
