"use client";

import { useEffect, useRef, useState } from "react";
import { displayWidth } from "@ccverbs/registry/schema.js";

const STEP_MS = 2000;
const MAX_WIDTH = 40;

/** Claude Code appends the ellipsis itself, which is why verbs must not end in one. */
function render(verb: string, seconds: number, tokens: number): string {
  return `${verb}… (${seconds}s · ↑ ${tokens.toFixed(1)}k tokens)`;
}

export function SpinnerPreview({ verbs }: { verbs: string[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) setPaused(true);
  }, []);

  useEffect(() => {
    if (paused || verbs.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % verbs.length), STEP_MS);
    return () => clearInterval(timer);
  }, [paused, verbs.length]);

  useEffect(() => {
    if (index >= verbs.length) setIndex(0);
  }, [index, verbs.length]);

  if (verbs.length === 0) {
    return (
      <div className="preview">
        <p className="dim">Add a verb and it appears here, the way Claude Code shows it.</p>
      </div>
    );
  }

  const verb = verbs[Math.min(index, verbs.length - 1)] as string;
  const width = displayWidth(verb);
  const over = width > MAX_WIDTH;

  return (
    <div className="preview">
      <pre className={`spinner${over ? " over" : ""}`}>
        <span className="glyph">✻</span> {render(verb, 4 + (index % 9), 1.2 + index * 0.4)}
      </pre>
      <p className="dim">
        {width} / {MAX_WIDTH} columns
        {over ? " — too wide, the timer gets pushed off screen" : ""}
      </p>
      <div className="controls">
        <button
          type="button"
          aria-label="previous verb"
          onClick={() => setIndex((i) => (i - 1 + verbs.length) % verbs.length)}
        >
          ‹
        </button>
        <button type="button" onClick={() => setPaused((p) => !p)}>
          {paused ? "play" : "pause"}
        </button>
        <button
          type="button"
          aria-label="next verb"
          onClick={() => setIndex((i) => (i + 1) % verbs.length)}
        >
          ›
        </button>
        <span className="dim">
          {index + 1} / {verbs.length}
        </span>
      </div>
    </div>
  );
}
