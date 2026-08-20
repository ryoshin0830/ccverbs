/**
 * The English catalog, and the Catalog type. Every other locale is annotated
 * with `Catalog`, so a missing key is a compile error naming the property.
 *
 * No `as const` on the outer object: it would freeze each string into a literal
 * type and force the translations to repeat the English text.
 */
export const en = {
  meta: { nativeName: "English", reviewed: true },

  header: {
    tagline: "Choose the words Claude Code shows you while it works.",
    languageLabel: "Language",
  },

  preview: {
    empty: "Write a word below and it appears here, exactly as Claude Code will show it.",
    columns: (width: number, max: number) => `${width} of ${max} columns`,
    tooWide: "over 40 — the timer gets pushed off screen",
    pause: "pause",
    play: "play",
    previous: "previous word",
    next: "next word",
    ruler: "40",
  },

  words: {
    heading: "Write the words",
    hint: "One per line. Claude Code adds the … itself.",
    placeholder: "筋トレしています\nプロテインを飲んでいます\nダンベルを見つめています",
    count: (n: number) => `${n} words`,
    allClear: "all within 40 columns",
    toFix: (n: number) => `${n} to fix`,
    empty: "Paste or type your list to begin.",
  },

  issues: {
    "trailing-ellipsis": () => "Remove the trailing … — Claude Code adds it.",
    "too-wide": (width: number) => `${width} columns. Trim it to 40.`,
    duplicate: () => "Already in this list.",
    "control-char": () => "Contains a control character.",
    "too-long": () => "Over 120 characters.",
  },

  name: {
    heading: "Name it",
    nameLabel: "Name",
    namePlaceholder: "Gym",
    idLabel: "File",
    descriptionLabel: "One line about it",
    descriptionPlaceholder: "What someone at the gym mutters between sets",
    emojiLabel: "Pick an emoji",
    emojiOther: "or type one",
  },

  inferred: {
    heading: "Read from your words",
    change: "Adjust",
    hide: "Done",
    language: "Language",
    category: "Kind",
    idNote: "Ids are unique across the repo. If yours is taken, the pull request will say so.",
    languages: {
      ja: "Japanese",
      en: "English",
      "zh-Hans": "Simplified Chinese",
      "zh-Hant": "Traditional Chinese",
      ko: "Korean",
      mixed: "A term and its translation",
    },
    categories: {
      meme: "For fun",
      study: "A flashcard you read for free",
      classic: "A general-purpose replacement",
    },
  },

  optional: {
    toggle: "Credit yourself, add tags",
    tagsLabel: "Tags",
    tagsHint: "comma separated, up to 8",
    authorLabel: "Your name",
    githubLabel: "GitHub handle",
    sourceLabel: "Where it came from",
    sourcePlaceholder: "https://",
  },

  send: {
    heading: "Send it",
    notReady: "Finish the two steps above and the button appears here.",
    button: "Open a pull request on GitHub",
    afterButton:
      "GitHub opens with the file already written. Without write access it offers to fork first — that is the normal path. Then press “Propose new file”.",
    tooLong: (length: number) =>
      `This list is too long to carry in a link (${length} characters). Copy it instead:`,
    tooLongStep1: "Copy the JSON.",
    tooLongStep2: "Open the new file page and paste it.",
    tooLongLink: "Open the new file page",
    copy: "Copy JSON",
    copied: "Copied",
    download: "Download",
    showJson: "See the file",
    charCount: (length: number) => `${length} character link`,
  },

  errors: {
    id: {
      empty: "A file name is required.",
      shape: "Lowercase letters, numbers and single hyphens, like ja-gym.",
    },
    name: { empty: "A name is required.", long: "Keep it under 41 characters." },
    emoji: { empty: "Pick an emoji.", many: "One emoji, not several." },
    description: { empty: "One line describing the set.", long: "Keep it under 121 characters." },
    tags: { many: "Up to 8 tags.", shape: "Lowercase words, optionally hyphenated." },
    source: { shape: "A full http(s) URL, or leave it empty." },
    verbs: { empty: "Add at least one word.", many: "At most 500 words." },
  },

  footer: {
    cli: "Already have a set in mind? The CLI applies any of them:",
    repo: "Source and the 23 sets that ship",
  },
};

export type Catalog = typeof en;
