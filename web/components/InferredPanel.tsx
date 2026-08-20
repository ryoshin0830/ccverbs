"use client";

import { useState } from "react";
import { SET_CATEGORIES, SET_LANGUAGES } from "@ccverbs/contrib/types.js";
import type { SetCategory, SetLanguage } from "@ccverbs/contrib/types.js";
import type { Catalog } from "@/i18n";

interface InferredPanelProps {
  language: SetLanguage;
  category: SetCategory;
  id: string;
  idError?: string;
  t: Catalog;
  onChange: (patch: { language?: SetLanguage; category?: SetCategory; id?: string }) => void;
}

/**
 * What the words already told us, shown as decisions with a reason rather than
 * empty selects. An empty field asks a question; this states an answer and lets
 * the contributor disagree.
 */
export function InferredPanel({
  language,
  category,
  id,
  idError,
  t,
  onChange,
}: InferredPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="inferred">
      <p className="inferred-line">
        <span className="inferred-label">{t.inferred.heading}</span>
        <span className="inferred-values">
          {t.inferred.languages[language]} · {t.inferred.categories[category]} ·{" "}
          <code>sets/{id || "…"}.json</code>
        </span>
        <button type="button" className="link" onClick={() => setOpen((o) => !o)}>
          {open ? t.inferred.hide : t.inferred.change}
        </button>
      </p>

      {open && (
        <div className="inferred-open">
          <div className="field">
            <label className="label" htmlFor="language">
              {t.inferred.language}
            </label>
            <select
              id="language"
              value={language}
              onChange={(event) => onChange({ language: event.target.value as SetLanguage })}
            >
              {SET_LANGUAGES.map((code) => (
                <option key={code} value={code}>
                  {t.inferred.languages[code]}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="category">
              {t.inferred.category}
            </label>
            <select
              id="category"
              value={category}
              onChange={(event) => onChange({ category: event.target.value as SetCategory })}
            >
              {SET_CATEGORIES.map((code) => (
                <option key={code} value={code}>
                  {t.inferred.categories[code]}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="id">
              {t.name.idLabel}
            </label>
            <input
              id="id"
              value={id}
              spellCheck={false}
              onChange={(event) => onChange({ id: event.target.value })}
            />
            {idError && <p className="note note-bad">{idError}</p>}
            <p className="note note-quiet">{t.inferred.idNote}</p>
          </div>
        </div>
      )}
    </div>
  );
}
