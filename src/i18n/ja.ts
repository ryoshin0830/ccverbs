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
    noMatches: "該当するセットがありません。",
    footerSet: "↑↓ 選択 · Enter 決定 · 文字入力で検索 · Esc 終了",
    footerChoice: "↑↓ 選択 · Enter 決定 · Esc 戻る",
    footerConfirm: "y 適用 · n 戻る · Esc 戻る",
    pickHint: "セットを選ぶとプレビューが出ます。",
    applyTitle: (name) => `${name} を適用します`,
    modeLabel: "適用方法",
    scopeLabel: "保存先",
    applyQuestion: "適用しますか？",
    changeSettings: "変更は ccverbs config",
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
    },
    options: {
      mode: "この実行だけ適用方法を上書きする",
      scope: "この実行だけ保存先を上書きする",
      lang: "この実行だけ表示言語を上書きする",
      json: "機械可読な出力にする",
      yes: "確認を省略する",
      "dry-run": "差分だけ出して書き込まない",
      "no-backup": ".ccverbs.bak を作らない",
      refresh: "キャッシュを無視して取得し直す",
      offline: "キャッシュのみ使い、通信しない",
      "no-group": "一覧を言語でまとめない",
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
  },
};
