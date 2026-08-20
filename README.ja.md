# ccverbs

Claude Code の「スピナー動詞」を、眺めていて楽しいもの——あるいは覚えたいもの——に差し替える CLI。

Claude Code は作業中にランダムな動詞を表示します（`Cogitating…`、`Percolating…`、`Flibbertigibbeting…`）。全部で 186 個あります。`ccverbs` はそのリストを、コミュニティが育てている**単語セット**に置き換えます。

```console
$ npx ccverbs
```

検索できるピッカーが開きます。セットを選び、差分を確認して、適用 — 聞かれるのは2回だけです。`settings.json` の他のキーには一切触りません。

> English: **[README.md](README.md)**

---

---

## どう変わるか


`sisyphus` を選ぶと、Claude Code が岩を押し始めます。

```
✻ 岩を押し上げています… (4s · ↑ 1.2k tokens)
✻ また麓から登っています… (11s · ↑ 3.4k tokens)
```

`kubectl-commands` を選ぶと、スピナーが単語帳になります。1 日に何十回も、勝手に目に入ってきます。

```
✻ kubectl drain — Nodeから退避させる… (3s)
✻ kubectl rollout undo — 直前版に戻す… (8s)
```

**study** カテゴリのセットがあるのはこの発想からです。どうせその行を見つめているのだから、何か覚えてしまえばいい。

---

## インストール


不要です。`npx` が毎回最新の CLI を取ってきます。

```console
$ npx ccverbs            # 対話ピッカー
$ npx ccverbs list       # ワンショットコマンドに直行してもよい
```

PATH に置きたい場合:

```console
$ npm install -g ccverbs
```

Node.js 18 以降が必要です。

---

## 単語セットを追加する

**簡単な方法 — clone も JSON も不要。** ビルダーを開いて単語を入れると、Claude Code
で実際にどう見えるかがその場でアニメーションで確認できます。ボタンを押すと、ファイルが
入力済みの Pull Request まで連れて行ってくれます。

> **[単語セットビルダーを開く](https://github.com/ryoshin0830/ccverbs#add-a-verb-set)**

**手で書く場合:** JSON ファイルを 1 つ足すだけです。

```jsonc
// sets/my-set.json
{
  "$schema": "../schema/verb-set.schema.json",
  "id": "my-set",
  "name": "My Set",
  "emoji": "✨",
  "description": "一行の説明",
  "language": "ja",
  "category": "meme",
  "tags": ["fun"],
  "verbs": ["やっています", "まだやっています"]
}
```

```console
$ npm run sets:index && npm run sets:validate && npm test
```

あとは PR を出すだけ。マージされた時点で全ユーザーに届きます。リリース作業は不要です。

詳しいルール・書式の慣習・「`…` で終わらせない」という落とし穴は **[CONTRIBUTING.md](CONTRIBUTING.md)** にあります。

---

## 使い方


```
ccverbs                        対話画面を開く（既定）

コマンド:
  list                単語セットを一覧する
  show <id>           セットの全単語を表示する
  search <query>      id・名前・説明・タグで検索する
  set <id>            セットを Claude Code に適用する
  random              ランダムに1セット選んで適用する
  current             現在適用されている内容を表示する
  reset               spinnerVerbs を削除して標準186語に戻す
  config <key value>  設定（言語・適用方法・保存先）を表示・変更する

オプション:
  -m, --mode <replace|append>       この実行だけ適用方法を上書きする
  -S, --scope <user|project|local>  この実行だけ保存先を上書きする
      --lang <code>                 この実行だけ表示言語を上書きする
      --json                        機械可読な出力にする
  -y, --yes                         確認を省略する
  -n, --dry-run                     差分だけ出して書き込まない
      --no-backup                   .ccverbs.bak を作らない
      --refresh                     キャッシュを無視して取得し直す
      --offline                     キャッシュのみ使い、通信しない
      --no-group                    一覧を言語でまとめない
  -h, --help                        ヘルプ
  -v, --version                     バージョン
```

`replace` は自分の単語だけを使い、`append` は Claude Code の 186 語を残したうえで足します。適用方法と保存先は**毎回聞かれる質問ではなく設定**です。`ccverbs config` で一度決めれば以降は聞かれません。1回だけ変えたいときは `--mode` / `--scope` を付けます。

### 書き込み先

| `--scope` | ファイル |
| --- | --- |
| `user`（既定） | `~/.claude/settings.json` |
| `project` | `./.claude/settings.json` |
| `local` | `./.claude/settings.local.json` |

書き込み前に `<file>.ccverbs.bak` へコピーし、一時ファイルに書いてから `rename()` で置き換え、書き戻した結果を読み直して検証します。壊れていたらバックアップから復元します。触るのは `spinnerVerbs` キーだけで、他のキーは値・順序・インデントすべて保たれます。

### 例

```console
$ npx ccverbs search kubectl        # 探す
$ npx ccverbs show git-commands     # 中身を全部見てから決める
$ npx ccverbs set en-toeic --yes    # 確認なしで適用
$ npx ccverbs set ja-cat --mode append
$ npx ccverbs random --yes          # おまかせ
$ npx ccverbs current               # 今何が入っているか
$ npx ccverbs reset --yes           # Claude Code 標準に戻す
```

反映には Claude Code の再起動、または新しいセッションの開始が必要です。

---

## 設定


`ccverbs` が覚えているものは 1 箇所にまとまっています。

```
~/.ccverbs/
  config.json          言語・適用方法・保存先
  cache/index.json     単語セット（1時間で再取得）
```

`ccverbs config` で設定画面が開きます。1 画面 1 問、上下キーと Enter だけです。

```
  ccverbs 設定

  ❯ 言語        日本語      OSの言語設定から
    適用方法     置き換える   既定値
    保存先       全体        既定値
    ───────────────────────────────
    既定値に戻す
```

コマンド 1 発でも設定できます。

```console
$ ccverbs config                          # 設定画面（TTYがなければ表を出力）
$ ccverbs config language ja
$ ccverbs config mode append
$ ccverbs config scope project
$ ccverbs config reset
$ ccverbs config --json
```

既定値は `mode: replace` と `scope: user` です。0.1.0 から上げた場合、キャッシュは `~/.cache/ccverbs/` から自動で移動します。

`config.json` が壊れていても致命的にはなりません。不正な値はキー単位で既定値に戻し、警告を stderr に出したうえでコマンドは動きます。

---

## 言語


UI は **English・日本語・简体中文・繁體中文・한국어** の 5 言語です。自動で判別し、`ccverbs config language` で固定でき、`--lang <code>` で 1 回だけ上書きできます。

判別は上から順に、最初に当たったものを使います。

| 順 | 判別元 |
| --- | --- |
| 1 | `--lang <code>` |
| 2 | `CCVERBS_LANG` |
| 3 | `~/.ccverbs/config.json` の `language`（`auto` のときは飛ばす） |
| 4 | `LC_ALL`・`LC_MESSAGES`・`LANG`・`LANGUAGE` |
| 5 | OS — macOS は `AppleLanguages`、Windows は `Get-UICulture` |
| 6 | 実行環境の `Intl` ロケール |
| 7 | 英語 |

**5 段目がある理由。** システム言語が日本語の Mac でも、`Intl` は `en-US` を返し、`LANG` は `C.UTF-8` であることが多く、どちらも英語を指します。そこで `C`・`POSIX`・空文字は「英語」ではなく**「指定なし」**として扱い、OS に問い合わせます。`ccverbs config` はどの段で決まったかを常に表示するので、「なぜ英語で出るのか」は自分で分かります。OS への問い合わせを止めたいときは `CCVERBS_NO_OS_LOCALE=1` を設定してください。

`en` と `ja` は母語話者がレビューしています。**`zh-Hans`・`zh-Hant`・`ko` は未レビュー**です。`ccverbs config` にその旨を表示しており、修正の提案を歓迎します（[CONTRIBUTING.md](CONTRIBUTING.md)）。

単語そのものは翻訳しません（日本語のセットは日本語です）。一覧では自分の言語のセットが上に来ます。`--no-group` で無効化でき、`--json` は常に id 順なのでエージェントの出力が環境で変わることはありません。

---

## 単語セット一覧


21 セット、496 語。

### ネタ系

| セット | 語数 | 内容 |
| --- | --- | --- |
| 🪨 `sisyphus` | 10 | シーシュポスの神話。このプロジェクトの原点 |
| 🗾 `ja-general` | 40 | 標準 186 語の日本語版に相当する汎用セット |
| 🐈 `ja-cat` | 25 | Claude が働いている間、猫がしていること |
| 🍜 `ja-ramen` | 25 | 一杯のラーメンが組み上がっていく工程 |
| 🐙 `ja-kansai` | 20 | 関西弁の Claude |
| 🦜 `en-pirate` | 24 | 海賊 |
| 🌃 `en-cyberpunk` | 22 | ネオンと雨と ICE |

### 学習系 — スピナーを単語帳にする

| セット | 語数 | 覚えられるもの |
| --- | --- | --- |
| 🌿 `git-commands` | 24 | `git bisect`、`git reflog`、`git rebase --onto` |
| 🎡 `kubectl-commands` | 24 | `kubectl drain`、`kubectl debug`、`kubectl auth can-i` |
| 🐳 `docker-commands` | 22 | `docker buildx`、`docker history`、`docker system prune` |
| 🐧 `linux-commands` | 24 | `strace`、`lsof -i`、`flock`、`ncdu` |
| 📝 `vim-keys` | 24 | `ciw`、`:g/pat/d`、`:norm`、`C-v I` |
| 📘 `en-toeic` | 24 | ビジネス英語: `reimburse`、`in lieu of`、`contingent on` |
| 🎓 `en-gre` | 24 | 本気の難単語: `ephemeral`、`recalcitrant`、`perfunctory` |
| 💬 `en-tech-phrases` | 22 | `yak shaving`、`load-bearing`、`bus factor` |
| 🔷 `ts-types` | 24 | `Awaited<T>`、`satisfies`、`infer`、共変と反変 |
| 🦀 `rust-ownership` | 22 | 借用、ライフタイム、`Cow<T>`、`Pin`、NLL |
| 🧮 `sql` | 24 | ウィンドウ関数、`DISTINCT ON`、結合戦略 |
| 🔍 `regex` | 24 | 先読み後読み、atomic group、破滅的後戻り |
| 🌐 `http-status` | 24 | `303` と `307` の違い、`409`、`422`、`502` と `504` |
| 📈 `bigo` | 24 | 計算量のクラスと、それに当たるアルゴリズム |

最新の一覧は `ccverbs list` で見られます（この README より常に新しい）。

---

## AI エージェント向け


全コマンドが `--json` に対応し、`ok` を先頭キーに持つ**1 行の JSON オブジェクト**を出力します。`--yes` と組み合わせれば確認も出ません。サブコマンドが TUI を開くことはなく、TTY のない環境で引数なし起動した場合はハングせずヘルプを出して `2` で終了します。

```console
$ ccverbs list --json
{"ok":true,"totalSets":21,"totalVerbs":496,"registryTotalSets":21,"sets":[…]}

$ ccverbs set git-commands --yes --json
{"ok":true,"applied":{"id":"git-commands","mode":"replace","count":24},"settingsPath":"…","backupPath":"…","previous":null,"effectiveVerbCount":24}

$ ccverbs current --json
{"ok":true,"configured":true,"matchedSet":{"id":"git-commands",…},"effectiveVerbCount":24,"defaultVerbCount":186}

$ ccverbs config --json
{"ok":true,"language":{"value":"ja","source":"os","explicit":false},"mode":{"value":"replace","source":"default"},"scope":{"value":"user","source":"default"},"supportedLocales":["en","ja","zh-Hans","zh-Hant","ko"],"unreviewedLocales":["zh-Hans","zh-Hant","ko"],"configPath":"…","cachePath":"…","cacheAgeMs":240000,"warnings":[]}
```

`ccverbs config` は `--json` 指定時・鍵を渡したとき・TTY が無いときには画面を開かず、出力して終了します。

失敗時も同じ封筒に入るので、文章を解析する必要はありません。

```console
$ ccverbs show nope --json
{"ok":false,"error":{"code":"set-not-found","message":"no verb set \"nope\""}}
```

`--dry-run --json` なら、書き込まずに `diff` 文字列と `pending` な変更内容だけ取得できます。

### 終了コード

| コード | 意味 |
| --- | --- |
| 0 | 成功 |
| 1 | 実行時エラー（設定ファイルの書き込み失敗など） |
| 2 | 引数エラー（未知のコマンド・フラグ、TUI に TTY がない） |
| 3 | 指定のセットが見つからない |
| 4 | レジストリ取得失敗かつキャッシュなし |

---

<details>
<summary><strong>仕組み — バイナリから復元した spinnerVerbs の仕様</strong></summary>


`spinnerVerbs` は Claude Code の**未文書**の設定です。公式ドキュメントにも [schemastore](https://www.schemastore.org/claude-code-settings.json) のスキーマにも載っていません。以下は Claude Code **2.1.235** のバイナリから復元した実際の仕様で、`ccverbs` が書き込むのもこの形です。

```json
{
  "spinnerVerbs": {
    "mode": "replace",
    "verbs": ["岩を押し上げています", "山頂を目指しています"]
  }
}
```

検証スキーマ:

```js
spinnerVerbs: z.object({
  mode:  z.enum(["append", "replace"]),   // 必須
  verbs: z.array(z.string())              // 必須
}).optional()
```

実行時の解決:

```js
function resolveVerbs() {
  const t = settings.spinnerVerbs;
  if (!t) return DEFAULT_VERBS;                                  // 186 語
  if (t.mode === "replace") return t.verbs.length > 0 ? t.verbs : DEFAULT_VERBS;
  return [...DEFAULT_VERBS, ...t.verbs];                         // append
}
```

### 結論としてわかること

| 疑問 | 答え |
| --- | --- |
| Claude Code 標準の動詞は何個？ | **186 個**（`Accomplishing` 〜 `Zigzagging`、重複 0） |
| 長さは？ | 5〜18 文字、平均 10.0 文字。最長は `Flibbertigibbeting` と `Whatchamacalliting` |
| **単語数に上限はある？** | **上限なし。** 配列に `.min()` も `.max()` も付いていない。1 語でも 1 万語でも通る |
| 1 語の文字数に上限は？ | スキーマ上は**なし**。ただしスピナーは端末幅で切り詰めるので短いほうがよい |
| `mode` と `verbs` は省略できる？ | **できない。両方必須。** `mode` を省くと検証エラー |
| オブジェクトでなく配列を渡すと？ | `Expected object, but received array` で失敗 |
| `replace` に空配列を渡すと？ | 標準 186 語にフォールバック |
| `append` はどこに入る？ | 標準 186 語の**後ろ** |
| 末尾の `…` は自分で付ける？ | **付けない。** Claude Code が `verb + "…"` で自動付与する。`…` で終わる単語は `……` になるので `ccverbs` は拒否する |
| 動詞が切り替わるタイミングは？ | ターンごとに 1 回、一様ランダムに選出 |

個数に技術的な上限がないので、`ccverbs` が課しているのは編集上の指針だけです。1 セット 10〜40 語（`settings.json` が読める大きさに保つため）、1 語は表示幅 40 列以内（隣の経過秒数とトークン数が見えるように）。

### 単語セットの配布方法

単語セットは npm パッケージに**同梱していません**。`ccverbs` は実行時に `main` の [`sets/index.json`](sets/index.json) を取得し、`~/.ccverbs/cache/` に 1 時間キャッシュします。

```
npx ccverbs
  └─ GET raw.githubusercontent.com/ryoshin0830/ccverbs/main/sets/index.json
       ├─ 成功 → キャッシュして使用
       └─ 失敗 → キャッシュにフォールバック（期限切れでも使う）
```

そのため、PR がマージされた時点で全ユーザーに反映されます。npm への publish は不要です。初回実行後は完全にオフラインで動き、`--offline` でキャッシュのみを強制できます。

</details>

---

## ライセンス


MIT。`sisyphus` セットは kok1eeeee 氏の[この記事](https://zenn.dev/kok1eeeee/articles/claude-code-spinner-verbs-sisyphus)が出典で、このプロジェクト自体もそこから生まれました。
