import { DEFAULT_VERB_COUNT } from "../constants.js";
import type { Catalog } from "./en.js";

export const ja: Catalog = {
  meta: {
    name: "Japanese",
    nativeName: "日本語",
    reviewed: true,
  },

  common: {
    appName: "ccverbs",
    verbCount: (n) => `${n}語`,
    setCount: (n) => `${n}セット`,
    registrySummary: (sets, verbs) =>
      `${sets}セット · ${verbs}語 · 標準は${DEFAULT_VERB_COUNT}語`,
    yesNo: "(Y/n)",
    minutesAgo: (n) => `${n}分前`,
    justNow: "たった今",
    never: "未取得",
  },

  wizard: {
    searchLabel: "検索:",
    randomRow: "おまかせ",
    randomHint: "ランダムに1セット選ぶ",
    createRow: "新しい単語セットを作る",
    createHint: "投稿用Webアプリを開く",
    createTitle: "自分の単語セットを作る",
    createPreview: "単語を作成・プレビューして、GitHubでPull Requestを出せます。",
    createOpened: "投稿用Webアプリをブラウザで開きました。",
    createFailed: (message) => `ブラウザを開けませんでした: ${message}`,
    createManual: "次のURLを手動で開いてください:",
    noMatches: "該当するセットがありません。",
    footerSet: "↑↓ 選択 · Enter 決定 · 文字入力で検索 · Esc 終了",
    footerChoice: "↑↓ 選択 · Enter 決定 · Esc 戻る",
    footerConfirm: "y 適用 · n 戻る · Esc 戻る",
    pickHint: "セットを選ぶとプレビューが出ます。",
    applyTitle: (name) => `${name} を適用します`,
    modeLabel: "適用方法",
    scopeLabel: "保存先",
    targetLabel: "変更対象",
    changeLabel: "変更内容",
    currentLabel: "現在",
    afterLabel: "適用後",
    effectLabel: "反映後",
    changeSummary: (name, n, mode) =>
      mode === "replace"
        ? `spinnerVerbs を${name}の${n}語に置き換えます`
        : `spinnerVerbs に${name}の${n}語を追加します（Claude Code 標準の${DEFAULT_VERB_COUNT}語に追加）`,
    currentSummary: (mode, n) =>
      mode === null
        ? `未設定（Claude Code 標準の${DEFAULT_VERB_COUNT}語）`
        : mode === "replace"
          ? `カスタム${n}語（置き換え）`
          : `Claude Code 標準の${DEFAULT_VERB_COUNT}語 + 追加${n}語（追加モード）`,
    afterSummary: (name, n, mode, total) =>
      mode === "replace" ? `${name}の${n}語だけ` : `${name}の${n}語を追加（合計${total}語）`,
    effectSummary: (n) => `Claude Code は${n}語から進行表示を選びます`,
    applyQuestion: "この変更を適用しますか？",
    changeSettings: "適用方法や保存先を変える: ccverbs config",
    willPickFrom: (n) => `適用後は${n}語から選ばれます。`,
    appliedTitle: (name, n, mode) => `${name} を適用しました — ${n}語、${mode}`,
    settingsPath: "設定:",
    backupPath: "バックアップ:",
    restartHint: "新しいセッションを開始すると反映されます。",
    anyKeyToExit: "何かキーを押すと終了します。",
    skippedSets: (n, ids) => `不正なセット${n}件を読み飛ばしました: ${ids}`,
    andMore: (n) => `... ほか${n}語`,
  },

  modes: {
    replace: "置き換える",
    replaceHint: (n) => `このセットの${n}語だけを使う`,
    append: "追加する",
    appendHint: (base, add) => `標準${base}語 ＋ この${add}語 = ${base + add}語`,
  },

  scopes: {
    user: "全体",
    project: "このプロジェクト",
    local: "このプロジェクト（ローカルのみ）",
    localNote: "Git管理外",
  },

  list: {
    totals: (sets, verbs) =>
      `${sets}セット、${verbs}語。標準は${DEFAULT_VERB_COUNT}語です。`,
    noneMatched: "該当するセットがありません。",
    byAuthor: (name) => `作: ${name}`,
    verbTotal: (n) => `${n}語`,
    noTags: "タグなし",
    otherLanguages: "他の言語",
  },

  apply: {
    removed: (n) => `spinnerVerbs を削除しました — 標準の${n}語に戻ります`,
    dryRun: "確認のみ — 何も書き込んでいません。",
    needsYes: "--yes を付けると適用します。",
  },

  current: {
    notConfigured: (n) => `spinnerVerbs は未設定です — 標準の${n}語が使われます。`,
    customList: "レジストリのどのセットとも一致しない独自の一覧",
    modeAndCount: (mode, n) => `適用方法: ${mode}  語数: ${n}`,
    willPickFrom: (n) => `${n}語から選ばれます。`,
    andMore: (n) => `... ほか${n}語`,
  },

  config: {
    title: "ccverbs 設定",
    language: "言語",
    mode: "適用方法",
    scope: "保存先",
    resetRow: "既定値に戻す",
    footerList: "↑↓ 選択 · Enter 変更 · Esc 終了",
    auto: "自動",
    autoDetected: (name, source) => `判別結果: ${name}（${source}）`,
    unreviewed: "母語話者のレビュー募集中",
    configLabel: "設定",
    cacheLabel: "キャッシュ",
    saveFailed: (message) => `設定を保存できませんでした: ${message}`,
    sourceFlag: "--lang の指定",
    sourceEnv: "CCVERBS_LANG の指定",
    sourceConfig: "設定ファイルから",
    sourcePosixEnv: "環境変数 LANG から",
    sourceOs: "OSの言語設定から",
    sourceIntl: "実行環境のロケールから",
    sourceDefault: "既定値",
    unreviewedNotice: (name) =>
      `${name} は母語話者のレビューを受けていません。修正の提案を歓迎します: https://github.com/ryoshin0830/ccverbs`,
  },

  errors: {
    setNotFound: (id) => `"${id}" というセットはありません`,
    registryUnavailable: (message) => `単語セットの取得に失敗しました: ${message}`,
    registryHint:
      "単語セットは GitHub から取得します。接続を確認して再実行してください。",
    noTty: "対話画面を出せる端末がありません。ワンショットのコマンドを使ってください。",
    unknownCommand: (name) => `${name} というコマンドはありません`,
    unknownOption: (name) => `${name} というオプションはありません`,
    unexpectedArgument: (name) => `余分な引数があります: ${name}`,
    invalidValue: (flag, allowed, got) =>
      `${flag} は ${allowed} のいずれかです。指定された値: ${got}`,
    requiresArgument: (command, what) => `${command} には${what}が必要です`,
    exclusiveOptions: (a, b) => `${a} と ${b} は同時に指定できません`,
    unknownConfigKey: (key, allowed) =>
      `"${key}" という設定はありません。${allowed} のいずれかです`,
    configNeedsValue: (key, allowed) => `${key} には値が必要です: ${allowed} のいずれか`,
    writeFailed: (message) => `書き込めませんでした: ${message}`,
    noSets: "利用できる単語セットがありません",
    setId: "セットのid",
    query: "検索語",
  },

  help: {
    tagline: "Claude Code のスピナー動詞を差し替える",
    usage: "使い方: ccverbs [コマンド] [オプション]",
    defaultLine: "対話画面を開く（既定）",
    commandsHeading: "コマンド:",
    optionsHeading: "オプション:",
    examplesHeading: "例:",
    exitCodes:
      "終了コード: 0 成功 / 1 実行時エラー / 2 引数エラー / 3 セットが見つからない / 4 レジストリ取得失敗",
    footer:
      "単語セットは https://github.com/ryoshin0830/ccverbs にあります。PR 歓迎です。",
    commands: {
      list: "単語セットを一覧する",
      show: "セットの全単語を表示する",
      search: "id・名前・説明・タグで検索する",
      set: "セットを Claude Code に適用する",
      random: "ランダムに1セット選んで適用する",
      current: "現在適用されている内容を表示する",
      reset: `spinnerVerbs を削除して標準${DEFAULT_VERB_COUNT}語に戻す`,
      config: "設定（言語・適用方法・保存先）を表示・変更する",
      new: "セットJSONを検証し、必要ならPull Requestを開く",
    },
    options: {
      mode: "この実行だけ適用方法を上書きする",
      scope: "この実行だけ保存先を上書きする",
      lang: "この実行だけ表示言語を上書きする",
      json: "機械可読な出力にする",
      yes: "確認を省略する",
      "dry-run": "差分だけ出して書き込まない",
      "no-backup": ".ccverbs.bak を作らない",
      refresh: "指定しても何も変わらない（毎回取得が既定）",
      offline: "前回取得したものを使い、通信しない",
      "no-group": "一覧を言語でまとめない",
      input: "セットJSONをファイルまたは標準入力（-）から読む",
      pr: "検証後にPull Requestを開く",
      branch: "Pull Requestに使うブランチ名",
      help: "このヘルプを表示する",
      version: "バージョンを表示する",
    },
    examples: [
      { cmd: "ccverbs", text: "セットを探して選ぶ" },
      { cmd: "ccverbs config", text: "言語・適用方法・保存先を変える" },
      { cmd: "ccverbs list --json", text: "全セットと語数を出す" },
      { cmd: "ccverbs set git-commands --yes", text: "確認なしで適用する" },
      { cmd: "ccverbs random --yes", text: "おまかせで適用する" },
      { cmd: "ccverbs current --json", text: "今入っている内容を見る" },
      { cmd: "ccverbs reset --yes", text: "標準の動詞に戻す" },
    ],
    agentsHeading: "AI エージェント向け:",
    agents: [
      "どのコマンドも --json を受け取り、先頭キーが ok のJSONを1行だけ出します。",
      "set・random・reset は --yes を付けるまで差分を出すだけです。",
      "既定の対話画面はTTYが必要なので、代わりに次のコマンドを使ってください。",
    ],
    agentExamples: [
      { cmd: "ccverbs list --json", text: "選ぶ前に全セットを読む" },
      { cmd: "ccverbs show <id> --json", text: "1セットの全単語を読む" },
      { cmd: "ccverbs search <query> --json", text: "id・名前・タグで探す" },
      { cmd: "ccverbs set <id> --json", text: "差分だけ見て書き込まない" },
      { cmd: "ccverbs set <id> --yes --json", text: "ユーザーのために適用する" },
      { cmd: "ccverbs current --json", text: "今の状態を報告する" },
    ],
    contributeHeading: "単語セットを追加する（AI エージェント向け）:",
    contribute: [
      "1. ccverbs list --json で、同じテーマが既にないか確かめる。",
      "2. id・name・emoji・description・language・category・tags と、",
      "   声をそろえた単語10〜40個を持つJSONオブジェクトを1つ作る。",
      "3. cat set.json | ccverbs new --input - --json は通信せずに検証する。",
      "   error.issues の path と code に従って直し、okになるまで繰り返す。",
      "4. canonical JSON をユーザーに見せる。--pr はPull Requestを開く",
      "   許可を明示的にもらった後だけ付ける。",
      "詳しい取り決め: ccverbs new --help と docs/ai-agents.md",
      "人が作るなら ccverbs を実行して「Create a new set」を選ぶ。",
    ],
    new: {
      title: "ccverbs new — 単語セットを作る",
      usage: "使い方: ccverbs new --input <path|-> [--json] [--pr] [--branch <name>]",
      description:
        "エージェントやスクリプトが作ったセットJSONを検証します。検証だけなら現在の作業ツリーを変更しません。",
      inputHeading: "入力:",
      input:
        "id・name・emoji・description・language・category・tags・verbsを持つJSONオブジェクトを1つ渡します。ファイルパスまたは標準入力の - を使えます。author・source・i18nは任意です。",
      inputExample: `最小の例:
{
  "id": "ja-gym",
  "name": "筋トレ",
  "emoji": "🏋",
  "description": "運動中に見る言葉",
  "language": "ja",
  "category": "meme",
  "tags": ["gym"],
  "verbs": ["筋トレしています", "プロテインを飲んでいます"]
}`,
      workflowHeading: "エージェントの手順:",
      workflow: [
        "1. まず ccverbs list --json と ccverbs show <似たid> --json で既存セットを調べる。",
        "2. 一貫したテーマで、通常10〜40個の役立つ語を作る。",
        "3. cat set.json | ccverbs new --input - --json で検証する。",
        "4. ok が false なら error.issues の各 path と code に従って修正し、再検証する。",
        "5. 外部操作の前に、要約と canonical json をユーザーに見せる。",
      ],
      outputHeading: "出力と修正:",
      output: [
        "--json を付けると、stdoutには先頭キーが ok のJSONオブジェクトを1行だけ出します。",
        "成功時は validated:true・set・canonical jsonを返し、PR成功時は pr.url・pr.branch・pr.forkedも返します。",
        "検証エラーは終了コード2で安定した error.issues の path/codeを返します。PRやツールのエラーは終了コード1で手動復旧手順を返します。",
        "既存idとの衝突はライブ確認しません。CIと人間のレビューで確認します。",
      ],
      safetyHeading: "PRの安全条件:",
      safety: [
        "--pr は一時cloneを使い、必要ならfork・pushしてGitHub Pull Requestを開きます。",
        "投稿を実行することをユーザーが明示的に許可した後だけ --pr を使います。",
        "PRをmergeせず、sets/index.jsonも書き換えません。",
      ],
      examplesHeading: "例:",
      examples: [
        { cmd: "cat set.json | ccverbs new --input - --json", text: "通信や変更なしで検証する" },
        { cmd: "ccverbs new --input set.json --json", text: "ファイルを検証してcanonical JSONを出す" },
        { cmd: "cat set.json | ccverbs new --input - --pr --json", text: "明示的な許可の後だけ投稿する" },
        { cmd: "ccverbs new --input set.json --pr --branch add-my-set --json", text: "ブランチ名を指定して投稿する" },
      ],
      footer: "詳細な契約と復旧方法は docs/ai-agents.md を読んでください。",
    },
  },
};
