// Terminal width measurement. Deliberately dependency-free: the contribution
// web app imports this from a browser bundle where the app's node_modules are
// not on the resolution path, so pulling in zod here would break its build.

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
