# ccverbs v0.2.0 設計書 — ウィザードUI・多言語対応・設定の永続化

- 日付: 2026-08-20
- 対象バージョン: 0.2.0（追加的変更。`settings.json` の書式は 0.1.0 と互換）
- 前提となる設計: `docs/superpowers/specs/2026-08-19-ccverbs-design.md`

## 1. 背景と目的

0.1.0 の TUI には 3 つの問題がある。

1. **mode と scope の選択画面が分かりにくい。** 1 画面に 2 つの軸を並べ、どちらを操作しているかを
   不可視の「フォーカス中フィールド」状態で持ち、上下でフィールド切替・左右で値変更という
   二層の操作を要求している。左右キーが何かをすることが画面から読み取れない。
2. **英語のみ。** 日本語話者が主要な想定利用者なのに UI 文言が英語で固定されている。
3. **状態を覚えない。** 毎回 `replace` / `user` から選び直す。

本設計はこの 3 点を、次の 3 つの変更で解決する。

- **ウィザード化**: 1 画面 1 問、上下と Enter だけの選択式にする。
- **多言語対応**: 5 ロケール（en / ja / zh-Hans / zh-Hant / ko）。端末・OS から自動判別し、手動でも変更できる。
- **設定の永続化**: `~/.ccverbs/` に言語と前回の mode / scope を保存する。

### 1.1 事前調査：素朴な言語判別は失敗する

実機（macOS、システム言語が日本語）での測定結果:

```
Intl.DateTimeFormat().resolvedOptions().locale  →  "en-US"     ← 誤り
process.env.LANG                                →  "C.UTF-8"   ← 言語ではない
process.env.LC_ALL / LC_MESSAGES / LANGUAGE     →  未設定
defaults read -g AppleLanguages                 →  ("ja-JP", "zh-Hans-JP")   ← 正解
```

`Intl` と `LANG` の両方が英語を指すが、実際のシステム言語は日本語である。
したがって以下の 2 点が必須要件となる。

- `LANG` / `LC_*` の値が `C`、`POSIX`、空文字のときは**「英語」ではなく「指定なし」**として次の候補へ進む。
- macOS と Windows では OS に問い合わせる。

## 2. 用語

| 語 | 意味 |
| --- | --- |
| ロケール | 本ツールが UI を表示できる言語。`en` \| `ja` \| `zh-Hans` \| `zh-Hant` \| `ko` の 5 値 |
| カタログ | 1 ロケール分の UI 文言の集合。TypeScript オブジェクト |
| BCP 47 タグ | OS や環境変数が返す言語識別子（`ja-JP`、`zh-Hans-JP` など） |
| ネゴシエーション | BCP 47 タグを 5 つのロケールのいずれかに解決すること |

## 3. 多言語対応

### 3.1 方式：TypeScript カタログ、`en` を型の源とする

JSON カタログと文字列キー（`t("wizard.stepMode")`）は採らない。キーの打ち間違いと
未翻訳キーが実行時までわからないためである。代わりに

- `src/i18n/en.ts` が完全なカタログをオブジェクトとして export し、`export type Catalog = typeof en;` で型を導出する。
- 他のロケールは `export const ja: Catalog = { ... }` と型注釈を付ける。
  キーが欠けていれば**コンパイルエラーになり、欠けているキーが列挙される**。
- 参照は `t.wizard.stepMode` のようにプロパティアクセスで行う。実行時のキー解決は存在しない。

6 番目の言語を追加する作業は「コンパイルエラーが消えるまで埋める」作業になる。

### 3.2 複数形と語順：値を関数にする

カタログの値は、埋め込みが必要な箇所では文字列ではなく関数とする。
これにより複数形ライブラリが不要になり、各言語が自分の数え方で表現できる。

```ts
// en.ts
verbCount: (n: number) => `${n} verb${n === 1 ? "" : "s"}`,
appendHint: (base: number, add: number) =>
  `Claude Code's ${base} verbs plus these ${add} = ${base + add}`,

// ja.ts
verbCount: (n: number) => `${n}語`,
appendHint: (base: number, add: number) =>
  `標準${base}語 ＋ この${add}語 = ${base + add}語`,
```

### 3.3 カタログの配置

カタログは **npm パッケージに同梱する**。単語セットのように GitHub から取得しては**ならない**。

理由: 「レジストリに到達できません」というエラーメッセージ自体を翻訳する必要があるため、
i18n がネットワークに依存してはいけない。カタログはコンテンツではなくコードである。

### 3.4 カタログの名前空間

```ts
export interface CatalogShape {
  meta: {
    /** 英語での言語名。ドキュメントと --help 用 */
    name: string;
    /** その言語自身での表記。言語選択画面に出す */
    nativeName: string;
    /** 母語話者によるレビューが済んでいるか。3.6 参照 */
    reviewed: boolean;
  };
  common: { ... };   // 語数・セット数・パス表示など横断的な断片
  wizard: { ... };   // ウィザードの各画面
  list: { ... };     // list / search / show の見出しと列
  apply: { ... };    // 適用結果・差分・バックアップの説明
  current: { ... };  // current コマンド
  config: { ... };   // config コマンドと判別根拠のラベル
  errors: { ... };   // 全エラーメッセージ
  help: { ... };     // コマンドとオプションの説明文（7 節）
}
```

`en.ts` から `export type Catalog = typeof en;` を導出するため、`CatalogShape` は
設計上の説明であり、コード上の唯一の真実は `en.ts` である。

### 3.5 取得

```ts
export function getCatalog(locale: SupportedLocale): Catalog;
```

単純な `Record<SupportedLocale, Catalog>` の参照。型がすべてのロケールの完全性を
保証しているため、実行時のフォールバック合成は行わない。

### 3.6 翻訳品質の方針

`en` はフォールバックであり、構造上つねに完全である。

`ja` は著者が母語話者としてレビューする。`zh-Hans`、`zh-Hant`、`ko` は母語話者による
検証を経ていない。この 3 ロケールについては

- 語彙を短く平易に保ち、言葉遊びや比喩を避ける。
- カタログの `meta.reviewed` を `false` にする。
- `CONTRIBUTING.md` に「母語話者のレビューを求めている」旨と修正 PR の手順を明記する。
- `ccverbs config` で未レビューのロケールを使っているとき、1 行の注記を出す。

`meta.reviewed` は表示の分岐にのみ使い、機能を制限しない。

## 4. ロケールの判別

### 4.1 優先順位

先に当たったものを採用する。

| 順 | 判別元 | `source` の値 | 備考 |
| --- | --- | --- | --- |
| 1 | `--lang <code>` | `flag` | 単発の上書き |
| 2 | `CCVERBS_LANG` | `env` | CI とテスト用 |
| 3 | `~/.ccverbs/config.json` の `language` | `config` | 値が `"auto"` のときは飛ばす |
| 4 | `LC_ALL` → `LC_MESSAGES` → `LANG` → `LANGUAGE` | `posix-env` | **`C` / `POSIX` / 空は指定なしとして次へ** |
| 5 | OS への問い合わせ | `os` | 4.3 参照 |
| 6 | `Intl.DateTimeFormat().resolvedOptions().locale` | `intl` | |
| 7 | `en` | `default` | |

各段でネゴシエーションに失敗した場合も次の段へ進む。たとえば `LANG=fr_FR.UTF-8` は
フランス語に解決できないので、段 5 へ進む。

### 4.2 ネゴシエーション

```ts
export function negotiate(tag: string): SupportedLocale | null;
```

`_` を `-` に正規化し、`.UTF-8` などのエンコーディング接尾辞と `@modifier` を除去したうえで、
下記の表に照らす。大文字小文字は無視する。

| 入力の例 | 結果 |
| --- | --- |
| `en`, `en-US`, `en_GB.UTF-8` | `en` |
| `ja`, `ja-JP`, `ja_JP.UTF-8` | `ja` |
| `zh-Hans`, `zh-Hans-JP`, `zh-CN`, `zh-SG`, `zh-Hans-SG`, `zh` | `zh-Hans` |
| `zh-Hant`, `zh-TW`, `zh-HK`, `zh-MO`, `zh-Hant-HK` | `zh-Hant` |
| `ko`, `ko-KR` | `ko` |
| `C`, `POSIX`, `""`, `fr-FR`, `de` | `null` |

`zh` 単体は `zh-Hans` とする（簡体字話者のほうが多数であるため）。

### 4.3 OS への問い合わせ

| プラットフォーム | コマンド | 解釈 |
| --- | --- | --- |
| `darwin` | `defaults read -g AppleLanguages` | `("ja-JP", "zh-Hans-JP")` 形式。順に負荷してネゴシエーションが成功した最初のものを採る |
| `win32` | `powershell -NoProfile -Command "Get-UICulture \| Select-Object -ExpandProperty Name"` | `ja-JP` 形式 |
| その他 | 問い合わせない | 段 4 と 6 のみで判断する |

実装上の制約:

- `execFileSync` を使う（描画前にロケールが確定していなければならないため同期呼び出しが必要）。
- `timeout: 500`、`stdio: ["ignore", "pipe", "ignore"]`。
- 例外・非ゼロ終了・解釈不能な出力はすべて**無視して次の段へ進む**。致命的にしない。
- 段 3 までで確定した場合は**呼び出さない**（起動時間を無駄にしない）。
- `CCVERBS_NO_OS_LOCALE=1` で段 5 を丸ごと飛ばす（テストと、環境で問題が出た人向けの逃げ道）。

### 4.4 インターフェース

```ts
export type LocaleSource = "flag" | "env" | "config" | "posix-env" | "os" | "intl" | "default";

export interface ResolveLocaleDeps {
  flagLang?: string | undefined;
  configLanguage?: string | undefined;   // "auto" を含む
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  intlLocale?: string;
  queryOs?: () => string[];              // 差し替え可能にしてテストを決定的にする
}

export function resolveLocale(deps?: ResolveLocaleDeps): {
  locale: SupportedLocale;
  source: LocaleSource;
};
```

すべての判別元を注入可能にする。実環境の値に依存するテストを書かないため。

## 5. ウィザード

### 5.1 状態機械

```
language ←┐
          │ (set 画面の「言語」行から)
set ──────┴──→ mode ──→ scope ──→ confirm ──→ done
 ↑             │         │          │
 │  Esc        │ Esc     │ Esc      │ Esc / n
 └─────────────┴─────────┴──────────┘
```

- 各画面は**1 問のみ**を提示する。操作は `↑` `↓` と `Enter`、戻るのは `Esc`。
  左右キーと不可視のフォーカス状態は廃止する。
- `set` 画面での `Esc` は終了（終了コード 0）。
- `Ctrl+C` はどの画面でも終了（終了コード 0）。
- `mode` と `scope` の初期選択位置は `~/.ccverbs/config.json` に保存された前回値に合わせる。
  そのため 2 回目以降は `Enter` を 3 回で適用まで到達する。
- 適用が成功した時点で `lastMode` と `lastScope` を保存する。失敗時は保存しない。

### 5.2 各画面

セット選択（検索は従来どおりインクリメンタル）。検索文字列が空のときだけ 2 行を固定表示する。

```
  ccverbs                              21セット · 496語

  検索: ▮

  ❯ 🎲 おまかせ            ランダムに1セット選ぶ
    🌐 言語                日本語
    🪨 sisyphus       10  ネタ     シーシュポスの神話
    🗾 ja-general     40  汎用     標準186語の日本語版
    ...

  ↑↓ 選択 · Enter 決定 · 文字入力で検索 · Esc 終了
```

適用方法。**選択肢のラベルではなく帰結を並べる**ことが要点である。「置き換える」だけでは
何も伝わらないので、その行で何が起きるかを併記する。

```
  [2/3] 適用方法を選んでください

  ❯ 置き換える      このセットの10語だけを使う
    追加する        標準186語 ＋ この10語 = 196語

  ↑↓ 選択 · Enter 決定 · Esc 戻る
```

保存先。選択肢ごとに解決後の実パスを見せる。

```
  [3/3] どこに保存しますか

  ❯ 全体              ~/.claude/settings.json
    このプロジェクト     ./.claude/settings.json
    ローカルのみ        ./.claude/settings.local.json   Git管理外

  ↑↓ 選択 · Enter 決定 · Esc 戻る
```

言語選択。`set` 画面の「言語」行から入る。選択した時点で即座に `config.json` に保存し、
`set` 画面へ戻る。「自動」を選ぶと `language: "auto"` を保存し、判別結果を括弧内に示す。

```
  言語を選んでください

  ❯ 自動              判別結果: 日本語（macOSの設定から）
    English
    日本語
    简体中文           母語話者のレビュー募集中
    繁體中文           母語話者のレビュー募集中
    한국어             母語話者のレビュー募集中

  ↑↓ 選択 · Enter 決定 · Esc 戻る
```

`confirm` 画面は 0.1.0 の差分表示をそのまま用い、文言のみ翻訳する。

### 5.3 言語切替にキーを割り当てない理由

`l` のような裸のキーは `set` 画面の検索入力と衝突する。`Ctrl+L` は発見されにくい。
そのため一覧に固定行として置く。`🎲 おまかせ` と同じ仕組みで、追加の操作体系を導入しない。

### 5.4 コンポーネント分割

`src/ui/App.tsx` は 0.1.0 で 1 ファイルに状態機械と全画面を抱えており、画面が増えると
維持できない。次のように分ける。

| ファイル | 責務 |
| --- | --- |
| `src/ui/App.tsx` | 状態機械と遷移のみ。画面の中身は持たない |
| `src/ui/screens/SetScreen.tsx` | セット選択（検索 + 一覧 + プレビュー） |
| `src/ui/screens/ChoiceScreen.tsx` | 「1 問 1 答」の汎用画面。mode / scope / language が共有する |
| `src/ui/screens/ConfirmScreen.tsx` | 差分表示と可否 |
| `src/ui/screens/DoneScreen.tsx` | 結果表示 |
| `src/ui/SetList.tsx` | 一覧（既存、`t` を受け取る） |
| `src/ui/PreviewPane.tsx` | プレビュー（既存、`t` を受け取る） |

`ChoiceScreen` の共通化が本設計の要である。mode / scope / language は
「見出し 1 行 + 選択肢（ラベルと補足の 2 列）」という同一形状であり、
1 つのコンポーネントで足りる。

```ts
interface Choice<T> {
  value: T;
  label: string;
  hint?: string;
  note?: string;
}

interface ChoiceScreenProps<T> {
  title: string;
  step?: { current: number; total: number };
  choices: Choice<T>[];
  initialValue: T;
  footer: string;
  onSelect: (value: T) => void;
  onBack: () => void;
}
```

## 6. 設定の永続化

### 6.1 配置

```
~/.ccverbs/
  config.json
  cache/
    index.json        単語セットのキャッシュ（TTL 3600 秒）
```

0.1.0 の `~/.cache/ccverbs/index.json` から移行する。

### 6.2 書式

```json
{
  "version": 1,
  "language": "auto",
  "lastMode": "replace",
  "lastScope": "user"
}
```

| 鍵 | 型 | 既定 |
| --- | --- | --- |
| `version` | `1` | `1` |
| `language` | `"auto"` \| ロケール 5 値 | `"auto"` |
| `lastMode` | `"replace"` \| `"append"` | `"replace"` |
| `lastScope` | `"user"` \| `"project"` \| `"local"` | `"user"` |

### 6.3 読み書きの規則

- **読み込みは決して例外を投げない。** ファイルが無い、JSON が壊れている、値が
  想定外、`version` が未知——いずれの場合も既定値を返し、警告文を添えて返す。
  スピナーの動詞を変えるツールが設定ファイルの破損で起動しないのは不合理である。
- 個々の鍵ごとに検証する。`language` だけが不正なら、`lastMode` は生かす。
- 書き込みは 0.1.0 の `settings.json` と同じ原子的手順（一時ファイル → `rename`）を使う。
  ただし `~/.ccverbs/config.json` は本ツールが所有するファイルなのでバックアップは作らない。
- 書き込み失敗は警告のみで、コマンド自体は成功させる（設定を覚えられないことは
  適用が成功したことより軽い）。

```ts
export interface CcverbsConfig {
  version: 1;
  language: "auto" | SupportedLocale;
  lastMode: "replace" | "append";
  lastScope: Scope;
}

export function configDir(home?: string): string;
export function configPath(home?: string): string;
export function cachePath(home?: string): string;
export function readConfig(path: string): { config: CcverbsConfig; warnings: string[] };
export function writeConfig(path: string, config: CcverbsConfig): { warnings: string[] };
```

### 6.4 移行

起動時に 1 回だけ実行する。

1. `~/.ccverbs/cache/index.json` が既に存在するなら何もしない。
2. `~/.cache/ccverbs/index.json` が存在するなら `~/.ccverbs/cache/index.json` へ移す。
   `rename` が失敗（別ボリューム等）したらコピーして元を消す。
3. `~/.cache/ccverbs/` が空になったら削除する。空でなければ放置する。
4. どの段でも失敗は無視する。キャッシュは失われても次回取得すれば復元される。

```ts
export function migrateCache(home?: string): { moved: boolean };
```

## 7. ヘルプのデータ化

0.1.0 の `HELP` は 208 行の手書きテンプレート文字列で、桁を空白で揃えている。
`src/args.ts` 自体は 37 桁で正しく揃っているが、同じ表を README に手で書き写した際に
`--dry-run` の行だけ 1 桁ずれた（本設計の作成中に発見し修正した）。人間が空白で桁を
合わせる方式は、書き写しと翻訳のたびにこの崩れを再生産する。5 言語に増えれば避けられない。

そこで**構造をコードに、説明文をカタログに**分ける。

```ts
// src/help/model.ts — 言語に依存しない構造
export const COMMANDS = [
  { name: "list" },
  { name: "show", arg: "id" },
  { name: "search", arg: "query" },
  { name: "set", arg: "id" },
  { name: "random" },
  { name: "current" },
  { name: "reset" },
  { name: "config", arg: "…" },
] as const;

export const OPTIONS = [
  { short: "m", long: "mode", value: "replace|append" },
  { short: "S", long: "scope", value: "user|project|local" },
  { long: "lang", value: "code" },
  { long: "json" },
  { short: "y", long: "yes" },
  { short: "n", long: "dry-run" },
  { long: "no-backup" },
  { long: "refresh" },
  { long: "offline" },
  { long: "no-group" },
  { short: "h", long: "help" },
  { short: "v", long: "version" },
] as const;

export function renderHelp(t: Catalog): string;
```

コマンド名・フラグ名は CLI の構文であり翻訳しない。カタログが供給するのは
説明文と見出しのみ。桁揃えは `layoutWidth`（0.1.0 で追加済み）を使って
`renderHelp` が計算する。

カタログのキーはコマンド名・フラグ名から導出した型にする。

```ts
help: {
  usage: string;
  commandsHeading: string;
  optionsHeading: string;
  commands: Record<(typeof COMMANDS)[number]["name"], string>;
  options: Record<(typeof OPTIONS)[number]["long"], string>;
  ...
}
```

コマンドを追加すると全ロケールでコンパイルエラーになり、説明文の追加漏れを防ぐ。

## 8. 単語セットの説明の翻訳

単語そのもの（`verbs`）は**翻訳しない**。日本語のセットは日本語である。

一方 `name` と `description` は利用者が読む文言なので、**任意の** `i18n` ブロックで
localize できるようにする。

```json
{
  "name": "Git Commands",
  "description": "Learn git subcommands while Claude works",
  "i18n": {
    "ja": { "name": "Gitコマンド", "description": "Claudeが働く間にgitを覚える" },
    "zh-Hans": { "description": "在 Claude 工作时学习 git 子命令" }
  }
}
```

- `i18n` は省略可。`i18n.<locale>.name` / `.description` も個別に省略可。
- 解決規則: `i18n[locale][field]` → 元の `field`。ロケール単位ではなくフィールド単位で
  フォールバックする。
- スキーマ上のロケール鍵は 5 値に限定し、`name` / `description` の長さ制約は本体と同じ。
- 同梱 21 セットには `ja` の `description` を入れる。他ロケールは PR に委ねる。

```ts
export function localizedName(set: VerbSet, locale: SupportedLocale): string;
export function localizedDescription(set: VerbSet, locale: SupportedLocale): string;
```

## 9. 一覧の並び順

UI ロケールに一致するセットを上に寄せる。

1. `language` が UI ロケールと一致するもの
2. `language` が `mixed` のもの
3. 残り

各帯の内部は `id` の昇順。帯の境界には区切り線を引く。

- **何も隠さない。** 検索は常に全件を対象とする。
- `--no-group` で並び替えを無効化し、`id` の昇順のみにする。
- **`--json` は常に `id` 昇順**とし、ロケールの影響を受けない。エージェントの出力が
  環境によって変わらないようにするため。人間向け出力のみ並び替える。

```ts
export function groupByLocale(sets: VerbSet[], locale: SupportedLocale): VerbSet[];
```

`zh-Hans` の UI で `language: "zh-Hant"` のセットは第 3 帯に入る（相互に別言語として扱う）。

## 10. CLI の追加

### 10.1 新しいオプション

| オプション | 意味 |
| --- | --- |
| `--lang <code>` | このコマンド 1 回だけロケールを上書きする。解釈できない値は終了コード 2 |
| `--no-group` | 一覧の並び替えを無効化する（9 節） |

`--lang` は**引数解析の直後、レジストリ取得より前**に適用する。取得失敗時の
エラーメッセージも翻訳されなければならないため。

### 10.2 `config` コマンド

```
ccverbs config                          解決後の設定と判別根拠を表示
ccverbs config language <code|auto>     言語を設定
ccverbs config mode <replace|append>    既定の mode を設定
ccverbs config scope <user|project|local>  既定の scope を設定
ccverbs config reset                    設定ファイルを既定値に戻す
ccverbs config --json                   機械可読出力
```

人間向け出力は、判別根拠を必ず併記する。「なぜ英語で出るのか」を利用者が
自力で診断できることが目的である。

```
language   ja        macOSの言語設定から判別
mode       replace   前回の選択
scope      user      前回の選択

設定       ~/.ccverbs/config.json
キャッシュ  ~/.ccverbs/cache/index.json   4分前に取得
```

`--json`:

```json
{
  "ok": true,
  "language": { "value": "ja", "source": "os", "explicit": false },
  "mode": { "value": "replace" },
  "scope": { "value": "user" },
  "supportedLocales": ["en", "ja", "zh-Hans", "zh-Hant", "ko"],
  "unreviewedLocales": ["zh-Hans", "zh-Hant", "ko"],
  "configPath": "/Users/x/.ccverbs/config.json",
  "cachePath": "/Users/x/.ccverbs/cache/index.json",
  "cacheAgeMs": 240000,
  "warnings": []
}
```

`config` は引数の第 2 語を鍵、第 3 語を値として取る。鍵が未知なら終了コード 2。
値が不正なら終了コード 2 で、許容値を列挙する。

## 11. ファイル構成の変更

```
src/
  constants.ts            CACHE_FILE を ~/.ccverbs/cache/index.json へ変更
  args.ts                 --lang, --no-group, config コマンドを追加
  selection.ts            groupByLocale を追加
  i18n/
    index.ts              SupportedLocale, getCatalog, SUPPORTED_LOCALES
    en.ts                 カタログ本体。Catalog 型の源
    ja.ts  zh-Hans.ts  zh-Hant.ts  ko.ts
    resolve.ts            negotiate, resolveLocale
    os.ts                 queryOsLocales（darwin / win32）
  config/
    paths.ts              configDir, configPath, cachePath
    io.ts                 readConfig, writeConfig
    migrate.ts            migrateCache
  help/
    model.ts              COMMANDS, OPTIONS
    render.ts             renderHelp
  registry/
    schema.ts             VerbSet に任意の i18n を追加、localizedName/Description
  commands/
    index.ts              t を受け取る。config コマンドを追加
  ui/
    App.tsx               状態機械のみ
    screens/
      SetScreen.tsx  ChoiceScreen.tsx  ConfirmScreen.tsx  DoneScreen.tsx
    SetList.tsx  PreviewPane.tsx
```

`src/commands/index.ts` は 0.1.0 で 1 ファイルに 8 コマンドを抱えている。
`config` を加えると過大になるため、本改修で分割する。

```
src/commands/
  index.ts       runCommand のディスパッチのみ
  io.ts          Io 型、emit / fail の共通ヘルパ
  list.ts        list / search
  show.ts
  apply.ts       set / random / reset の共通処理
  current.ts
  config.ts
```

## 12. テスト方針

0.1.0 の 136 件に加える。

| 対象 | 内容 |
| --- | --- |
| `negotiate` | 4.2 の表を網羅。`C` / `POSIX` / 空 / 未対応言語が `null` になること |
| `resolveLocale` | 7 段すべてを個別に。**`LANG=C.UTF-8` が `en` にならず OS 段へ進むこと**（本設計の起点となった不具合）。`config` が `"auto"` のとき飛ばすこと。段 3 で確定したとき `queryOs` が呼ばれないこと |
| `queryOsLocales` | `defaults` の出力文字列の解釈。異常出力・例外で `[]` を返すこと |
| カタログ | 5 ロケールが `en` と同一のキー構造を持つこと（型に加えて実行時にも検査）。空文字列の値が無いこと。関数値の引数個数が一致すること |
| `readConfig` | 欠損・壊れた JSON・未知の `version`・部分的に不正な値。いずれも例外を投げず既定値と警告を返すこと |
| `writeConfig` | 原子的書き込み。書き込み不能でも例外にせず警告を返すこと |
| `migrateCache` | 旧キャッシュの移動、新キャッシュがある場合の無操作、旧ディレクトリの削除、失敗時の無視 |
| `groupByLocale` | 3 帯の順序、帯内の昇順、`--no-group` 相当の素通り |
| `localizedName` / `localizedDescription` | フィールド単位のフォールバック |
| `renderHelp` | 全ロケールで桁が揃うこと。`COMMANDS` / `OPTIONS` の全項目に説明があること |
| `args` | `--lang`、`--no-group`、`config` の各形。不正値が終了コード 2 になること |
| `ChoiceScreen` | 1 問のみ表示。`initialValue` にカーソルが当たること。上下で移動、Enter で `onSelect`、Esc で `onBack` |
| ウィザード遷移 | `set → mode → scope → confirm` の前進、各段からの `Esc` の後退、`set` での `Esc` が終了、言語行から言語画面へ |
| `config` コマンド | `--json` の形、判別根拠の表示、鍵と値の検証 |
| 適用後の永続化 | 適用成功で `lastMode` / `lastScope` が保存され、失敗では保存されないこと |

`resolveLocale` のテストは実環境の環境変数・プラットフォームに依存してはならない。
すべて注入する。

## 13. 互換性

- `settings.json` に書く `spinnerVerbs` の書式は 0.1.0 と同一。
- 0.1.0 の CLI 呼び出しはすべてそのまま動く。`--json` の既存フィールドは削除も改名もしない。
  `config` 系の情報は新しいフィールドとして足すだけにする。
- 破壊的変更はないため 0.2.0（マイナー）とする。
- キャッシュの移動は自動。利用者の操作は不要。

## 14. ドキュメント

- `README.md` / `README.ja.md` に節を追加する。
  - **Configuration**: `~/.ccverbs/` の構成、`config` コマンド、`--lang`
  - **Languages**: 対応 5 ロケール、判別の優先順位（4.1 の表）、`LANG=C` の扱い、
    未レビューのロケールと協力の呼びかけ
- `CONTRIBUTING.md` に `locales/` の節を追加する。カタログの追加・修正手順、
  `Catalog` 型によるコンパイル時検査の説明、`meta.reviewed` の意味。
- 単語セットの `i18n` ブロックの書き方を `CONTRIBUTING.md` と
  `schema/verb-set.schema.json` に追加する。

## 15. 非目標（YAGNI）

- 単語（`verbs`）そのものの翻訳。
- 右横書き言語（アラビア語・ヘブライ語）への対応。Ink の双方向テキスト対応が不十分。
- プロジェクト単位の言語設定。言語は利用者に属する。
- カタログの実行時取得。3.3 の理由により意図的に行わない。
- 5 ロケール以外の同梱。追加は PR で受ける。
- 翻訳の自動生成・機械翻訳の組み込み。
