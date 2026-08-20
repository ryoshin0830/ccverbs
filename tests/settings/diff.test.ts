import { describe, expect, it } from "vitest";
import { renderDiff } from "../../src/settings/diff.js";

describe("renderDiff", () => {
  it("marks an addition when nothing was configured", () => {
    const out = renderDiff(null, { mode: "replace", verbs: ["a"] });
    expect(out).toContain('+   "mode": "replace"');
    expect(out).not.toContain("-   ");
  });

  it("shows both sides when replacing an existing value", () => {
    const out = renderDiff({ mode: "append", verbs: ["a"] }, { mode: "replace", verbs: ["b"] });
    expect(out).toContain('-   "mode": "append"');
    expect(out).toContain('+   "mode": "replace"');
  });

  it("summarises long verb lists instead of printing every line", () => {
    const verbs = Array.from({ length: 40 }, (_, i) => `v${i}`);
    const out = renderDiff(null, { mode: "replace", verbs });
    expect(out).toContain("40 verbs");
    expect(out.split("\n").length).toBeLessThan(15);
  });

  it("marks a removal when resetting", () => {
    expect(renderDiff({ mode: "replace", verbs: ["a"] }, null)).toContain('-   "spinnerVerbs"');
  });
});
