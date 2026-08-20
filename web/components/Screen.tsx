"use client";

import { useEffect, useRef, useState } from "react";
import { displayWidth } from "@ccverbs/registry/width.js";
import type { Catalog } from "@/i18n";

const STEP_MS = 2200;
const MAX_COLUMNS = 40;

/** Shown before anything is typed, so the page demonstrates itself on load. */
const DEMO = ["岩を押し上げています", "また麓から登っています", "kubectl drain — Nodeを退避"];

/**
 * The one dark thing on the page: a window onto the terminal, sitting on the
 * paper. Below the line runs a 40-column rule — the constraint the contributor
 * has to respect, made into the page's own measure. A verb that is too long
 * visibly crosses it.
 *
 * Only the verb line is allowed to change. Everything around it holds still.
 * The controls sit in their own grid column so a changing reading cannot push
 * them, figures are tabular so 9 -> 10 does not nudge, and there is no
 * appearing-and-disappearing warning text: an over-long verb is already said
 * three times over by the red verb, the red reading and the crossed measure,
 * and a sentence that came and went with each verb moved the whole page.
 */
export function Screen({ verbs, t }: { verbs: string[]; t: Catalog }) {
  const live = verbs.length > 0;
  const list = live ? verbs : DEMO;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) setPaused(true);
  }, []);

  useEffect(() => {
    if (paused || list.length < 2) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % list.length), STEP_MS);
    return () => window.clearInterval(timer);
  }, [paused, list.length]);

  useEffect(() => {
    if (index >= list.length) setIndex(0);
  }, [index, list.length]);

  const verb = list[Math.min(index, list.length - 1)] as string;
  const width = displayWidth(verb);
  const over = width > MAX_COLUMNS;
  const overBy = width - MAX_COLUMNS;

  return (
    <section className="screen" aria-label="preview">
      <div className="screen-glass">
        <p className={`line${over ? " line-over" : ""}`}>
          <span className="line-glyph" aria-hidden="true">
            ✻
          </span>{" "}
          <span className="line-verb">{verb}</span>
          <span className="line-tail">… ({4 + (index % 9)}s)</span>
        </p>

        {/* The signature: a real 40-column measure. */}
        <div className="ruler" aria-hidden="true">
          <span className="ruler-track" />
          <span className="ruler-mark">{t.preview.ruler}</span>
          {over && <span className="ruler-over" style={{ width: `${overBy}ch` }} />}
        </div>
      </div>

      <div className="screen-meta">
        <p
          className={`readout${over ? " readout-bad" : ""}`}
          {...(over ? { "aria-label": t.preview.tooWide } : {})}
        >
          {t.preview.columns(width, MAX_COLUMNS)}
        </p>

        {list.length > 1 && (
          <div className="screen-controls">
            <button
              type="button"
              aria-label={t.preview.previous}
              onClick={() => setIndex((i) => (i - 1 + list.length) % list.length)}
            >
              ‹
            </button>
            <button type="button" className="screen-toggle" onClick={() => setPaused((p) => !p)}>
              {paused ? t.preview.play : t.preview.pause}
            </button>
            <button
              type="button"
              aria-label={t.preview.next}
              onClick={() => setIndex((i) => (i + 1) % list.length)}
            >
              ›
            </button>
            <span className="counter">
              {index + 1} / {list.length}
            </span>
          </div>
        )}
      </div>

      {/* Always rendered, so appearing or vanishing cannot shift the page. */}
      <p className="screen-aside">{live ? "" : t.preview.empty}</p>
    </section>
  );
}
