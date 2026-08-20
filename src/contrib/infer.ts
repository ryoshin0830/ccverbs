import type { SetCategory, SetLanguage } from "./types.js";

// Dependency-free by design: the web app imports this into a browser bundle.

const KANA = /[぀-ヿㇰ-ㇿ]/;
const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힣]/;
const IDEOGRAPH = /[㐀-䶿一-鿿豈-﫿]/;
/**
 * A run of two or more ASCII graphic characters. Two, not one, so that a lone
 * digit in "1つ目" or the hyphen inside a " - " separator does not count — but
 * regex syntax like "{2,5}" and "(?:...)" does, which is the whole point: a
 * technical term is not always made of letters.
 */
const ASCII_RUN = /[!-~]{2,}/;

/** Separators a term-and-translation verb uses. All require surrounding space
 *  so that hyphenated words like "Yo-ho-hoin'" are not mistaken for one. */
const SEPARATORS = [" — ", " – ", " - ", ": ", " / ", " · "];

/**
 * Read the set's language off the verbs themselves.
 *
 * The contributor should not have to answer a question the words already
 * answer. A script that appears at all decides the language; an ASCII term
 * appearing in most verbs alongside another script means the set pairs a term
 * with its translation, which is what "mixed" records.
 */
export function inferLanguage(verbs: string[]): SetLanguage {
  if (verbs.length === 0) return "en";

  const hasKana = verbs.some((v) => KANA.test(v));
  const hasHangul = verbs.some((v) => HANGUL.test(v));
  const hasIdeograph = verbs.some((v) => IDEOGRAPH.test(v));

  const withAsciiTerm = verbs.filter((v) => ASCII_RUN.test(v)).length;
  const pairsWithTerm = withAsciiTerm / verbs.length >= 0.5;

  const primary: SetLanguage | null = hasHangul
    ? "ko"
    : hasKana
      ? "ja"
      : hasIdeograph
        ? "zh-Hans"
        : null;

  if (primary === null) return "en";
  return pairsWithTerm ? "mixed" : primary;
}

/**
 * A verb that pairs a term with its meaning is a flashcard. Most of the set has
 * to look that way, so one stray dash does not reclassify a joke set.
 *
 * Only meme and study can be read off the verbs. `classic` means "a
 * general-purpose replacement for the built-in list", which is an editorial
 * intent no amount of text analysis reveals — the contributor picks that.
 */
export function inferCategory(verbs: string[]): SetCategory {
  if (verbs.length === 0) return "meme";
  const withSeparator = verbs.filter((v) => SEPARATORS.some((s) => v.includes(s))).length;
  return withSeparator / verbs.length >= 0.6 ? "study" : "meme";
}

const STUDY_EMOJI = ["🌿", "🎡", "🐳", "🐧", "📘", "🎓", "🧮", "🔍", "📈", "🔷", "🦀", "🌐"];
const MEME_EMOJI_JA = ["🪨", "🐈", "🍜", "🐙", "🗾", "🍡", "🎋", "🦊", "🐉", "🌸"];
const MEME_EMOJI_KO = ["🐯", "🍲", "🎏", "🐰", "🌙", "🍑", "🐣", "🎐"];
const MEME_EMOJI_ZH = ["🐼", "🥟", "🏮", "🐉", "🍵", "🎴", "🀄", "🧨"];
const MEME_EMOJI_EN = ["🦜", "🌃", "🛸", "🧙", "🎩", "🦖", "🍕", "🎸", "👻", "🧊"];
const CLASSIC_EMOJI = ["🗾", "🌍", "✨", "🕰", "📖", "🧭", "🪄", "🎯"];

/**
 * Emoji worth offering for this kind of set, so the contributor clicks instead
 * of wondering what to type. Single codepoints only: flags and ZWJ sequences
 * render at inconsistent widths in terminals.
 */
export function suggestEmoji(language: SetLanguage, category: SetCategory): string[] {
  if (category === "classic") return CLASSIC_EMOJI;
  if (category === "study") return STUDY_EMOJI;
  if (language === "ko") return MEME_EMOJI_KO;
  if (language === "zh-Hans" || language === "zh-Hant") return MEME_EMOJI_ZH;
  if (language === "ja") return MEME_EMOJI_JA;
  return MEME_EMOJI_EN;
}
