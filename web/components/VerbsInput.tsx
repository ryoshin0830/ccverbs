"use client";

import type { VerbIssue } from "@ccverbs/contrib/types.js";

const EXPLAIN: Record<VerbIssue["kind"], (issue: VerbIssue) => string> = {
  "trailing-ellipsis": () => "Drop the trailing … / ... / 。 — Claude Code adds the ellipsis.",
  "too-wide": (i) => `${i.width} columns. Keep it to 40 so the timer stays visible.`,
  duplicate: () => "Already in this set.",
  "control-char": () => "Contains a control character.",
  "too-long": () => "Over 120 characters.",
};

interface VerbsInputProps {
  value: string;
  verbs: string[];
  issues: VerbIssue[];
  error?: string;
  onChange: (value: string) => void;
}

export function VerbsInput({ value, verbs, issues, error, onChange }: VerbsInputProps) {
  const status = () => {
    if (issues.length > 0) return `${verbs.length} verbs · ${issues.length} to fix`;
    if (verbs.length > 0) return `${verbs.length} verbs · all good`;
    return "one per line";
  };

  return (
    <div className="field">
      <label htmlFor="verbs">
        Verbs <span className="dim">{status()}</span>
      </label>
      <textarea
        id="verbs"
        rows={14}
        spellCheck={false}
        value={value}
        placeholder={"筋トレしています\nプロテインを飲んでいます"}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && <p className="bad">{error}</p>}
      {issues.length > 0 && (
        <ul className="issues">
          {issues.map((issue) => (
            <li key={`${issue.index}-${issue.kind}`}>
              <code>{issue.verb}</code> <span className="bad">{EXPLAIN[issue.kind](issue)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
