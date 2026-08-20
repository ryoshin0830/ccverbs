"use client";

import { useState } from "react";
import type { SetDraft } from "@ccverbs/contrib/types.js";
import type { Catalog } from "@/i18n";
import { EmojiPicker } from "@/components/EmojiPicker";

interface NameStepProps {
  draft: SetDraft;
  errors: Record<string, string>;
  emojiOptions: string[];
  t: Catalog;
  onChange: (patch: Partial<SetDraft>) => void;
}

export function NameStep({ draft, errors, emojiOptions, t, onChange }: NameStepProps) {
  const [extrasOpen, setExtrasOpen] = useState(false);

  return (
    <section className="step">
      <h2 className="step-heading">{t.name.heading}</h2>

      <div className="field">
        <label className="label" htmlFor="name">
          {t.name.nameLabel}
        </label>
        <input
          id="name"
          value={draft.name}
          placeholder={t.name.namePlaceholder}
          onChange={(event) => onChange({ name: event.target.value })}
        />
        {errors.name && <p className="note note-bad">{errors.name}</p>}
      </div>

      <EmojiPicker
        value={draft.emoji}
        options={emojiOptions}
        error={errors.emoji}
        t={t}
        onChange={(emoji) => onChange({ emoji })}
      />

      <div className="field">
        <label className="label" htmlFor="description">
          {t.name.descriptionLabel}
        </label>
        <input
          id="description"
          value={draft.description}
          placeholder={t.name.descriptionPlaceholder}
          onChange={(event) => onChange({ description: event.target.value })}
        />
        {errors.description && <p className="note note-bad">{errors.description}</p>}
      </div>

      <button type="button" className="link link-block" onClick={() => setExtrasOpen((o) => !o)}>
        {t.optional.toggle}
      </button>

      {extrasOpen && (
        <div className="extras">
          <div className="field">
            <label className="label" htmlFor="tags">
              {t.optional.tagsLabel} <span className="note-quiet">{t.optional.tagsHint}</span>
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
            {errors.tags && <p className="note note-bad">{errors.tags}</p>}
          </div>

          <div className="field">
            <label className="label" htmlFor="authorName">
              {t.optional.authorLabel}
            </label>
            <input
              id="authorName"
              value={draft.authorName ?? ""}
              onChange={(event) => onChange({ authorName: event.target.value })}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="authorGithub">
              {t.optional.githubLabel}
            </label>
            <input
              id="authorGithub"
              value={draft.authorGithub ?? ""}
              spellCheck={false}
              onChange={(event) => onChange({ authorGithub: event.target.value })}
            />
          </div>

          <div className="field">
            <label className="label" htmlFor="source">
              {t.optional.sourceLabel}
            </label>
            <input
              id="source"
              value={draft.source ?? ""}
              placeholder={t.optional.sourcePlaceholder}
              spellCheck={false}
              onChange={(event) => onChange({ source: event.target.value })}
            />
            {errors.source && <p className="note note-bad">{errors.source}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
