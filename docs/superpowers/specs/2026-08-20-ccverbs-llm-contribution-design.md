# ccverbs LLM contribution workflow design

- Date: 2026-08-20
- Scope: ccverbs 0.3.0
- Status: approved for implementation by the release objective

## 1. Goal

Make it easy for an LLM or coding agent to create a community verb set and
open a pull request through the ccverbs CLI, while keeping the repository
provider-agnostic and keeping all external writes explicit.

The LLM creates the content. ccverbs owns the input contract, validation,
canonical JSON formatting, and the optional GitHub workflow. The CLI never
calls an LLM API and never changes the caller's working tree.

## 2. Current constraints

- src/contrib/ already contains browser-safe validation, inference, and JSON
  building functions used by the web builder.
- src/pr/open.ts and tests/pr/open.test.ts exist as an untracked, CLI-only
  implementation for a throwaway clone, fork handling, and PR creation. They
  become part of this feature after integration and review.
- The web builder uses a GitHub new-file deep link and remains client-only.
- sets/index.json is regenerated on main; a contribution PR contains only
  sets/<id>.json.
- The current npm release is 0.2.2. The new user-facing command is released as
  0.3.0.

## 3. Agent-facing CLI contract

### 3.1 Command

~~~console
ccverbs new --input <path|-> [--json]
ccverbs new --input <path|-> --pr [--branch <name>] [--json]
~~~

--input is required. A value of - means stdin. Requiring the flag prevents a
bare ccverbs new from blocking while an agent has no input. --pr is required
for any network, fork, push, or GitHub PR operation; validation alone has no
external side effect.

### 3.2 Input JSON

The input is the same shape as a committed set file. $schema is optional and
is normalized in the output. author, source, and i18n are optional.

~~~json
{
  "id": "ja-gym",
  "name": "筋トレ",
  "emoji": "🏋",
  "description": "ジムのセット間に見る言葉",
  "language": "ja",
  "category": "meme",
  "tags": ["fun", "gym"],
  "author": { "name": "Your Name", "github": "your-handle" },
  "source": "https://example.com/source",
  "verbs": ["筋トレしています", "プロテインを飲んでいます"]
}
~~~

Validation is the intersection of the JSON schema and repository contribution
rules: required metadata, kebab-case IDs and tags, unique verbs, no control
characters, no trailing …, ..., or 。, 1–120 characters, and display width of
at most 40 columns. The command does not query the registry for ID collisions;
CI remains the authoritative check for that race.

### 3.3 Output and exit behavior

With --json, stdout is exactly one JSON object whose first key is ok.
Successful validation returns a compact set summary and canonical file content.
Successful PR creation adds the branch, fork status, and URL. Invalid JSON,
schema errors, and contribution-rule errors return stable issue paths and
codes. PR/tool failures return the reason and manual recovery commands.

- 0: validation or PR creation succeeded
- 1: runtime or PR workflow failure
- 2: CLI usage or invalid input

No PR operation starts until input parsing and every validation step succeeds.

## 4. Architecture

~~~text
stdin/file JSON
      │
      ▼
src/contrib/input.ts  ── schema + SetDraft adapter ──► validateDraft()
      │                                             │
      ▼                                             ▼
buildSetJson()                              structured diagnostics
      │
      ├── no --pr: return canonical JSON/summary
      │
      └── --pr: src/pr/open.ts
                    └── temporary upstream clone
                        └── one sets/<id>.json commit
                            └── push/fork + gh pr create
~~~

src/contrib/input.ts remains pure and browser-safe. src/commands/new.ts owns
Node filesystem input and command output. src/pr/open.ts is the only module
that shells out and is never imported by web/. src/cli.ts dispatches new before
registry loading because creating a set does not require the live registry and
should still work when GitHub's index is unavailable.

SetDraft gains optional i18n data so the CLI can round-trip the full set schema.
buildSetObject emits i18n immediately before verbs, matching the repository's
established key order.

## 5. Safety and failure handling

- --pr is explicit opt-in. Validation and canonical JSON generation are local-only.
- The caller's current repository is never staged, committed, or modified.
- The PR helper clones main into a temporary directory, writes exactly one set
  file, commits it, pushes to the maintainer branch or contributor fork, and
  opens a PR. Temporary files are removed on every handled exit.
- Missing gh, missing authentication, fork/clone/push/PR failures are
  machine-readable and include a manual path forward.
- Existing branch names are not overwritten. A rejected push explains how to
  choose --branch.
- The helper does not rebuild sets/index.json; the post-merge workflow does
  that on main.

## 6. AI documentation and skill

docs/ai-agents.md is the detailed, provider-neutral contract. The README's AI
section links to it and includes a short copy-paste workflow. CONTRIBUTING.md
explains what an AI-generated contribution must still satisfy.

The repository ships .claude/skills/ccverbs-contribute/SKILL.md. It triggers
when an agent is asked to create, improve, or submit a ccverbs spinner verb
set. It instructs the agent to research existing sets, generate a coherent
10–40 item list, write canonical input JSON, run ccverbs new --json, show the
result to the user, and only then use --pr after explicit authorization. It
treats validation failures as feedback to repair, never as a reason to bypass
the CLI. The skill eval prompts cover a normal meme set, a study set with
width/translation edge cases, and a failed PR-tool path.

## 7. Verification and release

Tests cover the input adapter, all new argument branches, command output and
failure envelopes, PR dependency injection, and the existing helper's
throwaway-worktree guarantees. Documentation tests assert the new command, AI
guide, and skill are discoverable. The release gate is:

~~~console
npm run lint
npm test
npm run sets:validate
npm run build
npm pack --dry-run
cd web && npm run lint && npm run build
~~~

After the local gate, push main, wait for GitHub CI and the index workflow,
deploy the existing Lolipop ccverbs project from the repository root with
--root web, verify the public page, then publish npm 0.3.0 and verify the
registry tarball exposes the new CLI.

## 8. Non-goals

- Calling OpenAI, Anthropic, or another model provider from the CLI.
- Automatically merging a PR or bypassing GitHub review.
- Online ID collision checking during validation.
- Replacing the browser builder or adding server-side state.

