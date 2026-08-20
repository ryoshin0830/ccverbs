"use client";

import { useState } from "react";
import { buildSetJson, newFileUrl } from "@ccverbs/contrib/build.js";
import type { SetDraft } from "@ccverbs/contrib/types.js";

export function OutputPanel({ draft, ready }: { draft: SetDraft; ready: boolean }) {
  const [copied, setCopied] = useState(false);

  if (!ready) {
    return (
      <div className="output">
        <p className="dim">Fix the items above and the pull request button appears here.</p>
      </div>
    );
  }

  const json = buildSetJson(draft);
  const link = newFileUrl(draft);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; the JSON is visible below either way.
    }
  };

  return (
    <div className="output">
      {link.url ? (
        <>
          <a className="primary" href={link.url} target="_blank" rel="noreferrer">
            Open a pull request on GitHub
          </a>
          <p className="dim">
            GitHub opens its editor with <code>{link.filename}</code> already filled in. Without
            write access it offers to fork first — that is the normal path. Then press “Propose new
            file”.
          </p>
        </>
      ) : (
        <>
          <p className="bad">
            This set is too large to prefill through a link ({link.length} characters). Two steps
            instead:
          </p>
          <ol className="dim">
            <li>Copy the JSON below.</li>
            <li>
              Open{" "}
              <a href={link.fallbackUrl} target="_blank" rel="noreferrer">
                the new file page
              </a>{" "}
              and paste it.
            </li>
          </ol>
        </>
      )}

      <div className="controls">
        <button type="button" onClick={copy}>
          {copied ? "copied" : "Copy JSON"}
        </button>
        <a
          className="button"
          download={`${draft.id}.json`}
          href={`data:application/json;charset=utf-8,${encodeURIComponent(json)}`}
        >
          Download
        </a>
        <span className="dim">{link.length} character link</span>
      </div>

      <details>
        <summary className="dim">Show the JSON</summary>
        <pre className="json">{json}</pre>
      </details>
    </div>
  );
}
