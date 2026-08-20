import { describe, expect, it } from "vitest";
import { DEFAULT_VERB_COUNT, EXIT, REGISTRY_URL } from "../src/constants.js";

describe("constants", () => {
  it("points at the sets index on main", () => {
    expect(REGISTRY_URL).toBe(
      "https://raw.githubusercontent.com/ryoshin0830/ccverbs/main/sets/index.json",
    );
  });

  it("records the number of built-in Claude Code verbs", () => {
    expect(DEFAULT_VERB_COUNT).toBe(186);
  });

  it("assigns a distinct exit code per failure mode", () => {
    expect(new Set(Object.values(EXIT)).size).toBe(5);
  });
});
