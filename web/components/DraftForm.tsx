"use client";

import {
  SET_CATEGORIES,
  SET_LANGUAGES,
  type SetCategory,
  type SetDraft,
  type SetLanguage,
} from "@ccverbs/contrib/types.js";

const LANGUAGE_LABELS: Record<SetLanguage, string> = {
  ja: "日本語",
  en: "English",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
  ko: "한국어",
  mixed: "mixed — a term plus its translation",
};

const CATEGORY_LABELS: Record<SetCategory, string> = {
  meme: "meme — for fun",
  study: "study — a flashcard you read for free",
  classic: "classic — a general-purpose replacement",
};

type TextKey = "name" | "id" | "emoji" | "description" | "authorName" | "authorGithub" | "source";

interface DraftFormProps {
  draft: SetDraft;
  errors: Record<string, string>;
  onChange: (patch: Partial<SetDraft>) => void;
}

export function DraftForm({ draft, errors, onChange }: DraftFormProps) {
  const text = (key: TextKey, label: string, hint?: string) => (
    <div className="field" key={key}>
      <label htmlFor={key}>
        {label} {hint && <span className="dim">{hint}</span>}
      </label>
      <input
        id={key}
        value={draft[key] ?? ""}
        spellCheck={false}
        onChange={(event) => onChange({ [key]: event.target.value } as Partial<SetDraft>)}
      />
      {errors[key] && <p className="bad">{errors[key]}</p>}
    </div>
  );

  return (
    <>
      {text("name", "Name")}
      {text("id", "id", "becomes sets/<id>.json")}
      {text("emoji", "Emoji", "one, and prefer a coloured one over ☸ or ⌨")}
      {text("description", "Description", "one line")}

      <div className="field">
        <label htmlFor="language">Language</label>
        <select
          id="language"
          value={draft.language}
          onChange={(event) => onChange({ language: event.target.value as SetLanguage })}
        >
          {SET_LANGUAGES.map((code) => (
            <option key={code} value={code}>
              {LANGUAGE_LABELS[code]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={draft.category}
          onChange={(event) => onChange({ category: event.target.value as SetCategory })}
        >
          {SET_CATEGORIES.map((code) => (
            <option key={code} value={code}>
              {CATEGORY_LABELS[code]}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="tags">
          Tags <span className="dim">comma separated, up to 8</span>
        </label>
        <input
          id="tags"
          value={draft.tags.join(", ")}
          spellCheck={false}
          onChange={(event) =>
            onChange({
              tags: event.target.value
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            })
          }
        />
        {errors.tags && <p className="bad">{errors.tags}</p>}
      </div>

      {text("authorName", "Your name", "optional — credited in the set file")}
      {text("authorGithub", "GitHub handle", "optional")}
      {text("source", "Source URL", "optional — where the content came from")}
    </>
  );
}
