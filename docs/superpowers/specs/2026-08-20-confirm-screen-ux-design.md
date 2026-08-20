# Interactive Apply Confirmation UX Design

**Date:** 2026-08-20  
**Status:** Direction approved; written-spec review pending

## Problem

The interactive picker currently shows a low-level JSON-like diff followed by:

```text
Apply? (Y/n)        change these with: ccverbs config
```

That does not explain the user-visible consequence of pressing `Y`. The user
has to infer the meaning of `spinnerVerbs`, distinguish the current and next
values in the diff, and understand what `ccverbs config` can change.

## Goal

Make the interactive confirmation screen answer these questions before the
user confirms:

1. Which set is being applied?
2. Which settings file will change?
3. What value is changing and is it being replaced or appended?
4. What was configured before and what will be configured after?
5. What will Claude Code do after the change?
6. Where can the user change the mode or destination later?

## Non-goals

- Do not change the settings-writing behavior, backup behavior, or keyboard
  controls.
- Do not change the non-interactive `ccverbs set` output contract.
- Do not remove the low-level diff renderer used by command-level dry runs.
- Do not add a new configuration option or ask mode/scope questions in the
  picker.

## User-visible design

The confirmation screen keeps the selected set, mode, scope, and path visible,
but replaces the raw diff in the interactive screen with a human-readable
summary:

```text
Applying 🔧 Git commands

Target     /Users/you/.claude/settings.json
Change     Set spinnerVerbs to Git commands' 24 verbs (replace the current list)
Current    not configured (Claude Code's 186 built-in verbs)
After      Git commands' 24 verbs only
Effect     Claude Code will pick loading verbs from 24 verbs.

Apply this change? (Y/n)        Change mode or target with: ccverbs config
```

The Japanese equivalent must communicate the same information without relying
on untranslated implementation terms:

```text
Git commands を適用します

変更対象   /Users/you/.claude/settings.json
変更内容   spinnerVerbs を Git commands の24語に置き換えます
現在       未設定（Claude Code 標準の186語）
適用後     Git commands の24語だけ
反映後     Claude Code は24語から進行表示を選びます

この変更を適用しますか？ (Y/n)        適用方法や保存先を変える: ccverbs config
```

For `append`, the change and after lines explicitly say that the selected
verbs are added to Claude Code's built-in verbs and show the resulting total.
For an existing configuration, the current line reports its mode and count;
for no configuration, it reports the built-in default count.

The exact wording is owned by the locale catalog. The screen must compose the
following semantic fields from localized catalog entries:

- target label and resolved settings path;
- change description containing set name, selected count, and mode;
- current-state description, including the built-in default when unset;
- after-state description, including the resulting count for append;
- effect description using the effective verb count;
- an explicit confirmation question;
- an actionable settings hint naming `ccverbs config`.

## Architecture and data flow

`App` continues to read the current `spinnerVerbs` value before entering the
confirmation stage and passes `before`, `after`, the resolved path, mode,
scope, set, and catalog to `ConfirmScreen`.

`ConfirmScreen` will:

1. Render the selected set title, target path, mode, and scope.
2. Render localized human-readable change/current/after/effect summaries.
3. Keep the existing `Y`/Enter confirmation and `N`/Escape back behavior.
4. Leave `src/settings/diff.ts` unchanged for command-level previews.

No additional state or filesystem access is required.

## Localization contract

All five shipped catalogs (`en`, `ja`, `zh-Hans`, `zh-Hant`, `ko`) must add
translations for every semantic field. The catalog type remains inferred from
English, so TypeScript compilation will require every locale to implement the
same fields. The translations must not fall back to English and must preserve
the distinction between replace and append.

## Testing and acceptance criteria

- A focused UI regression test fails before the implementation because the
  confirmation frame does not contain the new target/change/current/after/effect
  labels.
- The test passes after the implementation for English and Japanese.
- Tests cover both replace and append summaries, including the built-in count
  and the resulting append total.
- The confirmation frame no longer renders raw JSON diff lines.
- Existing confirmation keyboard behavior and settings writes remain passing.
- Existing command-level diff tests remain passing.
- Full `npm test`, `npm run build`, and `git diff --check` pass.
