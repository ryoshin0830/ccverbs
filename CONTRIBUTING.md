# Contributing to ccverbs

The point of this project is the verb sets. Adding one is a single JSON file and a pull request.

Because `ccverbs` fetches `sets/index.json` from `main` at runtime, **a merged PR reaches every user immediately** — there is no npm release step waiting between your set and the people who'll read it.

---

## Adding a verb set

### 1. Create `sets/<your-id>.json`

```json
{
  "$schema": "../schema/verb-set.schema.json",
  "id": "my-set",
  "name": "My Set",
  "emoji": "✨",
  "description": "One line explaining what this set is",
  "language": "en",
  "category": "meme",
  "tags": ["fun", "example"],
  "author": { "name": "Your Name", "github": "your-handle" },
  "source": "https://example.com/where-this-came-from",
  "verbs": [
    "Doing the thing",
    "Doing the other thing"
  ]
}
```

The filename must be `<id>.json`, and `id` must match it.

### 2. Regenerate the index and check your work

```console
$ npm install
$ npm run sets:index      # regenerates sets/index.json
$ npm run sets:validate   # fast, dependency-free rule check
$ npm test                # the authoritative schema-backed check
```

Both `sets:validate` and the test suite run in CI, along with a check that `sets/index.json` matches what `sets:index` produces. **Commit the regenerated `sets/index.json`** — but never hand-edit it.

### 3. Open a pull request

Describe the set in a sentence. That's it.

---

## Field reference

| Field | Required | Rules |
| --- | --- | --- |
| `id` | yes | kebab-case (`^[a-z0-9]+(-[a-z0-9]+)*$`). Must equal the filename and be unique across all sets |
| `name` | yes | 1–40 characters. Shown in the picker |
| `emoji` | yes | One emoji. Prefer a **single-codepoint emoji-presentation** character (`🌿`, `🦜`) over flags or ZWJ sequences (`🇯🇵`, `🏴‍☠️`) and over text-presentation glyphs (`☸`, `⌨`) — those render at inconsistent widths across terminals |
| `description` | yes | 1–120 characters, one line |
| `language` | yes | `ja`, `en`, or `mixed`. Use `mixed` for term-plus-translation sets |
| `category` | yes | `meme` (for fun), `study` (flashcards), `classic` (general-purpose replacement) |
| `tags` | yes | Up to 8 kebab-case keywords. These are searchable, so include the obvious ones |
| `author` | no | `{ "name": "...", "github": "..." }`. Take credit |
| `source` | no | URL, if the content came from somewhere |
| `verbs` | yes | 1–500 strings. 10–40 is the comfortable range |

---

## Verb rules

These are enforced. A violation fails CI.

- **Never end a verb with `…`, `...`, or `。`** — Claude Code appends the ellipsis itself (`verb + "…"`), so `"Thinking…"` renders as `Thinking……`.
- No duplicates within a set.
- No leading or trailing whitespace.
- No control characters or newlines.
- 1–120 characters.

And one warning-level rule:

- **Keep each verb within 40 terminal columns** (CJK and emoji count as 2). The spinner line also carries the elapsed time and token count; a long verb pushes them off screen or gets truncated. The validator warns above 40 and the test suite fails above 40, so treat it as a limit.

---

## Writing a good set

**Pick verbs the reader will see hundreds of times.** A verb that's funny once is worse than a verb that's mildly satisfying forever.

**For `meme` sets:** stay in one voice. `ja-ramen` is a single continuous process; `ja-cat` is one animal's day. A grab-bag of unrelated jokes reads as noise once it's shuffled.

**For `study` sets:** the format is up to you, but be consistent *within* the set. These all work:

```
git rebase -i — 対話的に履歴を書き換え     (term — meaning)
ephemeral — 儚い、短命の
303 See Other — GETで見に行け              (term already carries context)
O(n log n) — 比較ソートの下限
```

Two things make a study set actually teach something:

1. **Pick the things people look up repeatedly**, not the things they already know. `git bisect` earns its place; `git commit` does not.
2. **Put the answer on the same line.** You're not going to pause and look it up mid-turn — the point is that the answer arrives for free.

**Don't** make a set that's only useful to one team, one codebase, or one private joke.

---

## Editing an existing set

Fixing a typo or a wrong translation is always welcome — open a PR.

Adding verbs to someone else's set is fine too. Removing verbs, or changing a set's voice wholesale, is better done as a new set with its own `id`; people may have that set applied and would rather not have it change character underneath them.

---

## Working on the CLI

```console
$ npm install
$ npm test          # vitest
$ npm run lint      # tsc --noEmit
$ npm run build     # tsup -> dist/cli.js
$ node dist/cli.js list
```

The codebase splits into a pure-function core and two thin shells over it:

| Path | Responsibility |
| --- | --- |
| `src/registry/` | Verb set schema, HTTP fetch, on-disk cache, lenient loader |
| `src/settings/` | Path resolution, atomic read/write with backup, `spinnerVerbs` merge, diff rendering |
| `src/selection.ts` | Search and random pick (the RNG is injectable, so tests are deterministic) |
| `src/args.ts` | Hand-rolled argument parser and the help text |
| `src/commands/` | One-shot subcommands; all output goes through an injected `Io` |
| `src/ui/` | Ink TUI |

New behaviour comes with a test. Anything touching `~/.claude/settings.json` gets a test that proves unrelated keys survive — that file belongs to the user, and a tool that eats someone's hooks config to change a spinner has done real damage for no reason.

Testing against your own settings? Point `HOME` somewhere disposable:

```console
$ TESTHOME=$(mktemp -d)
$ mkdir -p "$TESTHOME/.cache/ccverbs" && cp sets/index.json "$TESTHOME/.cache/ccverbs/"
$ HOME=$TESTHOME node dist/cli.js set sisyphus --yes
```

---

## Code of conduct

Be decent. Sets that exist to demean people won't be merged.
