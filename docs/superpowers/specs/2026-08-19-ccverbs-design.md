# ccverbs 設計書

- 日付: 2026-08-19
- リポジトリ: https://github.com/ryoshin0830/ccverbs
- npm パッケージ名: `ccverbs`（未使用を確認済み）

## 1. 目的

Claude Code の「スピナー動詞」（処理中に表示される `Thinking…` などの語）を、
コミュニティ管理の単語セットから選んで `~/.claude/settings.json` に適用する CLI。

- 人間は `npx ccverbs` で対話 TUI から検索・選択する。
- AI／スクリプトはサブコマンド一発（`--json` 付き）で確認・適用する。
- 単語セットは OSS として PR で追加・編集できる。

## 2. 事前調査：Claude Code の `spinnerVerbs` 仕様

Claude Code v2.1.235（Mach-O バイナリ）から抽出した実装が根拠。公式ドキュメント・
schemastore の `claude-code-settings.json` には未掲載（undocumented）。

### 2.1 スキーマ（zod、バイナリから復元）

```js
spinnerVerbs: z.object({
  mode:  z.enum(["append", "replace"]),   // 必須
  verbs: z.array(z.string())              // 必須
}).optional()
```

- `mode` と `verbs` は**どちらも必須**。片方だけの指定は検証エラー。
- **`verbs` の要素数に上限はない**（`.min()` / `.max()` が付いていない）。
- **1 語の文字数にも上限はない**（`z.string()` に `.max()` が付いていない）。
- トップレベルに配列を書くと `Expected object, but received array` で失敗する。

### 2.2 実行時の解決ロジック

```js
function resolveVerbs() {
  const t = settings.spinnerVerbs;
  if (!t) return DEFAULT_VERBS;
  if (t.mode === "replace") return t.verbs.length > 0 ? t.verbs : DEFAULT_VERBS;
  return [...DEFAULT_VERBS, ...t.verbs];   // append
}
```

- `replace` かつ `verbs` が空配列のときはデフォルトへフォールバックする。
- `append` はデフォルト 186 語の**後ろに**連結する。

### 2.3 描画

```js
message = (overrideMessage ?? task.activeForm ?? task.subject ?? verb) + "…";
```

- 末尾の `…` は Claude Code が**自動付与**する。単語セット側に書くと `……` になる。
- 動詞はターン開始ごとに `sample()`（lodash 相当）で 1 個ランダムに選ばれる。
- 描画コンポーネントに端末幅 `columns` が渡され、幅を超えた分は切り詰められる。

### 2.4 デフォルト動詞の実測値（v2.1.235）

| 項目 | 値 |
| --- | --- |
| 語数 | 186（重複 0） |
| 最短 / 最長 | 5 文字（`Doing`）／ 18 文字（`Flibbertigibbeting`, `Whatchamacalliting`） |
| 平均長 | 10.0 文字 |
| 先頭 / 末尾 | `Accomplishing` … `Zigzagging` |

### 2.5 本ツールが導く運用上の指針

- 個数に技術的上限はないが、`settings.json` の可読性のため 1 セット 10〜50 語を推奨。
- 表示幅は 40 列以内を推奨（CI では warning 止まりでエラーにしない）。
- セット側の語に `…` を含めることは禁止（CI エラー）。

## 3. 全体アーキテクチャ

単語セットは npm パッケージに同梱せず、**実行時に GitHub `main` から取得**する。
PR がマージされた時点で全ユーザーに反映され、npm publish は不要。

```
npx ccverbs
  │
  ├─ registry: GET https://raw.githubusercontent.com/ryoshin0830/ccverbs/main/sets/index.json
  │      ├─ 成功 → ~/.cache/ccverbs/index.json に保存（TTL 3600 秒）
  │      └─ 失敗 → キャッシュへフォールバック（TTL 切れでも使用）→ 無ければ exit 4
  │
  ├─ validate: zod で検証。不正なセットは 1 件単位で除外して続行。全滅時のみエラー。
  │
  ├─ TUI (Ink)      … 検索 → 選択 → mode/scope → 差分プレビュー → 適用
  └─ one-shot CLI   … ccverbs set <id> --yes --json
          │
          └─ settings: バックアップ → spinnerVerbs のみ差し替え → アトミック書き込み → 検証
```

`index.json` は**全セットの全単語を含む単一ファイル**とする。20 セット × 30 語で約 25KB。
1 リクエストで一覧・検索・プレビュー・適用のすべてが完結し、キャッシュ後は完全にオフラインで動く。
CI で 500KB を超えたら warning を出し、その時点で分割方式を再検討する。

## 4. ディレクトリ構成

```
ccverbs/
├─ package.json               bin: { ccverbs: dist/cli.js }, files: ["dist"]
├─ tsup.config.ts
├─ vitest.config.ts
├─ src/
│  ├─ cli.ts                  エントリ。引数解析 → コマンド or TUI へ委譲
│  ├─ args.ts                 引数パーサ + ヘルプ本文（依存ライブラリなし）
│  ├─ constants.ts            REGISTRY_URL, CACHE_TTL_MS, EXIT_CODES など
│  ├─ registry/
│  │  ├─ schema.ts            zod: VerbSet / RegistryIndex
│  │  ├─ fetch.ts             HTTP 取得（タイムアウト付き）
│  │  ├─ cache.ts             ~/.cache/ccverbs の読み書き・TTL 判定
│  │  └─ index.ts             load(): fetch → cache フォールバック → 検証
│  ├─ settings/
│  │  ├─ paths.ts             scope → 設定ファイルパス解決
│  │  ├─ io.ts                読み込み・インデント検出・アトミック書き込み・バックアップ
│  │  ├─ apply.ts             spinnerVerbs のみ差し替えた新オブジェクトを返す純関数
│  │  └─ diff.ts              適用前後の差分文字列を生成する純関数
│  ├─ selection.ts            検索・絞り込み・ランダム抽選（乱数は注入可能）
│  ├─ commands/
│  │  ├─ list.ts  show.ts  search.ts  set.ts  random.ts  current.ts  reset.ts
│  └─ ui/
│     ├─ App.tsx              Ink ルート。状態機械（browse → configure → confirm → done）
│     ├─ SetList.tsx          左ペイン。検索入力 + 一覧
│     ├─ PreviewPane.tsx      右ペイン。メタ情報 + 語のサンプル
│     └─ ConfirmDiff.tsx      差分表示 + Y/n
├─ sets/
│  ├─ index.json              自動生成。手で編集しない
│  └─ <id>.json               1 セット 1 ファイル。コントリビュータはここだけ触る
├─ schema/verb-set.schema.json   エディタ補完用 JSON Schema
├─ scripts/
│  ├─ build-index.mjs         sets/*.json → sets/index.json
│  └─ validate-sets.mjs       検証（CI と pre-commit で実行）
├─ tests/
├─ .github/workflows/ci.yml
├─ README.md                  英語（primary）
├─ README.ja.md               日本語
├─ CONTRIBUTING.md            英語。セット追加の手順
└─ LICENSE                    MIT
```

## 5. データ形式

### 5.1 単語セット `sets/<id>.json`

```json
{
  "$schema": "../schema/verb-set.schema.json",
  "id": "git-commands",
  "name": "Git Commands",
  "emoji": "🌿",
  "description": "Learn git subcommands while Claude works",
  "language": "ja",
  "category": "study",
  "tags": ["git", "cli"],
  "author": { "name": "shin", "github": "ryoshin0830" },
  "source": "https://git-scm.com/docs",
  "verbs": [
    "git rebase -i — 対話的リベース",
    "git bisect — 二分探索でバグ混入を特定"
  ]
}
```

| フィールド | 必須 | 型 / 制約 |
| --- | --- | --- |
| `id` | ✓ | kebab-case（`^[a-z0-9]+(-[a-z0-9]+)*$`）。ファイル名と一致。全体で一意 |
| `name` | ✓ | 1–40 文字 |
| `emoji` | ✓ | 表示用。1–4 コードポイント |
| `description` | ✓ | 1–120 文字 |
| `language` | ✓ | `ja` \| `en` \| `mixed` |
| `category` | ✓ | `meme` \| `study` \| `classic` |
| `tags` | ✓ | 0–8 個の kebab-case 文字列 |
| `author` | – | `{ name: string, github?: string }` |
| `source` | – | URL |
| `verbs` | ✓ | 1–500 要素。各要素 1–120 文字 |

`verbs` の各要素に対する検証:

- 重複禁止（セット内）
- 改行・タブ・制御文字を含まない
- 前後の空白なし
- `…` / `...` / `。` で終わらない（Claude Code が `…` を付与するため）
- 表示幅 40 列超は warning（エラーにしない）

語のフォーマット（`—` 区切り、`:` 区切り、`【】` など）はセットごとに自由。
CONTRIBUTING.md で推奨パターンを例示するに留める。

### 5.2 レジストリ索引 `sets/index.json`（自動生成）

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-08-19T00:00:00.000Z",
  "totalSets": 21,
  "totalVerbs": 612,
  "sets": [ /* VerbSet をそのまま並べたもの（verbs 含む） */ ]
}
```

`scripts/build-index.mjs` が `sets/*.json` を `id` 昇順で読み、検証して生成する。
CI は再生成して差分がないことを確認する（差分があれば fail）。

## 6. CLI 仕様

```
Usage: ccverbs [command] [options]

  ccverbs                        Launch the interactive TUI (default)

Commands:
  list                           List all verb sets
  show <id>                      Print every verb in a set
  search <query>                 Search sets by id, name, description, tags
  set <id>                       Apply a set to Claude Code settings
  random                         Pick one random set and apply it
  current                        Show the currently applied configuration
  reset                          Remove spinnerVerbs (restore the 186 defaults)

Options:
  -m, --mode <replace|append>       Default: replace
  -S, --scope <user|project|local>  Default: user
      --json                        Machine-readable output
  -y, --yes                         Skip the confirmation prompt
  -n, --dry-run                     Print the diff, write nothing
      --no-backup                   Do not create a .bak file
      --refresh                     Ignore the cache and refetch
      --offline                     Use the cache only, never hit the network
```

`--offline` と `--refresh` は排他。同時指定は exit 2。
`--yes` / `--dry-run` / `--no-backup` は書き込みを伴うコマンド（`set` / `random` / `reset`）
でのみ意味を持ち、`list` / `show` / `search` / `current` に付けても無視する（エラーにしない）。

```text
  -h, --help                        Show this help
  -v, --version                     Show the version
```

### 6.1 scope → パス

| scope | パス |
| --- | --- |
| `user`（既定） | `~/.claude/settings.json` |
| `project` | `<cwd>/.claude/settings.json` |
| `local` | `<cwd>/.claude/settings.local.json` |

### 6.2 終了コード

| コード | 意味 |
| --- | --- |
| 0 | 成功 |
| 1 | 実行時エラー（書き込み失敗など） |
| 2 | 引数エラー |
| 3 | 指定 id のセットが存在しない |
| 4 | レジストリ取得失敗かつキャッシュなし |

### 6.3 `--json` 出力（AI 向け）

すべて `{ "ok": boolean, ... }` を持つ単一 JSON オブジェクトを stdout に 1 行で出す。
エラー時は `{ "ok": false, "error": { "code": "...", "message": "..." } }`。

```jsonc
// ccverbs list --json
{ "ok": true, "totalSets": 21, "totalVerbs": 612,
  "sets": [ { "id": "git-commands", "name": "Git Commands", "emoji": "🌿",
              "description": "...", "language": "ja", "category": "study",
              "tags": ["git","cli"], "count": 24 } ] }

// ccverbs show git-commands --json
{ "ok": true, "set": { /* VerbSet 全体 */ } }

// ccverbs set git-commands --yes --json
{ "ok": true, "applied": { "id": "git-commands", "mode": "replace", "count": 24 },
  "settingsPath": "/Users/x/.claude/settings.json",
  "backupPath": "/Users/x/.claude/settings.json.ccverbs.bak",
  "previous": { "mode": "replace", "count": 10 } }

// ccverbs search git --json  → list と同じ形（絞り込み後）
// ccverbs current --json
{ "ok": true, "settingsPath": "...", "configured": true,
  "spinnerVerbs": { "mode": "replace", "verbs": ["..."] },
  "matchedSet": { "id": "sisyphus", "name": "Sisyphus" },
  "effectiveVerbCount": 10, "defaultVerbCount": 186 }
```

`current` の `matchedSet` は、適用済み `verbs` 配列がどのセットと完全一致するかを
照合して返す（一致しなければ `null`）。

## 7. TUI（Ink）

状態機械: `loading → browse → configure → confirm → done`（`error` はどこからでも遷移）。

```
  ccverbs — Claude Code spinner verbs                    21 sets · 612 verbs

  Search: git▮                                          ↑↓ move  ⏎ select  esc quit

  ┌ Sets ───────────────────────────┬─ Preview: Git Commands ──────────────┐
  │❯ 🌿 Git Commands       24  study│ 🌿 Git Commands            24 verbs  │
  │  🐳 Docker Commands    28  study│ Learn git subcommands while Claude   │
  │  ☸️  kubectl Commands  30  study│ works.  ja · study · git, cli        │
  │  🪨 Sisyphus           10  meme │                                      │
  │  🍜 Ramen (ja)         32  meme │  ✦ git rebase -i — 対話的リベース…    │
  │  🎲 Random set                  │  ✦ git bisect — 二分探索で特定…      │
  └─────────────────────────────────┴──────────────────────────────────────┘
```

- `browse`: インクリメンタル検索（id / name / description / tags を部分一致）。
  一覧の先頭に `🎲 Random set` を常設し、選ぶと抽選結果を `configure` へ渡す。
- `configure`: mode（replace / append）と scope（user / project / local）を選択。
- `confirm`: 差分を表示して `Apply? (Y/n)`。
- `done`: 適用結果とバックアップパスを表示して終了。
- 非 TTY 環境（パイプ・CI）で引数なし起動した場合は TUI を出さず、
  ヘルプを表示して exit 2 とする。

## 8. settings.json への書き込み

1. 既存ファイルを読む。無ければ `{}` として扱い、親ディレクトリを作成する。
2. インデント幅を検出して踏襲する（検出できなければ 2 スペース）。末尾改行も踏襲。
3. `--no-backup` でなければ `<path>.ccverbs.bak` にコピーする。
4. `spinnerVerbs` キー**のみ**を差し替える。他のキーは値も順序も変更しない。
   既存に `spinnerVerbs` がある場合は同じ位置に置き換え、無い場合は末尾に追加する。
5. 同一ディレクトリの一時ファイルに書いてから `rename()` でアトミックに置換する。
6. 書き戻したファイルを読み直して JSON パースと zod 検証を行う。
   失敗したらバックアップから復元し、exit 1 とする。

`reset` は `spinnerVerbs` キーを削除する（同じ手順を通る）。

## 9. 初期単語セット（21 本）

| カテゴリ | id |
| --- | --- |
| meme (ja) | `sisyphus`, `ja-general`, `ja-cat`, `ja-ramen`, `ja-kansai` |
| meme (en) | `en-pirate`, `en-cyberpunk` |
| study: CLI / インフラ | `git-commands`, `kubectl-commands`, `docker-commands`, `linux-commands`, `vim-keys` |
| study: 英単語 | `en-toeic`, `en-gre`, `en-tech-phrases` |
| study: 言語 / FW | `ts-types`, `rust-ownership`, `sql`, `regex`, `http-status`, `bigo` |

`sisyphus` は元記事（https://zenn.dev/kok1eeeee/articles/claude-code-spinner-verbs-sisyphus）
の 10 語をそのまま収録し、`source` と `author` に出典を明記する。

## 10. 技術スタックとテスト

- TypeScript、Node.js ≥ 18（組み込み `fetch` を使用）、ESM
- ビルド: tsup（`dist/cli.js` 単一ファイル、shebang 付き）
- TUI: Ink 6 + React 19
- 検証: zod
- テスト: vitest（+ `ink-testing-library`）
- Lint/Format: ESLint + Prettier

TDD で進める。副作用のない純関数を先に固める。

| テスト対象 | 内容 |
| --- | --- |
| `registry/schema` | 正常系・各制約違反・`…` 終端の拒否 |
| `registry/cache` | TTL 内はキャッシュ使用 / TTL 切れは再取得 / 取得失敗時は期限切れでも使用 |
| `registry/index` | 不正セット 1 件を除外して続行 / 全滅時エラー |
| `settings/apply` | 他キー・キー順の保持 / 既存 `spinnerVerbs` の置換 / 新規追加 |
| `settings/io` | インデント検出 / アトミック書き込み / バックアップ / 破損時ロールバック |
| `settings/diff` | 差分文字列の内容 |
| `selection` | 検索の一致条件 / 乱数注入によるランダム抽選の決定的テスト |
| `args` | 全フラグ / 不正値 / ヘルプ / 排他（`--offline` + `--refresh`） |
| `commands/*` | 各 `--json` 出力の形・終了コード |
| `ui/App` | 状態遷移（`ink-testing-library`） |
| `scripts/validate-sets` | 同梱 21 セットが全件検証を通ること |

## 11. CI（GitHub Actions）

`push` / `pull_request` で実行:

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `node scripts/validate-sets.mjs` — 全セットの検証
5. `node scripts/build-index.mjs && git diff --exit-code sets/index.json` — 索引の再生成差分チェック
6. `index.json` が 500KB を超えたら warning

## 12. ドキュメント

- `README.md`（英語 / primary）: インストール、TUI・ワンショットの使い方、
  **第 2 章の調査結果テーブル**（186 語・上限なし・`mode` 必須・`…` 自動付与・undocumented）、
  セット一覧、セット追加の呼びかけ。
- `README.ja.md`: 同内容の日本語版。
- `CONTRIBUTING.md`（英語）: `sets/<id>.json` を 1 ファイル追加して PR、
  `index.json` は触らない、語のフォーマット推奨例、ローカル検証コマンド。

## 13. 公開

- ライセンス: MIT
- `~/.npmrc` の既定 registry が `npm.flatt.tech` のため、公開時は明示的に上書きする:
  `npm publish --registry https://registry.npmjs.org --access public`
- publish 前に `npm pack --dry-run` で同梱物を確認し、ユーザーの最終確認を得てから実行する。

## 14. 非目標（YAGNI）

- 複数セットの合成適用（`--all` / mix）は初版に含めない。
- `spinnerTipsOverride`（tips 機能）は扱わない。`spinnerVerbs` のみ。
- セットのローカル自作・登録機能は初版に含めない。
- 単語セットの多言語 i18n（同一セットの ja/en 併記）は行わない。言語はセット単位。
