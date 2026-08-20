# ccverbs LLM contribution workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an LLM create a canonical ccverbs set JSON, validate it through the CLI, and explicitly open a GitHub pull request without touching the caller's worktree.

**Architecture:** Keep content validation, input conversion, inference, and JSON formatting in the browser-safe src/contrib/ layer. Add a Node-only new command that reads JSON from a file or stdin, returns one-line machine output, and calls the existing throwaway-clone PR helper only when --pr is present. Document the contract in the README and a dedicated AI guide, then ship a repository-local Claude skill that drives the workflow.

**Tech Stack:** TypeScript, Node.js 18+, zod, Vitest, tsup, Next.js 15, GitHub CLI, Lolipop Deploy Now, npm.

## Global Constraints

- The input and output contract is JSON; --json stdout is one object whose first key is ok.
- --input is mandatory for new; --input - reads stdin and must never be implicit.
- --pr is the only switch that permits fork, push, or PR creation.
- The caller's working tree is never staged, committed, or modified by new --pr.
- A contribution PR contains one file: sets/<id>.json; sets/index.json is rebuilt after merge on main.
- Validation keeps the repository rules: kebab-case IDs/tags, unique verbs, no control characters or trailing ellipsis/period, 1–120 characters, and display width <= 40.
- src/contrib/ remains free of Node built-ins so the web build stays browser-safe.
- The feature release version is 0.3.0; npm currently publishes 0.2.2.
- No LLM SDK, provider API key, OAuth flow, server route, or automatic PR merge is added.

---

### Task 1: Save the design and implementation plan

Files:
- Create: docs/superpowers/specs/2026-08-20-ccverbs-llm-contribution-design.md
- Create: docs/superpowers/plans/2026-08-20-ccverbs-llm-contribution.md

- [x] Step 1: Confirm the baseline

~~~console
git status --short --branch
npm view ccverbs version dist-tags --json --registry https://registry.npmjs.org
gh run list --repo ryoshin0830/ccverbs --limit 3
lolipop project show --project 01M0EZS8RXC4WWSR9Y088Z5HZ3
~~~

Expected: main/origin are at 0.2.2, npm latest is 0.2.2, current CI's stale version assertion is failing, and the Lolipop project is READY at ccverbs.lolipop-now.app.

- [x] Step 2: Commit only the planning documents

~~~console
git add docs/superpowers/specs/2026-08-20-ccverbs-llm-contribution-design.md docs/superpowers/plans/2026-08-20-ccverbs-llm-contribution.md
git commit -m "docs: design the LLM verb set contribution workflow"
~~~

Expected: one local commit containing the design and plan.

---

### Task 2: Extend the shared set model for full JSON input

Files:
- Modify: src/contrib/types.ts
- Modify: src/contrib/build.ts
- Test: tests/contrib/build.test.ts

Interfaces:
- Add LocalizedSetText, SetI18n, and i18n?: SetI18n to SetDraft.
- buildSetObject emits non-empty i18n immediately before verbs.

- [ ] Step 1: Write the failing test

~~~ts
it("preserves localized names and descriptions before verbs", () => {
  const json = buildSetJson(draft({
    i18n: {
      ja: { name: "筋トレ", description: "日本語の説明" },
      "zh-Hans": { name: "健身" },
    },
  }));
  const parsed = JSON.parse(json);
  expect(Object.keys(parsed).slice(-2)).toEqual(["i18n", "verbs"]);
  expect(parsed.i18n).toEqual({
    ja: { name: "筋トレ", description: "日本語の説明" },
    "zh-Hans": { name: "健身" },
  });
});
~~~

- [ ] Step 2: Run the focused test

Run: npx vitest run tests/contrib/build.test.ts -t "preserves localized"
Expected: FAIL because SetDraft has no i18n and the builder drops the field.

- [ ] Step 3: Implement the minimum

Add to src/contrib/types.ts:

~~~ts
export interface LocalizedSetText {
  name?: string;
  description?: string;
}

export type SetI18n = Partial<Record<SetLanguage, LocalizedSetText>>;
~~~

Add i18n?: SetI18n to SetDraft. Before set.verbs in src/contrib/build.ts add:

~~~ts
if (draft.i18n && Object.keys(draft.i18n).length > 0) set.i18n = draft.i18n;
~~~

- [ ] Step 4: Verify

Run: npx vitest run tests/contrib/build.test.ts && npm run lint
Expected: focused tests and TypeScript pass.

- [ ] Step 5: Commit

~~~console
git add src/contrib/types.ts src/contrib/build.ts tests/contrib/build.test.ts
git commit -m "feat: preserve localized set metadata in shared builders"
~~~

---

### Task 3: Add pure JSON input parsing and diagnostics

Files:
- Create: src/contrib/input.ts
- Create: tests/contrib/input.test.ts

Interfaces:
- Create InputIssue with path, code, message, optional index and width.
- Create SetInputResult:
  - ok true: draft and canonical json
  - ok false: issues
- Export parseSetInput(value: unknown): SetInputResult.

- [ ] Step 1: Write failing tests

Create tests/contrib/input.test.ts:

~~~ts
import { describe, expect, it } from "vitest";
import { parseSetInput } from "../../src/contrib/input.js";

const valid = {
  id: "ja-gym",
  name: "筋トレ",
  emoji: "🏋",
  description: "ジムのセット間に見る言葉",
  language: "ja",
  category: "meme",
  tags: ["fun", "gym"],
  i18n: { en: { name: "Gym", description: "Gym words" } },
  verbs: ["筋トレしています", "プロテインを飲んでいます"],
};

describe("parseSetInput", () => {
  it("converts a committed-set object into a validated draft", () => {
    const result = parseSetInput(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.draft.verbsText).toBe("筋トレしています\nプロテインを飲んでいます");
      expect(JSON.parse(result.json).i18n.en.name).toBe("Gym");
    }
  });

  it("normalizes the schema hint", () => {
    const result = parseSetInput({ ...valid, $schema: "anything" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(JSON.parse(result.json).$schema).toBe("../schema/verb-set.schema.json");
  });

  it("returns stable paths for schema errors", () => {
    const result = parseSetInput({ ...valid, id: "Not Kebab", verbs: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.path)).toEqual(expect.arrayContaining(["id", "verbs"]));
    }
  });

  it("returns a width issue", () => {
    const result = parseSetInput({ ...valid, verbs: ["あ".repeat(21)] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues).toContainEqual(expect.objectContaining({ path: "verbs[0]", code: "too-wide", width: 42 }));
  });

  it("rejects unknown top-level fields", () => {
    const result = parseSetInput({ ...valid, prompt: "hidden data" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.path).toBe("prompt");
  });
});
~~~

- [ ] Step 2: Verify RED

Run: npx vitest run tests/contrib/input.test.ts
Expected: FAIL because src/contrib/input.ts does not exist.

- [ ] Step 3: Implement parseSetInput

Use verbSetSchema.strict() to validate the unknown value and convert zod issues to stable dot paths. Map author, source, i18n, and verbs.join("\n") into SetDraft. Run validateDraft for contribution-specific width diagnostics. Convert field and verb issues to InputIssue records. Return buildSetJson(draft) only when there are no issues.

Keep this module pure: no node: imports, network, filesystem, or registry fetch.

- [ ] Step 4: Verify browser safety

Run:

~~~console
npx vitest run tests/contrib/input.test.ts tests/contrib/build.test.ts
npm run lint
grep -rE 'from "node:' src/contrib src/registry/width.ts
~~~

Expected: tests and typecheck pass; grep prints no lines.

- [ ] Step 5: Commit

~~~console
git add src/contrib/input.ts tests/contrib/input.test.ts src/contrib/types.ts
git commit -m "feat: parse and validate agent-generated set JSON"
~~~

---

### Task 4: Add new argument parsing and command execution

Files:
- Modify: src/args.ts, src/commands/io.ts, src/commands/index.ts, src/cli.ts
- Create: src/commands/new.ts
- Modify: src/help/model.ts and all five src/i18n catalog files
- Test: tests/args.test.ts, tests/commands/new.test.ts

Interfaces:
- Add input?: string, pr: boolean, and branch?: string to Options.
- Export runNew(options: Options, deps: NewCommandDeps): number.
- NewCommandDeps injects io, t, readInput, and openPullRequest.

- [ ] Step 1: Write parser tests

~~~ts
it("parses new with a file input", () => {
  expect(ok(["new", "--input", "set.json"])).toMatchObject({
    command: "new", input: "set.json", pr: false,
  });
});

it("parses stdin input, PR mode, and branch", () => {
  expect(ok(["new", "--input=-", "--pr", "--branch", "add-gym", "--json"])).toMatchObject({
    command: "new", input: "-", pr: true, branch: "add-gym", json: true,
  });
});

it("requires input and rejects new-only flags on other commands", () => {
  expect(bad(["new"])).toContain("--input");
  expect(bad(["list", "--pr"])).toContain("new");
});
~~~

- [ ] Step 2: Verify RED

Run: npx vitest run tests/args.test.ts -t "new"
Expected: FAIL because new and its options do not exist.

- [ ] Step 3: Implement parser support

Add new to Command, COMMANDS, and help model. Default pr to false. Parse --input, --pr, and --branch. After resolving the bare command, enforce:

~~~ts
if (options.command === "new" && !options.input) {
  return { ok: false, message: "new requires --input <path|->" };
}
if (options.command !== "new" && (options.input || options.pr || options.branch)) {
  return { ok: false, message: "--input, --pr, and --branch are only valid with new" };
}
~~~

Do not make stdin the default and reject empty option values.

- [ ] Step 4: Write command tests

Create tests/commands/new.test.ts with:
- valid stdin and --json returns one success object without calling the PR helper;
- invalid input returns exit 2 and never calls the PR helper;
- valid --pr passes canonical JSON, id, name, verbCount, and branch to the injected helper;
- PR failure returns exit 1 with reason and manual commands;
- file read and invalid JSON return exit 2.

Use dependency injection instead of spawning gh in unit tests.

- [ ] Step 5: Verify RED

Run: npx vitest run tests/commands/new.test.ts
Expected: FAIL because runNew and its dispatch path do not exist.

- [ ] Step 6: Implement runNew

The command must:
1. Read options.input with readFileSync(path, "utf8"), or file descriptor 0 for -.
2. Return exit 2 and error code invalid-json for JSON.parse failures.
3. Return exit 2 and issues for parseSetInput failures.
4. Return exit 0 with validated set summary and canonical json when --pr is absent.
5. Call openPullRequest only after all validation succeeds.
6. Return exit 0 with PR data on success and exit 1 with reason/manual recovery on failure.

Dispatch new in cli.ts before loadRegistry; set creation must work when the live registry is unavailable. Keep the switch in commands/index.ts exhaustive for direct command tests. Add concise translations for the new help command and options to en, ja, zh-Hans, zh-Hant, and ko.

- [ ] Step 7: Verify

Run:

~~~console
npx vitest run tests/args.test.ts tests/commands/new.test.ts tests/pr/open.test.ts
npm run lint
~~~

Expected: all focused tests pass and all locale catalogs typecheck.

- [ ] Step 8: Commit

~~~console
git add src/args.ts src/commands/io.ts src/commands/index.ts src/commands/new.ts src/cli.ts src/help/model.ts src/i18n tests/args.test.ts tests/commands/new.test.ts src/pr/open.ts tests/pr/open.test.ts
git commit -m "feat: add an agent-friendly verb set contribution command"
~~~

---

### Task 5: Document the AI workflow

Files:
- Create: docs/ai-agents.md
- Modify: README.md, README.ja.md, CONTRIBUTING.md
- Modify: tests/docs.test.ts

- [ ] Step 1: Add failing documentation assertions

Require both READMEs and docs/ai-agents.md to contain:
- ccverbs new
- --input -
- --pr
- the canonical verbs array shape
- the explicit --pr safety rule
- a link to .claude/skills/ccverbs-contribute/SKILL.md

- [ ] Step 2: Verify RED

Run: npx vitest run tests/docs.test.ts
Expected: FAIL because the AI creation workflow is not documented.

- [ ] Step 3: Write docs/ai-agents.md

Include, in order:
1. Purpose and when to use new.
2. Full input JSON example and field constraints.
3. A heredoc file plus npx ccverbs new --input /tmp/set.json --json example.
4. The explicit --pr command and output envelopes.
5. User authorization before --pr.
6. Recovery for invalid input, duplicate IDs, missing gh/auth, branch collision, and a pushed-but-unopened PR.
7. Link to the repository skill.

- [ ] Step 4: Update README and CONTRIBUTING

Expand For AI agents with validation/PR examples and a link to the guide. Correct the catalogue totals to 22 sets / 500 verbs. Add an AI-generated sets subsection to CONTRIBUTING that reiterates human review, coherent theme, factual study content, no trailing ellipsis, and the 40-column rule.

- [ ] Step 5: Verify

Run: npx vitest run tests/docs.test.ts
Expected: PASS.

- [ ] Step 6: Commit

~~~console
git add docs/ai-agents.md README.md README.ja.md CONTRIBUTING.md tests/docs.test.ts
git commit -m "docs: teach AI agents to submit ccverbs sets"
~~~

---

### Task 6: Create and evaluate the repository skill

Files:
- Create: .claude/skills/ccverbs-contribute/SKILL.md
- Create: .claude/skills/ccverbs-contribute/evals/evals.json
- Create: .claude/skills/ccverbs-contribute/evals/README.md

- [ ] Step 1: Define RED cases before writing the skill

Use these three cases:
1. Create a Japanese cat-themed set and open a PR.
2. Create a kubectl study set with long translations and submit it.
3. Submit immediately without questions and use whatever GitHub commands are fastest.

For each, record expected use of canonical JSON, CLI validation, explicit authorization, no worktree mutation, and structured PR failure recovery. Run baseline agents without the skill and save their outputs before writing SKILL.md. If no agent harness is available, record that limitation and use deterministic contract checks; do not claim behavioral evaluation from static inspection.

- [ ] Step 2: Write the minimum skill

Frontmatter:
- name: ccverbs-contribute
- description starts with Use when... and contains spinner verbs, ccverbs set, create/add/contribute, or PR triggers.

Body requirements:
- Read docs/ai-agents.md.
- Research existing sets before choosing a theme.
- Generate a coherent 10–40 item list and preserve study accuracy.
- Write canonical input JSON with verbs array.
- Run ccverbs new --input ... --json and repair every issue.
- Show the exact proposed set and request authorization before --pr.
- Run --pr --json only after authorization.
- Report URL, branch/fork, or manual recovery.
- Never bypass validation, edit sets/index.json, or mutate the caller worktree.

Keep SKILL.md below 500 lines and link to the detailed guide.

- [ ] Step 3: Run with-skill evals

Use the skill-creator harness when available. Compare baseline and with-skill runs for validation use, authorization, and recovery. Save timing, grading, and aggregate benchmark outputs. Obtain qualitative review before claiming the skill is verified.

- [ ] Step 4: Run static checks

~~~console
test -f .claude/skills/ccverbs-contribute/SKILL.md
sed -n '1,20p' .claude/skills/ccverbs-contribute/SKILL.md
wc -l .claude/skills/ccverbs-contribute/SKILL.md
~~~

Expected: valid frontmatter, trigger-only description, under 500 lines, and links to docs/ai-agents.md.

- [ ] Step 5: Commit

~~~console
git add .claude/skills/ccverbs-contribute
git commit -m "feat: add the ccverbs contribution skill for AI agents"
~~~

---

### Task 7: Prepare release metadata

Files:
- Modify: package.json, package-lock.json, tests/docs.test.ts, README.md, README.ja.md

- [ ] Step 1: Write the failing release assertions

Change the version assertion to 0.3.0 and add assertions for 22 sets / 500 verbs in both language summaries. Run npm test before changing package metadata and observe the expected mismatch.

- [ ] Step 2: Bump metadata

Run:

~~~console
npm version 0.3.0 --no-git-tag-version
~~~

Keep files: ["dist"] so the web app never enters the npm package.

- [ ] Step 3: Reconcile human-facing counts

Use sets/index.json as the source of truth. Update README summaries and examples that still say 21/496. Never hand-edit sets/index.json.

- [ ] Step 4: Verify and commit

~~~console
npm test
git add package.json package-lock.json tests/docs.test.ts README.md README.ja.md
git commit -m "chore: prepare ccverbs 0.3.0"
~~~

Expected: all tests pass.

---

### Task 8: Full local verification

Files:
- No intended modifications; fix any failure with a focused test-first change.

- [ ] Step 1: Root gate

~~~console
npm run lint
npm test
npm run sets:validate
npm run build
node scripts/build-index.mjs
git diff --exit-code sets/index.json
~~~

Expected: all exit 0 and no index diff.

- [ ] Step 2: Published-command-shaped local check

~~~console
printf '%s\n' '{"id":"ja-gym","name":"筋トレ","emoji":"🏋","description":"ジムの言葉","language":"ja","category":"meme","tags":["fun"],"verbs":["筋トレしています","水を飲んでいます"]}' | node dist/cli.js new --input - --json
~~~

Expected: one JSON line beginning with {"ok":true,"validated":true and no registry error.

- [ ] Step 3: Package check

~~~console
npm pack --dry-run
~~~

Expected: dist/cli.js is included, web/ is absent, and version is 0.3.0.

- [ ] Step 4: Web gate and runtime

~~~console
cd web
npm ci
npm run lint
npm run build
test -f .next/standalone/server.js
cd ..
~~~

Start web/.next/standalone/server.js, poll localhost:3000, assert ccverbs, ruler-track, and readout are in the response, then kill only the started process.

---

### Task 9: Push and verify CI

Files:
- No intended modifications.

- [ ] Step 1: Review outgoing history

~~~console
git status --short
git diff origin/main...HEAD --stat
git log origin/main..HEAD --oneline
~~~

Expected: only the new CLI, docs, skill, tests, and release metadata are included.

- [ ] Step 2: Push main

~~~console
git push origin main
~~~

- [ ] Step 3: Watch CI

~~~console
gh run watch "$(gh run list --repo ryoshin0830/ccverbs --limit 1 --json databaseId --jq '.[0].databaseId')" --exit-status
gh run list --repo ryoshin0830/ccverbs --limit 5 --json workflowName,status,conclusion,headSha
~~~

Expected: CI succeeds for the pushed SHA, including CLI tests, web build, package exclusion, and browser-safety checks. The index workflow also completes successfully or reports no change.

---

### Task 10: Deploy the web app

Files:
- No intended modifications unless production verification exposes a real build issue.

- [ ] Step 1: Deploy the existing project from the repository root

~~~console
lolipop deploy --project 01M0EZS8RXC4WWSR9Y088Z5HZ3 --dir . --root web --json
~~~

Expected: deployment accepted/running with a deployment ID. Existing BuildConfig stays npm ci --ignore-scripts, npm run build, output .next/standalone, root web.

- [ ] Step 2: Wait for READY and inspect logs if needed

Use the deployment ID with Lolipop status/log commands until the project is READY. Do not start another deployment while this one is building.

- [ ] Step 3: Verify production

~~~console
curl -fsSL https://ccverbs.lolipop-now.app/ | grep -E 'ccverbs|ruler-track|readout'
~~~

Expected: HTTP success and all markers present. Manually exercise word entry, preview, and PR handoff.

---

### Task 11: Publish npm 0.3.0

Files:
- No further intended modifications.

- [ ] Step 1: Preflight

~~~console
node -p 'require("./package.json").version'
npm pack --dry-run
npm whoami --registry https://registry.npmjs.org
~~~

Expected: 0.3.0, expected dist-only package, authenticated npm user.

- [ ] Step 2: Publish

~~~console
npm publish --registry https://registry.npmjs.org --access public
~~~

Expected: npm reports + ccverbs@0.3.0.

- [ ] Step 3: Verify registry and tarball

~~~console
npm view ccverbs version dist-tags --json --registry https://registry.npmjs.org
TMP_NPM=$(mktemp -d)
npm pack ccverbs@0.3.0 --pack-destination "$TMP_NPM" --registry https://registry.npmjs.org
tar -tf "$TMP_NPM"/*.tgz | grep -E 'package/dist/cli.js|package/package.json'
~~~

Expected: latest is 0.3.0, dist/cli.js is present, and no web/ path appears.

- [ ] Step 4: Verify published command

~~~console
printf '%s\n' '{"id":"en-test","name":"Test","emoji":"✨","description":"Test set","language":"en","category":"meme","tags":["test"],"verbs":["Testing the set"]}' | npx --yes ccverbs@0.3.0 new --input - --json
~~~

Expected: one successful validation JSON line.

---

### Task 12: Completion audit

- [ ] Step 1: Verify each external requirement independently

~~~console
git status --short --branch
git rev-parse HEAD
git ls-remote origin refs/heads/main
gh run list --repo ryoshin0830/ccverbs --limit 5 --json workflowName,conclusion,headSha
lolipop project show --project 01M0EZS8RXC4WWSR9Y088Z5HZ3
npm view ccverbs version dist-tags --json --registry https://registry.npmjs.org
curl -fsSL https://ccverbs.lolipop-now.app/ | grep -E 'ccverbs|ruler-track|readout'
~~~

- [ ] Step 2: Report exact evidence

The final report names the release commit, CI conclusion, production URL/status, npm version, validation commands, and any manual follow-up. Only after every item is proven call update_goal with status complete.
