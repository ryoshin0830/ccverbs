"use client";

import type { Catalog } from "@/i18n";

interface EmojiPickerProps {
  value: string;
  options: string[];
  error?: string;
  t: Catalog;
  onChange: (emoji: string) => void;
}

/** Clicking beats typing: the contributor should not have to wonder what to put. */
export function EmojiPicker({ value, options, error, t, onChange }: EmojiPickerProps) {
  return (
    <div className="field">
      <span className="label">{t.name.emojiLabel}</span>
      <div className="emoji-row" role="group" aria-label={t.name.emojiLabel}>
        {options.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className={`emoji${emoji === value ? " emoji-on" : ""}`}
            aria-pressed={emoji === value}
            onClick={() => onChange(emoji)}
          >
            {emoji}
          </button>
        ))}
        <input
          className="emoji-own"
          value={options.includes(value) ? "" : value}
          placeholder={t.name.emojiOther}
          aria-label={t.name.emojiOther}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {error && <p className="note note-bad">{error}</p>}
    </div>
  );
}
