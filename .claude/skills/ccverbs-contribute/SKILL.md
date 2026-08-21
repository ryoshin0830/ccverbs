---
name: ccverbs-contribute
description: Use when an LLM or coding agent is asked to create, improve, validate, or submit a ccverbs verb set, spinner verb list, or word-list pull request, including requests mentioning npx ccverbs, the interactive Create a new set entry, ccverbs new --help, sets/*.json, or community verb contributions.
---

# Contributing a ccverbs verb set

Use this skill to turn an agent-generated list into a reviewable ccverbs
contribution. The CLI is the source of truth for schema validation, repository
rules, canonical JSON, and the optional GitHub workflow.

## Read first

Read [docs/ai-agents.md](../../../docs/ai-agents.md) for the machine-readable
contract and [CONTRIBUTING.md](../../../CONTRIBUTING.md) for editorial rules.
Then run `ccverbs new --help` (or `npx ccverbs new --help`) for the command-local
input, output, repair, and safety contract. `npx ccverbs --help` carries the
short version of the same workflow, so it is a safe starting point when this
skill is not loaded. For a human-facing workflow, run
`npx ccverbs` and choose **Create a new set**; that opens the hosted builder.
Before choosing a theme, inspect the live catalog:

```console
ccverbs list --json
ccverbs show <similar-id> --json
```

Do not assume a theme is new just because its words are new. Prefer a distinct,
coherent voice; if an existing set already covers the theme, explain whether
the proposal should extend it or become a clearly differentiated set.

## Draft the input

Create one JSON object with `id`, `name`, `emoji`, `description`, `language`,
`category`, `tags`, and `verbs`. Optional fields are `author`, `source`, and
per-locale `i18n`. Keep the list useful and internally consistent, normally
10–40 entries. For study sets, put the term and its explanation on the same
line. Preserve attribution when a source or author is known.

Use a temporary file or stdin for the draft. Do not edit `sets/index.json`,
unrelated files, or the user's current worktree just to prepare a contribution.

## Validate and repair

Run the local, non-mutating check first:

```console
ccverbs new --input draft.json --json
# or: cat draft.json | ccverbs new --input - --json
```

Parse the one JSON object, check `ok` before reading other fields, and repair
every item in `error.issues`. Their `path` and `code` are more reliable than a
human message. Repeat until `ok: true`; then use the returned canonical `json`
as the content to submit. Pay special attention to duplicates, trailing `…`,
`...` or `。`, control characters, and display width above 40 columns.

Do not bypass the CLI with a hand-written validator. Validation does not check
live ID collisions; CI and human review handle that race.

## Open a PR only with authorization

Validation alone has no network or repository side effect. After validation,
show the user the set summary and canonical content. Run the external step only
when the user has given explicit authorization to open/submit the PR. A request
that explicitly says “open a PR” or “submit this contribution” is such
authorization; a request to draft, validate, or explain is not.

```console
ccverbs new --input draft.json --pr --json
ccverbs new --input draft.json --pr --branch add-my-set --json
```

The helper uses a temporary clone, commits only `sets/<id>.json`, and does not
rebuild `sets/index.json`. It never stages or commits the caller's worktree.
Use a simple branch name; do not invent a branch by shell-interpolating input.

For `ok: true`, report `pr.url`, `pr.branch`, and `pr.forked`. For
`error.code: "pr-failed"`, report the reason and every `manual` step. Do not
blindly retry a rejected branch or silently fall back to a direct push; ask the
user whether to authenticate, choose another branch, or use the manual path.

## Handoff format

End with a compact, machine-readable summary in prose:

- validation: success or the remaining issue paths/codes;
- set: id, name, category, language, and verb count;
- external action: not requested, not authorized, or PR URL/branch/fork;
- next step: the exact repair, authorization question, or manual recovery.

The pull request is a proposal. Never claim that it is merged or accepted until
GitHub and a human reviewer confirm that independently.
