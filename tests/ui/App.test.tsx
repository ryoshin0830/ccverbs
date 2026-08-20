import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import { App } from "../../src/ui/App.js";
import type { RegistryIndex } from "../../src/registry/schema.js";

const registry = {
  schemaVersion: 1,
  generatedAt: "1970-01-01T00:00:00.000Z",
  totalSets: 2,
  totalVerbs: 3,
  sets: [
    {
      id: "alpha",
      name: "Alpha",
      emoji: "A",
      description: "first",
      language: "ja",
      category: "meme",
      tags: [],
      verbs: ["a1", "a2"],
    },
    {
      id: "beta",
      name: "Beta",
      emoji: "B",
      description: "second",
      language: "en",
      category: "study",
      tags: [],
      verbs: ["b1"],
    },
  ],
} as unknown as RegistryIndex;

const tick = () => new Promise((r) => setTimeout(r, 30));

describe("App", () => {
  it("lists every set with its verb count", async () => {
    const { lastFrame } = render(<App registry={registry} skipped={[]} onExit={() => {}} />);
    await tick();
    expect(lastFrame()).toContain("Alpha");
    expect(lastFrame()).toContain("Beta");
    expect(lastFrame()).toContain("2 sets");
  });

  it("offers a random row", async () => {
    const { lastFrame } = render(<App registry={registry} skipped={[]} onExit={() => {}} />);
    await tick();
    expect(lastFrame()).toContain("Random set");
  });

  it("filters as the user types", async () => {
    const { lastFrame, stdin } = render(<App registry={registry} skipped={[]} onExit={() => {}} />);
    await tick();
    stdin.write("bet");
    await tick();
    expect(lastFrame()).toContain("Beta");
    expect(lastFrame()).not.toContain("Alpha");
  });

  it("previews the highlighted set's verbs", async () => {
    const { lastFrame } = render(<App registry={registry} skipped={[]} onExit={() => {}} />);
    await tick();
    expect(lastFrame()).toContain("a1");
  });

  it("warns about skipped sets", async () => {
    const { lastFrame } = render(
      <App registry={registry} skipped={["broken"]} onExit={() => {}} />,
    );
    await tick();
    expect(lastFrame()).toContain("broken");
  });
});
