# ccverbs contribution guide for AI agents

This is the provider-neutral contract for an LLM or coding agent that creates
a community verb set. The agent creates the content; `ccverbs` validates it,
formats it, and can optionally prepare a pull request. The CLI does not call a
model API.

## Recommended workflow

The command forms are:

```console
ccverbs new --input <path|-> --json
ccverbs new --input <path|-> --pr [--branch <name>] --json
```

For the complete command-local contract, start with:

```console
ccverbs new --help
```

If a human wants to build the set interactively, `npx ccverbs` opens the picker.
Select **Create a new set** to launch the hosted builder at
`https://ccverbs.lolipop-now.app/`. The builder previews the real spinner and
opens GitHub's new-file/PR flow. This is an alternative to the JSON/CLI path,
not an agent requirement.

1. Read the existing sets with `ccverbs list --json` and, when useful,
   `ccverbs show <id> --json`. Choose a theme that is coherent and not already
   covered.
2. Create a JSON object in the same shape as `sets/<id>.json`. Aim for 10–40
   useful verbs, with one idea and one voice throughout the set.
3. Validate locally without any network or repository mutation:

   ```console
   cat set.json | ccverbs new --input - --json
   ```

4. Repair every item in `error.issues`, then repeat validation until the
   response has `ok: true`.
5. Show the summary and canonical JSON to the user. Only run the PR step after
   the user explicitly authorizes an external GitHub action:

   ```console
   cat set.json | ccverbs new --input - --pr --json
   ```

6. Report the returned PR URL, branch, fork status, or the manual recovery
   commands if the GitHub tooling fails. A PR still needs normal human review;
   the command never merges it.

`--pr` is the only switch that permits cloning, forking, pushing, or opening a
PR. The command writes to a temporary clone and never stages or commits the
agent's current working tree. It does not regenerate `sets/index.json`; the
main-branch workflow does that after merge.

When the user has not asked for a PR, stop after step 5 and ask whether they
want the external submission. Never infer authorization from a successful
validation or from the presence of a complete JSON document.

## Input contract

The input is one JSON object. `$schema` is optional and is added to canonical
output. The required fields are:

```json
{
  "id": "ja-gym",
  "name": "筋トレ",
  "emoji": "🏋",
  "description": "ジムのセット間に見る言葉",
  "language": "ja",
  "category": "meme",
  "tags": ["fun", "gym"],
  "verbs": ["筋トレしています", "プロテインを飲んでいます"]
}
```

Optional fields are `author` (`name`, optional `github`), `source` (an HTTP(S)
URL), and `i18n` (per-locale `name` / `description` for `en`, `ja`, `zh-Hans`,
`zh-Hant`, or `ko`). `language` is one of `ja`, `en`, `zh-Hans`, `zh-Hant`,
`ko`, or `mixed`; `category` is `meme`, `study`, or `classic`.

Validation combines the set schema and repository rules:

- `id` and tags are lowercase kebab-case; names and descriptions have their
  documented length limits.
- `verbs` contains 1–500 unique strings. A verb is trimmed, has no control
  characters, is at most 120 characters, and does not end in `…`, `...`, or
  `。`.
- Each verb must be at most 40 terminal columns wide. CJK and emoji can take
  two columns even when their character count is small.
- Unknown top-level fields are rejected so an agent cannot accidentally submit
  metadata that the registry will ignore.

The command does not check whether the ID already exists in the live registry.
That race is checked by repository tests and CI.

## Machine-readable output

With `--json`, stdout contains exactly one JSON object whose first key is
`ok`. A successful validation looks like this (the `json` value is the
canonical file content):

```json
{
  "ok": true,
  "validated": true,
  "set": {
    "id": "ja-gym",
    "name": "筋トレ",
    "emoji": "🏋",
    "description": "ジムのセット間に見る言葉",
    "language": "ja",
    "category": "meme",
    "tags": ["fun", "gym"],
    "verbCount": 2
  },
  "json": "{\n  ...\n}\n"
}
```

An invalid input exits `2` and includes stable paths and repairable issue
codes:

```json
{
  "ok": false,
  "error": {
    "code": "invalid-input",
    "message": "input has 1 validation issue",
    "issues": [
      { "path": "verbs[0]", "code": "trailing-ellipsis", "message": "..." }
    ]
  }
}
```

Malformed JSON and unreadable files also exit `2` with `invalid-json` or
`input-read-failed`. Treat `error.issues` as data rather than trying to parse
the human-readable message.

After a successful PR operation, the response adds:

```json
{
  "ok": true,
  "validated": true,
  "set": { "id": "ja-gym", "verbCount": 2 },
  "pr": {
    "url": "https://github.com/ryoshin0830/ccverbs/pull/123",
    "branch": "add-ja-gym",
    "forked": true
  }
}
```

The PR workflow exits `1` when a dependency or GitHub action fails. The
response has `error.code: "pr-failed"`, the branch/fork state, and a `manual`
array containing the equivalent recovery steps. Do not silently retry a
rejected branch: choose a new `--branch <name>` after confirming with the
user.

## Safety checklist for agents

- Do not use `--pr` merely because validation passed; obtain explicit user
  authorization immediately before the external action.
- Do not write `sets/index.json` in the contribution. Do not edit unrelated
  files or the caller's working tree.
- Keep the list useful, non-discriminatory, and distinct from existing sets.
- Preserve author/source attribution when the content is derived from a source.
- Treat the resulting URL as a draft for review, not as proof of acceptance.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for the human review rules and
[the repository skill](../.claude/skills/ccverbs-contribute/SKILL.md) for the
repeatable agent procedure.
