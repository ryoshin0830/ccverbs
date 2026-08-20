# ccverbs 投稿導線の設計 — README 再構成と単語セット投稿 Web アプリ

- 日付: 2026-08-20
- 対象: ccverbs 0.2.x 系（CLI のバージョンは上げない。Web アプリは別デプロイ）
- 前提となる設計: `docs/superpowers/specs/2026-08-19-ccverbs-design.md`、`docs/superpowers/specs/2026-08-20-ccverbs-i18n-wizard-design.md`

## 1. 目的

「他のユーザーが単語セットを出しやすくする」ための 2 つの変更。

1. **README の再構成** — 投稿方法を上に上げ、リファレンス的な調査章を下部に折りたたむ。
2. **投稿 Web アプリ** — ブラウザで単語リストを作り、実際のスピナーの見え方を確認し、
   GitHub の PR まで 2 クリックで到達できるようにする。

### 1.1 現状の摩擦（計測結果）

| 項目 | 実測 |
| --- | --- |
| README の長さ | 355 行 / 2117 語 |
| 「Contributing a verb set」の位置 | 324 行目（最下部） |
| 調査章「How it works」の位置 | 114 行目（設定・言語・セット一覧より前） |
| `.github/` の中身 | `workflows/` のみ。issue / PR テンプレートなし |
| 投稿者が手で書くフィールド | 8 個（`id` `name` `emoji` `description` `language` `category` `tags` `verbs`） |
| 投稿前に自分のセットを試す手段 | **存在しない** |

最後の 1 行が最大の障壁である。投稿者の実際の疑問は「この単語を 1 日に数十回見て、
まだ良いと思えるか」であり、現状それを確かめる方法が PR を出す以外にない。

## 2. PR 作成の方式：GitHub の new-file ディープリンク

検討した 3 案。

| 案 | 内容 | 採否 |
| --- | --- | --- |
| A | サーバ側に fine-grained PAT を置き、アプリがブランチと PR を作る | 不採用 |
| **B** | **アプリは JSON を組み立て、GitHub の new-file URL を開くだけ** | **採用** |
| C | GitHub App で短命トークンを発行する | 不採用（規模に対して過剰） |

### 2.1 A を採らない理由

- **PR 権限だけでは動かない。** PR の前にブランチとファイルを作る必要があるため、
  fine-grained PAT に `Contents: Read and write` が必須になる。つまり公開フォームの
  背後に、リポジトリへの書き込み権限を持つ長命の秘密が置かれる。
- **荒らし経路になる。** 検証とレート制限を入れても、悪意ある相手は数分で数十本の
  ブランチと PR を作れる。GitHub 自身のアカウント制限という防波堤が効かなくなる。
- **投稿者にクレジットが行かない。** PR の作者が全てリポジトリ所有者になり、
  投稿者の貢献は本文の記述に落ちる。OSS に単語リストを送る人が欲しいものは、
  多くの場合 PR 1 本の実績である。

### 2.2 B の性質

- **秘密を持たない。** 発行・ローテーション・漏洩時対応・環境変数管理がすべて不要。
  Lolipop のダッシュボードに設定する環境変数は 0 個。
- **PR は投稿者本人の名義**になり、contributor として正しく記録される。
- **荒らし耐性は GitHub に委譲される。**
- 代償: 投稿者に GitHub アカウントが必要。開発ツールに単語リストを送る層は
  ほぼ保有しているとみて、初版はこれで足りると判断する。
- B で足りないと**観測してから**（アカウントを持たない人が実際に離脱していることを
  確認してから）A を足す。先に作らない。

### 2.3 URL の形式

```
https://github.com/ryoshin0830/ccverbs/new/main
  ?filename=sets/<id>.json
  &value=<URL エンコードした JSON 本文>
```

書き込み権限のない利用者がこの URL を開いた場合、GitHub は fork を促し、
`Propose new file` で fork 上のブランチと PR が作られる。この挙動は実装時に
実際の URL で確認する（4.6 の検証項目）。

### 2.4 URL 長の上限

URL エンコードは日本語 1 文字を 9 文字に膨らませる（3 バイト × `%XX`）。
実測値（`$schema`・メタ情報・`i18n` を含む現実的な JSON で計測）:

| 想定 | JSON | URL |
| --- | --- | --- |
| 日本語 10 語 | 567 | 2,287 |
| 日本語 40 語 | 1,167 | 5,767 |
| 学習系 40 語（ASCII + 日本語の混在） | 1,887 | **6,167** |
| 長い日本語 100 語 | 3,267 | 20,827 |

**上限は 7,500 文字とする。** 広く実装されている HTTP リクエストライン
上限 8 KB に対する保守的な値である。GitHub の実際の 414 閾値を計測した値では
ないため、余裕を取る。

この値の根拠として重要なのは、**学習系 40 語が 6,167 文字になる**という実測である。
学習系はこのプロジェクトで最も価値の高いカテゴリであり、ここが常にフォールバックに
落ちる設計は失敗である。当初 6,000 と見積もっていたが、実測により引き上げた。

7,500 を超える場合は「JSON をコピー」+「空の new-file ページを開く」の 2 段手順に
切り替える。これは**劣化した経路ではなく正規の経路の一つ**として提示する。
JSON のコピーとダウンロードは、URL が収まる場合でも常に表示する。

## 3. 共有コード

検証ロジックを Web アプリで再実装しない。単一の出所を保つ。

```
src/contrib/
  build.ts     buildSetJson, newFileUrl, MAX_URL_LENGTH
  validate.ts  validateDraft — フォーム入力に対する行単位の診断
```

- `src/registry/schema.ts` の `verbSetSchema` / `displayWidth` / `layoutWidth` を再利用する。
- `src/contrib/` は CLI パッケージのソースツリーに置く。したがって既存の vitest が
  そのままカバーし、CI も変更不要。将来 `ccverbs new` を足すときも同じ関数を使える。
- Web アプリはここから import する。ブラウザで動く必要があるため、
  `node:fs` などに依存してはならない（純関数のみ）。

### 3.1 インターフェース

```ts
export interface SetDraft {
  id: string;
  name: string;
  emoji: string;
  description: string;
  language: "ja" | "en" | "zh-Hans" | "zh-Hant" | "ko" | "mixed";
  category: "meme" | "study" | "classic";
  tags: string[];
  authorName?: string;
  authorGithub?: string;
  source?: string;
  /** 生の複数行テキスト。1 行 1 語。空行は無視する */
  verbsText: string;
}

export type VerbIssueKind =
  | "trailing-ellipsis"
  | "too-wide"
  | "duplicate"
  | "control-char"
  | "too-long";

export interface VerbIssue {
  /** 0 始まりの、空行を除いた後の語の添字 */
  index: number;
  verb: string;
  kind: VerbIssueKind;
  /** too-wide のときの実測列数 */
  width?: number;
}

export interface DraftDiagnostics {
  /** trim 済み・空行を除いた語 */
  verbs: string[];
  verbIssues: VerbIssue[];
  /** フィールド名 → 人が読めるエラー文 */
  fieldErrors: Record<string, string>;
  ok: boolean;
}

export function validateDraft(draft: SetDraft): DraftDiagnostics;

/** 検証を通った下書きから、リポジトリに置く JSON 文字列を作る */
export function buildSetJson(draft: SetDraft): string;

export const MAX_URL_LENGTH = 7500;

export interface NewFileLink {
  /** MAX_URL_LENGTH 以内なら URL、超過なら null */
  url: string | null;
  /** value を落とした、空の new-file ページ。常に返す */
  fallbackUrl: string;
  length: number;
  tooLong: boolean;
}

export function newFileUrl(draft: SetDraft): NewFileLink;
```

### 3.2 検証の方針

- **自動で直せるものは直す。** 前後の空白は `trim` する。空行は捨てる。
  これらをエラーとして突き返さない。
- **エラーにするもの**: `…` / `...` / `。` での終端、セット内の重複、制御文字、
  120 文字超過、表示幅 40 列超過。
- 表示幅は本体と同じ扱いにする。リポジトリのテストが 40 列超過で落ちるので、
  Web 側で警告に留めると「アプリは通したのに CI で落ちる」ことになる。**エラーとする。**
- `id` はフォーム上で `name` から自動生成し、編集可能にする。kebab-case へ正規化する。
- 既存 21 セットとの `id` 衝突はアプリでは検出しない。レジストリを読まない設計に
  するため（4.4 参照）。

## 4. Web アプリ

### 4.1 構成

```
web/
  package.json          next, react, zod
  next.config.ts        output: "standalone", experimental.externalDir: true
  tsconfig.json         paths: { "@ccverbs/*": ["../src/*"] }
  app/
    layout.tsx
    page.tsx            単一ページ。フォーム + プレビュー + 出力
  components/
    DraftForm.tsx       メタ情報のフィールド群
    VerbsInput.tsx      複数行入力と行単位の診断表示
    SpinnerPreview.tsx  実際の見え方のアニメーション
    OutputPanel.tsx     PR リンク / JSON コピー / ダウンロード
  lib/
    draft.ts            React 用の薄いラッパ（状態初期値など）
```

- ルートの npm パッケージは `files: ["dist"]` なので `web/` は npm に混入しない。
- `web/` は独立した `package.json` を持ち、ルートの依存とは別に管理する。
- ルートの `tsconfig.json` の `include` に `web` を**加えない**。Web 側は自前の
  tsconfig を持ち、`npm run lint` の対象は CLI のままにする。
  Web の型検査は `web/` 内の `npm run lint` で行う。

### 4.2 単一ページの構成

```
┌──────────────────────────────────────────────────────────────┐
│  ccverbs — 単語セットを作る                                    │
│  Claude Code の待ち時間に出る言葉を、自分で決める                 │
├───────────────────────────┬──────────────────────────────────┤
│ セット名   [ 筋トレ      ]  │  こう見えます                      │
│ id        [ ja-gym      ]  │                                  │
│ 絵文字     [ 🏋 ]           │  ✻ 筋トレしています… (4s)          │
│ 説明      [            ]  │                                  │
│ 言語      [ 日本語 ▾ ]      │  ← 2 秒ごとに次の語へ              │
│ 種別      [ ネタ ▾ ]        │                                  │
│ タグ      [ fun, gym    ]  │  40 列を超える語には印を出す        │
│                            │                                  │
│ 単語（1 行 1 語）            ├──────────────────────────────────┤
│ ┌────────────────────────┐ │  ✓ 24 語 · 問題なし               │
│ │ 筋トレしています          │ │                                  │
│ │ プロテインを飲んでいます   │ │  [ GitHub で PR を出す ]          │
│ │ ...                    │ │  [ JSON をコピー ] [ 保存 ]        │
│ └────────────────────────┘ │                                  │
└───────────────────────────┴──────────────────────────────────┘
```

### 4.3 スピナープレビュー

本アプリの中心機能。`verb + "…"` に加え、Claude Code と同じ体裁の経過秒数を添える。

- 2 秒ごとに次の語へ移る。語順は入力順。
- 記号は `✻`。Claude Code の実際の描画に合わせる。
- 表示幅 40 列の目安線を出し、超過分を視覚的に示す。
- `prefers-reduced-motion` を尊重し、その場合は自動送りを止めて手動送りにする。

### 4.4 アプリはレジストリを読まない

`sets/index.json` を fetch して `id` 衝突を検出することは**しない**。

理由: そのためだけにネットワーク依存とエラー処理を増やす価値が薄い。`id` の衝突は
CI の `validate-sets.mjs` が確実に検出し、PR 上で分かる。アプリは
「その `id` は既に使われているかもしれない」旨の 1 行の注意書きに留める。

### 4.5 サーバ側の処理

**なし。** すべてクライアントで完結する。API ルートを持たない。

`output: "standalone"` は Lolipop の Next.js 要件のために設定するが、
アプリ自体はサーバ側の状態も秘密も持たない。したがって環境変数は 0 個。

### 4.6 デプロイ

```bash
cd web
lolipop deploy --name ccverbs --framework next --root .
```

- Node.js 22.12.0 以上が必要（ローカルは 24.14.1）。
- npm 前提。pnpm / yarn は使わない。
- `lolipop login` はブラウザ認証。**利用者本人の操作が必要**であり、
  本作業では代行しない。
- ローカルの `.next` はアップロードされない。install と build はデプロイ側で走る。
- `.env` はアップロードされても参照されない。今回は環境変数が 0 個なので影響しない。

実装時に確認する項目:

1. GitHub の new-file ディープリンクが、書き込み権限のない利用者に対して
   fork → PR の導線を示すこと。
2. 40 語の日本語セットで URL が 6,000 文字に収まること。
3. 100 語のセットで `tooLong` 分岐に入り、コピー手順に切り替わること。
4. `experimental.externalDir` で `../src` からの import がビルドを通ること。
   通らない場合は `web/tsconfig.json` の `paths` と、必要なら
   `src/contrib/` のみを web 配下へ複製せずに解決する手段を採る。

## 5. README の再構成

内容は削らない。順序を変え、リファレンスを折りたたむ。

| 新しい順序 | 変更 |
| --- | --- |
| タイトル + 1 行説明 | 現状維持 |
| What it looks like | 現状維持 |
| Quick start | `Install` を改題し短縮 |
| **Add a verb set** | **最下部から 4 番目へ移動。Web アプリへのリンクを先頭に置く** |
| Usage | 現状維持 |
| Configuration | 現状維持 |
| Languages | 現状維持 |
| Verb sets（一覧） | 現状維持 |
| For AI agents | 現状維持 |
| `<details>` How it works | **114 行目から下部へ移動し、折りたたむ。内容は一字も削らない** |
| License | 現状維持 |

`README.ja.md` も同じ順序に揃える。

調査章を折りたたむ判断について: 186 語・上限なし・未文書という調査結果は
このプロジェクト固有の価値だが、初めて来た人が最初に必要とする情報ではない。
`<details>` は内容を保持したまま動線から外す手段として適切である。

## 6. テスト方針

新規に検証するのは `src/contrib/` の純関数のみ。既存の 334 件に加える。

| 対象 | 内容 |
| --- | --- |
| `validateDraft` | 各 `VerbIssueKind` を個別に。前後空白の自動 trim。空行の無視。行番号が空行を除いた添字であること |
| `validateDraft` | 40 列超過が**エラー**であること（警告ではない。CI が落ちる条件と一致させる） |
| `validateDraft` | フィールド単位のエラー（kebab-case でない `id`、空の `name`、不正な `language`）|
| `buildSetJson` | 出力が `verbSetSchema` を通ること。キー順が既存セットと揃うこと。空の任意フィールドを出力しないこと |
| `buildSetJson` | 末尾改行つき 2 スペースインデント（既存 21 セットと同じ体裁） |
| `newFileUrl` | URL の形式、`filename` と `value` のエンコード |
| `newFileUrl` | 日本語 40 語（実測 5,767）が `tooLong: false` であること |
| `newFileUrl` | **学習系 40 語（実測 6,167）が `tooLong: false` であること** — 当初の 6,000 上限で誤って落ちた回帰を防ぐ |
| `newFileUrl` | 長い 100 語（実測 20,827）で `tooLong: true`、`url` が null、`fallbackUrl` は常に返ること |
| README | 節の順序（`Add a verb set` が `For AI agents` より前）、`<details>` の存在、調査内容が残っていること |

Web の UI コンポーネントに対する自動テストは初版では書かない。ロジックは
すべて `src/contrib/` にあり、そこがテストされている。UI は手で確認する。

## 7. 非目標（YAGNI）

- サーバ側 PAT による PR 自動作成（2.1 の理由により、観測してから）。
- GitHub OAuth ログイン。
- 既存セットの Web 上での編集。
- `id` 衝突のオンライン検出（4.4）。
- issue / PR テンプレート。Web アプリが同じ役割をより良く果たすため、
  初版では作らない。Web アプリを使わない層が実際に現れたら足す。
- `ccverbs new` / `ccverbs try` コマンド。`src/contrib/` を用意するので後から
  安く足せるが、今回のスコープには入れない。
- CLI のバージョン変更。Web アプリのデプロイは npm の再公開を伴わない。
