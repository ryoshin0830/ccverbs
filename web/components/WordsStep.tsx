"use client";

import type { VerbIssue } from "@ccverbs/contrib/types.js";
import type { Catalog } from "@/i18n";

interface WordsStepProps {
  value: string;
  verbs: string[];
  issues: VerbIssue[];
  error?: string;
  t: Catalog;
  onChange: (value: string) => void;
}

export function WordsStep({ value, verbs, issues, error, t, onChange }: WordsStepProps) {
  const explain = (issue: VerbIssue) =>
    issue.kind === "too-wide"
      ? t.issues["too-wide"](issue.width ?? 0)
      : t.issues[issue.kind]();

  return (
    <section className="step">
      <h2 className="step-heading">{t.words.heading}</h2>
      <p className="note note-quiet">{t.words.hint}</p>

      <textarea
        className="words"
        rows={12}
        spellCheck={false}
        value={value}
        placeholder={t.words.placeholder}
        aria-label={t.words.heading}
        onChange={(event) => onChange(event.target.value)}
      />

      <p className="tally">
        {verbs.length === 0 ? (
          <span className="note note-quiet">{t.words.empty}</span>
        ) : issues.length === 0 ? (
          <>
            <span>{t.words.count(verbs.length)}</span>
            <span className="tally-ok">{t.words.allClear}</span>
          </>
        ) : (
          <>
            <span>{t.words.count(verbs.length)}</span>
            <span className="tally-bad">{t.words.toFix(issues.length)}</span>
          </>
        )}
      </p>

      {error && <p className="note note-bad">{error}</p>}

      {issues.length > 0 && (
        <ul className="marks">
          {issues.map((issue) => (
            <li key={`${issue.index}-${issue.kind}`}>
              <code>{issue.verb}</code>
              <span className="mark-note">{explain(issue)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
