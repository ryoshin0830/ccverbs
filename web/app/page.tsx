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

type Field = keyof SetDraft;

export default function Page() {
  const [locale, setLocale] = useState<SupportedLocale>("en");
  const [draft, setDraft] = useState<SetDraft>(emptyDraft());
  // Anything the contributor has decided for themselves stops being inferred,
  // and only a field they have already touched is allowed to show an error.
  const [touched, setTouched] = useState<Set<Field>>(new Set());

  useEffect(() => setLocale(detectLocale()), []);

  const t = getCatalog(locale);

  const verbs = useMemo(() => splitVerbs(draft.verbsText), [draft.verbsText]);
  const language = touched.has("language") ? draft.language : inferLanguage(verbs);
  const category = touched.has("category") ? draft.category : inferCategory(verbs);
  const emojiOptions = useMemo(() => suggestEmoji(language, category), [language, category]);

  // What the form actually submits: the draft with every inference applied.
  const resolved: SetDraft = { ...draft, language, category };
  const diagnostics = useMemo(() => validateDraft(resolved), [resolved]);
  const allErrors = useMemo(() => messagesFor(diagnostics.fieldErrors, t), [diagnostics, t]);

  // A name written in Japanese slugifies to nothing, so the file name cannot be
  // derived and the contributor has to supply it. That is the common case here,
  // not an edge case, so the field comes out of hiding the moment it happens.
  const idNeedsHelp = draft.name.length > 0 && slugify(draft.name).length === 0;

  const errors = useMemo(() => {
    const shown: Record<string, string> = {};
    for (const [field, message] of Object.entries(allErrors)) {
      const key = field === "verbsText" ? "verbsText" : field;
      // The id is derived from the name, so the name having been touched is
      // what earns the id the right to complain.
      const earned =
        touched.has(key as Field) || (key === "id" && touched.has("name") && idNeedsHelp);
      if (earned) shown[field] = message;
    }
    return shown;
  }, [allErrors, touched, idNeedsHelp]);

  const update = (patch: Partial<SetDraft>) => {
    const keys = Object.keys(patch) as Field[];
    setTouched((current) => {
      const next = new Set(current);
      for (const key of keys) next.add(key);
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
        showIdField={idNeedsHelp}
        t={t}
        onChange={update}
      />

      <InferredPanel
        language={language}
        category={category}
        id={draft.id}
        idError={errors.id}
        showId={!idNeedsHelp}
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
