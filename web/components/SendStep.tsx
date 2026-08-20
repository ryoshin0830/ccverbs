"use client";

import { useState } from "react";
import { buildSetJson, newFileUrl } from "@ccverbs/contrib/build.js";
import type { SetDraft } from "@ccverbs/contrib/types.js";
import type { Catalog } from "@/i18n";

export function SendStep({ draft, ready, t }: { draft: SetDraft; ready: boolean; t: Catalog }) {
  const [copied, setCopied] = useState(false);

  if (!ready) {
    return (
      <section className="step">
        <h2 className="step-heading">{t.send.heading}</h2>
        <p className="note note-quiet">{t.send.notReady}</p>
      </section>
    );
  }

  const json = buildSetJson(draft);
  const link = newFileUrl(draft);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the file is visible below regardless.
    }
  };

  return (
    <section className="step">
      <h2 className="step-heading">{t.send.heading}</h2>

      {link.url ? (
        <>
          <a className="send" href={link.url} target="_blank" rel="noreferrer">
            {t.send.button}
          </a>
          <p className="note note-quiet">{t.send.afterButton}</p>
        </>
      ) : (
        <>
          <p className="note note-bad">{t.send.tooLong(link.length)}</p>
          <ol className="note note-quiet">
            <li>{t.send.tooLongStep1}</li>
            <li>
              <a href={link.fallbackUrl} target="_blank" rel="noreferrer">
                {t.send.tooLongLink}
              </a>{" "}
              — {t.send.tooLongStep2}
            </li>
          </ol>
        </>
      )}

      <div className="send-extras">
        <button type="button" className="quiet" onClick={copy}>
          {copied ? t.send.copied : t.send.copy}
        </button>
        <a
          className="quiet"
          download={`${draft.id}.json`}
          href={`data:application/json;charset=utf-8,${encodeURIComponent(json)}`}
        >
          {t.send.download}
        </a>
        <span className="note note-quiet">{t.send.charCount(link.length)}</span>
      </div>

      <details className="reveal">
        <summary>{t.send.showJson}</summary>
        <pre className="json">{json}</pre>
      </details>
    </section>
  );
}
