"use client";

import { useMemo, useState } from "react";
import { emptyDraft, slugify, validateDraft } from "@ccverbs/contrib/validate.js";
import type { SetDraft } from "@ccverbs/contrib/types.js";
import { DraftForm } from "@/components/DraftForm";
import { OutputPanel } from "@/components/OutputPanel";
import { SpinnerPreview } from "@/components/SpinnerPreview";
import { VerbsInput } from "@/components/VerbsInput";

export default function Page() {
  const [draft, setDraft] = useState<SetDraft>(emptyDraft());
  const [idTouched, setIdTouched] = useState(false);

  const update = (patch: Partial<SetDraft>) => {
    if ("id" in patch) setIdTouched(true);
    setDraft((current) => {
      const next = { ...current, ...patch };
      // Derive the id from the name until the contributor edits it themselves.
      if ("name" in patch && !idTouched) next.id = slugify(patch.name ?? "");
      return next;
    });
  };

  const diagnostics = useMemo(() => validateDraft(draft), [draft]);

  return (
    <main className="page">
      <header>
        <h1>ccverbs</h1>
        <p className="lead">
          Claude Code shows a random word while it works. Write your own list, watch it the way you
          will actually see it, then open a pull request.
        </p>
      </header>

      <div className="columns">
        <section>
          <DraftForm draft={draft} errors={diagnostics.fieldErrors} onChange={update} />
          <VerbsInput
            value={draft.verbsText}
            verbs={diagnostics.verbs}
            issues={diagnostics.verbIssues}
            error={diagnostics.fieldErrors.verbsText}
            onChange={(verbsText) => update({ verbsText })}
          />
        </section>

        <aside>
          <h2>How it will look</h2>
          <SpinnerPreview verbs={diagnostics.verbs} />

          <h2>Send it</h2>
          <OutputPanel draft={draft} ready={diagnostics.ok} />
          <p className="dim">
            Ids have to be unique across the repo. If yours is taken, CI says so on the pull
            request.
          </p>
        </aside>
      </div>
    </main>
  );
}
