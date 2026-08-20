# ccverbs

Swap Claude Code's spinner verbs for something you'd rather look at — or something you'd rather learn.

Claude Code shows a random verb while it works: `Cogitating…`, `Percolating…`, `Flibbertigibbeting…`. There are 186 of them. `ccverbs` replaces that list with a **verb set** — a themed, community-maintained list of your own.

```console
$ npx ccverbs
```

That opens a searchable picker. Choose a set, see the diff, apply it — two questions, then done. Nothing else in your `settings.json` is touched. The picker also includes **Create a new set**; select it to open the contribution web app.

> 日本語版: **[README.ja.md](README.ja.md)**

---

---

## What it looks like


Pick `sisyphus` and Claude Code starts pushing a boulder:

```
✻ 岩を押し上げています… (4s · ↑ 1.2k tokens)
✻ また麓から登っています… (11s · ↑ 3.4k tokens)
```

Pick `kubectl-commands` and the spinner becomes a flashcard you read for free, dozens of times a day:

```
✻ kubectl drain — Nodeから退避させる… (3s)
✻ kubectl rollout undo — 直前版に戻す… (8s)
```

That second idea is why the **study** sets exist. You are already staring at that line. It may as well teach you something.

---

## Install


There is nothing to install. `npx` fetches the latest CLI every time:

```console
$ npx ccverbs            # interactive picker
$ npx ccverbs list       # or go straight to a one-shot command
```

If you'd rather have it on your PATH:

```console
$ npm install -g ccverbs
```

Requires Node.js 18 or newer.

---

## Add a verb set

**The easy way — no clone, no JSON.** Open the builder, type your words, watch them
animate the way Claude Code will actually show them, and press the button. It hands
you a pull request with the file already filled in.

You can reach the same builder from `npx ccverbs`: choose **Create a new set** in
the first picker. If your terminal cannot open a browser, the CLI prints the URL
so you can open it manually.

> **[Open the verb set builder](https://ccverbs.lolipop-now.app)**

**By hand:** add one JSON file. That's the whole process.

```jsonc
// sets/my-set.json
{
  "$schema": "../schema/verb-set.schema.json",
  "id": "my-set",
  "name": "My Set",
  "emoji": "✨",
  "description": "One line about it",
  "language": "en",
  "category": "meme",
  "tags": ["fun"],
  "verbs": ["Doing the thing", "Doing the other thing"]
}
```

```console
$ npm run sets:index && npm run sets:validate && npm test
```

Open a pull request. Once it's merged, every `ccverbs` user has it — no release required.

**For an LLM or coding agent:** pass the same JSON through the validation-first
CLI. `--input -` reads stdin and `--pr` is an explicit opt-in for the external
GitHub operation:

```console
$ cat set.json | ccverbs new --input - --json
$ cat set.json | ccverbs new --input - --pr --json
```

The first command is local-only and returns canonical JSON plus structured
issues. The second uses a temporary clone and reports the PR URL; it never
modifies the caller's working tree. See the full [AI agent contribution
contract](docs/ai-agents.md).

Full rules, formatting conventions, and the "don't end with `…`" gotcha are in **[CONTRIBUTING.md](CONTRIBUTING.md)**.

---

## Usage


```
ccverbs                        Launch the interactive picker (default)

Commands:
  list                List all verb sets
  show <id>           Print every verb in a set
  search <query>      Search sets by id, name, description, tags
  set <id>            Apply a set to Claude Code settings
  random              Pick one random set and apply it
  current             Show the currently applied configuration
  reset               Remove spinnerVerbs (restore the 186 defaults)
  config <key value>  Show or change settings (language, mode, scope)
  new                 Validate an agent-created set and optionally open a PR

Options:
  -m, --mode <replace|append>       Override the configured mode for this run
  -S, --scope <user|project|local>  Override the configured scope for this run
      --lang <code>                 Override the UI language for this run
      --json                        Machine-readable output
  -y, --yes                         Skip the confirmation prompt
  -n, --dry-run                     Print the diff, write nothing
      --no-backup                   Do not create a .ccverbs.bak file
      --refresh                     No effect — fetching fresh is the default
      --offline                     Use the last fetched copy, never hit the network
      --no-group                    Do not group the list by language
      --input <path|->              Read a set JSON file, or stdin with - (new)
      --pr                          Open a pull request after validation (new)
      --branch <name>               Use this branch name for the PR (new)
  -h, --help                        Show this help
  -v, --version                     Show the version
```

`replace` uses only your verbs; `append` keeps Claude Code's 186 and adds yours on top. Both `mode` and `scope` are **settings, not questions** — the picker does not ask on every run. Change them once with `ccverbs config`, or override either for a single run with `--mode` / `--scope`.

### Where it writes

| `--scope` | File |
| --- | --- |
| `user` (default) | `~/.claude/settings.json` |
| `project` | `./.claude/settings.json` |
| `local` | `./.claude/settings.local.json` |

Before writing, `ccverbs` copies the file to `<file>.ccverbs.bak`, then writes to a temp file and renames it into place, then re-parses the result — restoring the backup if anything went wrong. Only the `spinnerVerbs` key is ever added, replaced, or removed; every other key keeps its value, its position, and the file's indentation.

### Examples

```console
$ npx ccverbs search kubectl        # find it
$ npx ccverbs show git-commands     # read the whole set first
$ npx ccverbs set en-toeic --yes    # apply without the prompt
$ npx ccverbs set ja-cat --mode append   # override the configured mode once
$ npx ccverbs random --yes          # surprise me
$ npx ccverbs current               # what's applied right now
$ npx ccverbs reset --yes           # back to Claude Code's own verbs
```

Restart Claude Code, or start a new session, to see the change.

### Agent help for `new`

`ccverbs new --help` is a command-specific guide for agents. It includes the
input contract, a minimal JSON example, the validation/repair loop, structured
`error.issues` output, and the explicit authorization boundary before `--pr`:

```console
$ npx ccverbs new --help
```

---

## Configuration


Everything `ccverbs` remembers lives in one directory:

```
~/.ccverbs/
  config.json          language, mode, scope
  cache/index.json     the verb sets, refetched hourly
```

Run `ccverbs config` for a settings screen — one question per screen, arrow keys and Enter:

```
  ccverbs settings

  ❯ Language   English      default
    Mode       Replace      default
    Saves to   Everywhere   default
    ─────────────────────────────────
    Restore defaults
```

Or set any of it in one shot:

```console
$ ccverbs config                          # the settings screen (or a table with no TTY)
$ ccverbs config language ja
$ ccverbs config mode append
$ ccverbs config scope project
$ ccverbs config reset
$ ccverbs config --json
```

Defaults are `mode: replace` and `scope: user`. Upgrading from 0.1.0 moves your cache from `~/.cache/ccverbs/` automatically.

A corrupt `config.json` is never fatal: bad values fall back per key, a warning goes to stderr, and the command still runs.

---

## Languages


The UI ships in **English, 日本語, 简体中文, 繁體中文 and 한국어**. It picks one for you; `ccverbs config language` overrides it, and `--lang <code>` overrides it for a single run.

Detection tries these in order, first hit wins:

| # | Source |
| --- | --- |
| 1 | `--lang <code>` |
| 2 | `CCVERBS_LANG` |
| 3 | `language` in `~/.ccverbs/config.json` (skipped when `auto`) |
| 4 | `LC_ALL`, `LC_MESSAGES`, `LANG`, `LANGUAGE` |
| 5 | The OS — `AppleLanguages` on macOS, `Get-UICulture` on Windows |
| 6 | The runtime's `Intl` locale |
| 7 | English |

**Why rung 5 exists.** On a Japanese Mac, `Intl` reports `en-US` and `LANG` is often `C.UTF-8` — both point at English while the machine's actual UI language is Japanese. So `C`, `POSIX` and empty are treated as *no preference* rather than as English, and the OS gets asked. `ccverbs config` always shows which rung decided, so "why is this in English?" answers itself. Set `CCVERBS_NO_OS_LOCALE=1` to skip the OS query.

`en` and `ja` are reviewed by native speakers. **`zh-Hans`, `zh-Hant` and `ko` are not yet** — they are marked as such in `ccverbs config`, and corrections are very welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).

Verb *content* is never translated — a Japanese set is Japanese. Sets in your own language sort to the top of the list; `--no-group` turns that off, and `--json` is always ordered by id so agent output never shifts with your locale.

---

## Verb sets


23 sets, 502 verbs.

### Just for fun

| Set | Verbs | What it is |
| --- | --- | --- |
| 🪨 `sisyphus` | 10 | The myth of Sisyphus, in Japanese. The set that started this project |
| 🗾 `ja-general` | 40 | A general-purpose Japanese stand-in for all 186 defaults |
| 🐈 `ja-cat` | 25 | What the cat is doing while Claude works |
| 🍜 `ja-ramen` | 25 | A bowl of ramen coming together, one step at a time |
| 🐙 `ja-kansai` | 20 | Claude, but in Kansai dialect |
| 🦜 `en-pirate` | 24 | Arrr |
| 🌃 `en-cyberpunk` | 22 | Neon, rain, and ICE |
| 🌸 `tougekou` | 2 | Going to and from school |

### Study sets — the spinner as a flashcard

| Set | Verbs | What it teaches |
| --- | --- | --- |
| 🌿 `git-commands` | 24 | `git bisect`, `git reflog`, `git rebase --onto` |
| 🎡 `kubectl-commands` | 24 | `kubectl drain`, `kubectl debug`, `kubectl auth can-i` |
| 🐳 `docker-commands` | 22 | `docker buildx`, `docker history`, `docker system prune` |
| 🐧 `linux-commands` | 24 | `strace`, `lsof -i`, `flock`, `ncdu` |
| 📝 `vim-keys` | 24 | `ciw`, `:g/pat/d`, `:norm`, `C-v I` |
| 📘 `en-toeic` | 24 | Business English: `reimburse`, `in lieu of`, `contingent on` |
| 🎓 `en-gre` | 24 | The hard words: `ephemeral`, `recalcitrant`, `perfunctory` |
| 💬 `en-tech-phrases` | 22 | `yak shaving`, `load-bearing`, `bus factor` |
| 🔷 `ts-types` | 24 | `Awaited<T>`, `satisfies`, `infer`, variance |
| 🦀 `rust-ownership` | 22 | Borrows, lifetimes, `Cow<T>`, `Pin`, NLL |
| 🧮 `sql` | 24 | Window functions, `DISTINCT ON`, join strategies |
| 🔍 `regex` | 24 | Lookaround, atomic groups, catastrophic backtracking |
| 🌐 `http-status` | 24 | `303` vs `307`, `409`, `422`, `502` vs `504` |
| 📈 `bigo` | 24 | Complexity classes and the algorithms that hit them |

Run `ccverbs list` for the live list — it's always ahead of this README.

---

## For AI agents


Every command takes `--json` and prints a **single-line JSON object** whose first key is `ok`. Pair it with `--yes` to skip the prompt. No TUI is ever launched by a subcommand, and running bare `ccverbs` without a TTY exits `2` with the help text rather than hanging.

To create a set, read existing sets first, prepare one JSON object, and run:

```console
$ cat set.json | ccverbs new --input - --json
{"ok":true,"validated":true,"set":{"id":"my-set",…,"verbCount":24},"json":"{\n  …\n}\n"}

# Only after the user authorizes the external GitHub action:
$ cat set.json | ccverbs new --input - --pr --json
{"ok":true,"validated":true,"set":{"id":"my-set",…,"verbCount":24},"pr":{"url":"https://github.com/ryoshin0830/ccverbs/pull/123","branch":"add-my-set","forked":false}}
```

Validation failures return `error.issues` with paths and stable codes. PR
failures return `error.code: "pr-failed"` and a `manual` recovery path. The
command operates in a temporary clone, does not rebuild `sets/index.json`, and
does not touch the agent's current worktree. Follow the detailed [AI agent
guide](docs/ai-agents.md) and the [contribution skill](.claude/skills/ccverbs-contribute/SKILL.md).

```console
$ ccverbs list --json
{"ok":true,"totalSets":23,"totalVerbs":502,"registryTotalSets":23,"sets":[{"id":"bigo","name":"Big-O and Algorithms","emoji":"📈","description":"…","language":"mixed","category":"study","tags":["algorithm","complexity","study"],"count":24}, …]}

$ ccverbs show sisyphus --json
{"ok":true,"set":{"id":"sisyphus","name":"Sisyphus", …,"verbs":["岩を押し上げています", …]}}

$ ccverbs set git-commands --yes --json
{"ok":true,"applied":{"id":"git-commands","mode":"replace","count":24},"removed":false,"settingsPath":"/Users/you/.claude/settings.json","backupPath":"/Users/you/.claude/settings.json.ccverbs.bak","previous":null,"effectiveVerbCount":24}

$ ccverbs current --json
{"ok":true,"settingsPath":"…","settingsExists":true,"configured":true,"spinnerVerbs":{"mode":"replace","verbs":[…]},"matchedSet":{"id":"git-commands", …},"effectiveVerbCount":24,"defaultVerbCount":186}

$ ccverbs config --json
{"ok":true,"language":{"value":"ja","source":"os","explicit":false},"mode":{"value":"replace","source":"default"},"scope":{"value":"user","source":"default"},"supportedLocales":["en","ja","zh-Hans","zh-Hant","ko"],"unreviewedLocales":["zh-Hans","zh-Hant","ko"],"configPath":"…","cachePath":"…","cacheAgeMs":240000,"warnings":[]}
```

`ccverbs config` never opens a screen when `--json` is passed, when a key is given, or when there is no TTY — it prints and exits.

Failures use the same envelope, so you never have to parse prose:

```console
$ ccverbs show nope --json
{"ok":false,"error":{"code":"set-not-found","message":"no verb set \"nope\""}}
```

Use `--dry-run --json` to get the `diff` string and the `pending` change without writing anything.

### Exit codes

| Code | Meaning |
| --- | --- |
| 0 | Success |
| 1 | Runtime error (could not write the settings file) |
| 2 | Usage error (unknown command or flag, no TTY for the TUI) |
| 3 | Set not found |
| 4 | Registry unavailable and nothing cached |

---

<details>
<summary><strong>How it works — the reverse-engineered spinnerVerbs contract</strong></summary>


`spinnerVerbs` is an **undocumented** Claude Code setting — it does not appear in the official docs or in the [schemastore](https://www.schemastore.org/claude-code-settings.json) schema. The contract below was recovered from the Claude Code **2.1.235** binary, and is what `ccverbs` writes:

```json
{
  "spinnerVerbs": {
    "mode": "replace",
    "verbs": ["岩を押し上げています", "山頂を目指しています"]
  }
}
```

The validator behind it:

```js
spinnerVerbs: z.object({
  mode:  z.enum(["append", "replace"]),   // required
  verbs: z.array(z.string())              // required
}).optional()
```

and the resolution at runtime:

```js
function resolveVerbs() {
  const t = settings.spinnerVerbs;
  if (!t) return DEFAULT_VERBS;                                  // 186 verbs
  if (t.mode === "replace") return t.verbs.length > 0 ? t.verbs : DEFAULT_VERBS;
  return [...DEFAULT_VERBS, ...t.verbs];                         // append
}
```

### What that means in practice

| Question | Answer |
| --- | --- |
| How many verbs does Claude Code ship? | **186** (`Accomplishing` … `Zigzagging`, no duplicates) |
| How long are they? | 5–18 characters, 10.0 average. Longest: `Flibbertigibbeting`, `Whatchamacalliting` |
| Is there a **limit on how many verbs** you can set? | **No limit.** The array has no `.min()` or `.max()` — 1 verb or 10,000 both validate |
| Is there a limit on a single verb's length? | **No limit** in the schema. But the spinner is given the terminal width and truncates, so keep verbs short |
| Are `mode` and `verbs` optional? | **No — both are required.** Omitting `mode` fails validation |
| What if I pass an array instead of an object? | Fails with `Expected object, but received array` |
| What does `replace` with an empty array do? | Falls back to the 186 defaults |
| Where does `append` insert my verbs? | After the defaults |
| Do I add the `…` myself? | **No.** Claude Code appends it: `verb + "…"`. A verb ending in `…` would render as `……`, so `ccverbs` rejects those |
| How often does the verb change? | Once per turn, chosen uniformly at random |

Because there's no count limit, `ccverbs` imposes only editorial ones: sets carry 10–40 verbs so your `settings.json` stays readable, and each verb stays within 40 terminal columns so the elapsed-time and token counters remain visible beside it.

### Where the sets come from

Verb sets are **not** bundled into the npm package. `ccverbs` fetches
[`sets/index.json`](sets/index.json) from `main` **every time it runs**.

```
npx ccverbs
  └─ GET raw.githubusercontent.com/ryoshin0830/ccverbs/main/sets/index.json
       ├─ ok      → use it, and keep a copy
       └─ failed  → fall back to that copy
```

So a merged pull request reaches every user on their next run — no npm release, no waiting. The fetch is 34 KB and costs about 80 ms, which is nothing next to what `npx` already spends downloading the CLI, so there is no cache-first mode to opt into: the copy in `~/.ccverbs/cache/` exists only to keep the tool working when GitHub does not. `--offline` uses that copy deliberately and never touches the network.

</details>

---

## License


MIT. The `sisyphus` set comes from [this article](https://zenn.dev/kok1eeeee/articles/claude-code-spinner-verbs-sisyphus) by kok1eeeee, which is where the whole idea came from.
