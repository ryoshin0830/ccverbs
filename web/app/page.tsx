"use client";

import { useEffect, useMemo, useState } from "react";
import { inferCategory, inferLanguage, suggestEmoji } from "@ccverbs/contrib/infer.js";
import type { SetDraft } from "@ccverbs/contrib/types.js";
import { emptyDraft, slugify, splitVerbs, validateDraft } from "@ccverbs/contrib/validate.js";
import { LocalePicker } from "@/components/LocalePicker";
import { NameStep } from "@/components/NameStep";
import { InferredPanel } from "@/components/InferredPanel";
import { Screen } from "@/components/Screen";
import { SendStep } from "@/components/SendStep";
import { WordsStep } from "@/components/WordsStep";
import { getCatalog, type SupportedLocale } from "@/i18n";
import { detectLocale, rememberLocale } from "@/lib/locale";
import { messagesFor } from "@/lib/messages";

export default function Page() {
  const [locale, setLocale] = useState<SupportedLocale>("en");
  const [draft, setDraft] = useState<SetDraft>(emptyDraft());
  // Anything the contributor has decided for themselves stops being inferred.
  const [touched, setTouched] = useState<Set<keyof SetDraft>>(new Set());

  useEffect(() => setLocale(detectLocale()), []);

  const t = getCatalog(locale);

  const verbs = useMemo(() => splitVerbs(draft.verbsText), [draft.verbsText]);
  const language = touched.has("language") ? draft.language : inferLanguage(verbs);
  const category = touched.has("category") ? draft.category : inferCategory(verbs);
  const emojiOptions = useMemo(() => suggestEmoji(language, category), [language, category]);

  // What the form actually submits: the draft with every inference applied.
  const resolved: SetDraft = { ...draft, language, category };
  const diagnostics = useMemo(() => validateDraft(resolved), [resolved]);
  // Codes become sentences here, in the reader's language.
  const errors = useMemo(() => messagesFor(diagnostics.fieldErrors, t), [diagnostics, t]);

  const update = (patch: Partial<SetDraft>) => {
    setTouched((current) => {
      const next = new Set(current);
      for (const key of Object.keys(patch) as (keyof SetDraft)[]) next.add(key);
      return next;
    });
    setDraft((current) => {
      const next = { ...current, ...patch };
      // The file name follows the name until the contributor edits it.
      if ("name" in patch && !touched.has("id")) next.id = slugify(patch.name ?? "");
      return next;
    });
  };

  const changeLocale = (next: SupportedLocale) => {
    setLocale(next);
    rememberLocale(next);
  };

  return (
    <main className="page">
      <header className="masthead">
        <h1 className="wordmark">ccverbs</h1>
        <LocalePicker locale={locale} label={t.header.languageLabel} onChange={changeLocale} />
      </header>

      <p className="tagline">{t.header.tagline}</p>

      <Screen verbs={verbs} t={t} />

      <WordsStep
        value={draft.verbsText}
        verbs={diagnostics.verbs}
        issues={diagnostics.verbIssues}
        error={errors.verbsText}
        t={t}
        onChange={(verbsText) => update({ verbsText })}
      />

      <NameStep
        draft={resolved}
        errors={errors}
        emojiOptions={emojiOptions}
        t={t}
        onChange={update}
      />

      <InferredPanel
        language={language}
        category={category}
        id={draft.id}
        idError={errors.id}
        t={t}
        onChange={update}
      />

      <SendStep draft={resolved} ready={diagnostics.ok} t={t} />

      <footer className="colophon">
        <p>
          {t.footer.cli} <code>npx ccverbs</code>
        </p>
        <p>
          <a href="https://github.com/ryoshin0830/ccverbs">{t.footer.repo}</a>
        </p>
      </footer>
    </main>
  );
}
