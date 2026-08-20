# Interactive Apply Confirmation UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Replace the interactive picker's opaque JSON diff confirmation with a localized explanation of the target file, change, current state, resulting state, and effect.

**Architecture:** Keep settings computation and writing unchanged. Extend the inferred i18n catalog with semantic summary functions, then render those summaries in ConfirmScreen; retain src/settings/diff.ts for non-interactive command previews. Add focused Ink regression tests for replace, append, Japanese copy, and removal of raw diff lines.

**Tech Stack:** TypeScript, React, Ink, Vitest, npm package scripts.

## Global Constraints

- The picker reads the existing mode and scope; it must not ask new mode or scope questions.
- Y/Enter confirms and N/Escape returns to the set picker exactly as before.
- The non-interactive ccverbs set and ccverbs set --dry-run diff output remains unchanged.
- All five catalogs (en, ja, zh-Hans, zh-Hant, ko) provide localized semantic copy.
- The confirmation shows the resolved settings path and distinguishes replace from append.
- The patch release version for the published CLI is 0.4.1.

---

### Task 1: Add failing confirmation-screen regression tests

**Files:**
- Modify: tests/ui/App.test.tsx:166-216

**Interfaces:**
- Consumes: existing mount, openFirstSet, registry, and getCatalog helpers.
- Produces: assertions for the human-readable confirmation contract.

- [ ] Step 1: Replace the generic confirmation assertion.

Replace the old navigation-only test with this behavior test:

~~~tsx
it("shows a human-readable change summary instead of a raw JSON diff", async () => {
  const { lastFrame, stdin } = mount();
  await tick();
  await openFirstSet(stdin);
  const frame = lastFrame() ?? "";

  expect(frame).toContain("Apply this change?");
  expect(frame).toContain("Target");
  expect(frame).toContain("Change");
  expect(frame).toContain("Current");
  expect(frame).toContain("After");
  expect(frame).toContain("Effect");
  expect(frame).toContain(join(home, ".claude", "settings.json"));
  expect(frame).toContain("not configured");
  expect(frame).toContain("Alpha's 2 verbs");
  expect(frame).not.toContain('    "spinnerVerbs": {');
  expect(frame).not.toContain('+   "verbs": [');
});
~~~

- [ ] Step 2: Add the append-mode behavior test.

~~~tsx
it("explains the built-in verbs and resulting total in append mode", async () => {
  const { lastFrame, stdin } = mount({ config: { mode: "append" } });
  await tick();
  await openFirstSet(stdin);
  const frame = lastFrame() ?? "";

  expect(frame).toContain("Append Alpha's 2 verbs to Claude Code's 186 built-in verbs");
  expect(frame).toContain("Claude Code's 186 built-in + 2 custom verbs");
  expect(frame).toContain("Alpha's 2 verbs added (188 total)");
  expect(frame).toContain("Claude Code will pick loading verbs from 188 verbs.");
});
~~~

- [ ] Step 3: Extend the existing Japanese test with these assertions:

~~~tsx
expect(frame).toContain("この変更を適用しますか？");
expect(frame).toContain("変更対象");
expect(frame).toContain("変更内容");
expect(frame).toContain("現在");
expect(frame).toContain("適用後");
expect(frame).toContain("反映後");
expect(frame).toContain("未設定");
~~~

Keep the assertions for 置き換える, 全体, and the resolved path.

- [ ] Step 4: Run npm test -- tests/ui/App.test.tsx.

Expected: FAIL because the current frame contains Apply?, lacks the new
semantic labels, and still renders the raw diff.

---

### Task 2: Add the localized semantic summary contract

**Files:**
- Modify: src/i18n/en.ts:48-67
- Modify: src/i18n/ja.ts:34-63
- Modify: src/i18n/zh-Hans.ts:34-63
- Modify: src/i18n/zh-Hant.ts:34-63
- Modify: src/i18n/ko.ts:34-63

**Interfaces:**
- Consumes: selected set name, selected count, current state, mode, and
  effective count from ConfirmScreen.
- Produces: Catalog.wizard.targetLabel, changeLabel, currentLabel, afterLabel,
  effectLabel, changeSummary, currentSummary, afterSummary, and effectSummary.

- [ ] Step 1: Add the English fields.

Add these fields to en.wizard. DEFAULT_VERB_COUNT is already imported:

~~~ts
targetLabel: "Target",
changeLabel: "Change",
currentLabel: "Current",
afterLabel: "After",
effectLabel: "Effect",
changeSummary: (name: string, n: number, mode: "replace" | "append") =>
  mode === "replace"
    ? "Set spinnerVerbs to " + name + "'s " + n + " verbs (replace the current list)"
    : "Append " + name + "'s " + n + " verbs to Claude Code's " + DEFAULT_VERB_COUNT + " built-in verbs",
currentSummary: (mode: "replace" | "append" | null, n: number) =>
  mode === null
    ? "not configured (Claude Code's " + DEFAULT_VERB_COUNT + " built-in verbs)"
    : mode === "replace"
      ? n + " custom verbs (replace)"
      : "Claude Code's " + DEFAULT_VERB_COUNT + " built-in + " + n + " custom verbs",
afterSummary: (name: string, n: number, mode: "replace" | "append", total: number) =>
  mode === "replace"
    ? name + "'s " + n + " verbs only"
    : name + "'s " + n + " verbs added (" + total + " total)",
effectSummary: (n: number) => "Claude Code will pick loading verbs from " + n + " verbs.",
applyQuestion: "Apply this change?",
changeSettings: "Change mode or target with: ccverbs config",
~~~

- [ ] Step 2: Add the Japanese fields.

Use these semantics in ja.wizard:

~~~ts
targetLabel: "変更対象",
changeLabel: "変更内容",
currentLabel: "現在",
afterLabel: "適用後",
effectLabel: "反映後",
changeSummary: (name, n, mode) =>
  mode === "replace"
    ? "spinnerVerbs を" + name + "の" + n + "語に置き換えます"
    : "spinnerVerbs に" + name + "の" + n + "語を追加します（Claude Code 標準の" + DEFAULT_VERB_COUNT + "語に追加）",
currentSummary: (mode, n) =>
  mode === null
    ? "未設定（Claude Code 標準の" + DEFAULT_VERB_COUNT + "語）"
    : mode === "replace"
      ? "カスタム" + n + "語（置き換え）"
      : "Claude Code 標準の" + DEFAULT_VERB_COUNT + "語 + 追加" + n + "語",
afterSummary: (name, n, mode, total) =>
  mode === "replace" ? name + "の" + n + "語だけ" : name + "の" + n + "語を追加（合計" + total + "語）",
effectSummary: (n) => "Claude Code は" + n + "語から進行表示を選びます",
applyQuestion: "この変更を適用しますか？",
changeSettings: "適用方法や保存先を変える: ccverbs config",
~~~

- [ ] Step 3: Translate the same fields in zh-Hans, zh-Hant, and ko.

Use the same signatures. Each translation must explicitly distinguish replace
from add/append, mention Claude Code's built-in count when current is unset,
and include the append total. The Catalog annotation must remain the
compile-time check that no field is omitted; do not fall back to English.

---

### Task 3: Render the human-readable confirmation screen

**Files:**
- Modify: src/ui/screens/ConfirmScreen.tsx:1-105

**Interfaces:**
- Consumes: existing before, after, set, settingsPath, mode, scope, t, locale,
  and keyboard callbacks.
- Produces: localized target/change/current/after/effect rows with unchanged
  confirmation behavior.

- [ ] Step 1: Delete the renderDiff import and the JSX block that maps
  renderDiff(before, after).split("\\n") into colored lines. Leave
  src/settings/diff.ts unchanged for command previews.

- [ ] Step 2: Add these values before the JSX return:

~~~tsx
const setName = localizedName(set, locale);
const effectiveCount = effectiveVerbCount(after);
const currentMode = before?.mode ?? null;
const currentCount = before?.verbs.length ?? 0;
~~~

- [ ] Step 3: Keep mode and scope rows, then render the following rows:

~~~tsx
<Box marginTop={1} flexDirection="column">
  <Text><Text dimColor>{t.wizard.targetLabel}</Text>{"   "}{settingsPath}</Text>
  <Text><Text dimColor>{t.wizard.changeLabel}</Text>{"   "}{t.wizard.changeSummary(setName, set.verbs.length, mode)}</Text>
  <Text><Text dimColor>{t.wizard.currentLabel}</Text>{"   "}{t.wizard.currentSummary(currentMode, currentCount)}</Text>
  <Text><Text dimColor>{t.wizard.afterLabel}</Text>{"   "}{t.wizard.afterSummary(setName, set.verbs.length, mode, effectiveCount)}</Text>
</Box>
<Box marginTop={1}>
  <Text><Text dimColor>{t.wizard.effectLabel}</Text>{"   "}{t.wizard.effectSummary(effectiveCount)}</Text>
</Box>
~~~

Keep the existing Y/Enter and N/Escape handling and use the explicit
localized applyQuestion and changeSettings strings at the bottom.

- [ ] Step 4: Run npm test -- tests/ui/App.test.tsx tests/i18n/catalog.test.ts.

Expected: focused UI and catalog tests pass, including replace, append,
Japanese copy, keyboard navigation, and settings writes.

---

### Task 4: Version and verify the patch release

**Files:**
- Modify: package.json:3
- Modify: package-lock.json:3,5

**Interfaces:**
- Consumes: completed UI and catalog changes.
- Produces: npm package version 0.4.1.

- [ ] Step 1: Change only the root version fields from 0.4.0 to 0.4.1.

- [ ] Step 2: Run each command and require exit code 0:

~~~bash
npm test
npm run sets:validate
npm run build
git diff --check
~~~

The suite must include the existing renderDiff tests, proving the
non-interactive diff contract was preserved.

- [ ] Step 3: Run node dist/cli.js --version after build and require output 0.4.1.

---

### Task 5: Commit, push, CI, deploy, and publish

**Files:**
- No additional source files; use the verified changes from Tasks 1–4.

**Interfaces:**
- Consumes: clean, locally verified main changes and package version 0.4.1.
- Produces: the commit on GitHub, successful CI, a READY Web deploy, and
  registry version 0.4.1.

- [ ] Step 1: Commit:

~~~bash
git add src/i18n/en.ts src/i18n/ja.ts src/i18n/zh-Hans.ts src/i18n/zh-Hant.ts src/i18n/ko.ts src/ui/screens/ConfirmScreen.tsx tests/ui/App.test.tsx package.json package-lock.json
git commit -m "fix: clarify interactive apply confirmation"
~~~

- [ ] Step 2: Run git push origin main. Require git ls-remote origin
  refs/heads/main to equal local git rev-parse HEAD.

- [ ] Step 3: Use gh run list --repo ryoshin0830/ccverbs --limit 5
  --json databaseId,headSha,status,conclusion,workflowName,url and wait for
  the run whose headSha equals pushed HEAD. Require CLI and Web success.

- [ ] Step 4: Deploy with:

~~~bash
lolipop deploy --project 01M0EZS8RXC4WWSR9Y088Z5HZ3 --json
lolipop project show --project 01M0EZS8RXC4WWSR9Y088Z5HZ3 --json
~~~

Wait for DEPLOYMENT_STATUS_READY, then request the public URL with a
cache-busting query and verify HTTP 200.

- [ ] Step 5: Publish npm 0.4.1:

~~~bash
npm publish --dry-run --access public --registry https://registry.npmjs.org
npm publish --access public --registry https://registry.npmjs.org
npm view ccverbs version --registry https://registry.npmjs.org
~~~

Require registry version 0.4.1.

- [ ] Step 6: Require git status --short to be empty and local/remote SHAs to
  match before calling the goal complete.
