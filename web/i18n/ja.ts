import type { Catalog } from "./en";

export const ja: Catalog = {
  meta: { nativeName: "日本語", reviewed: true },

  header: {
    tagline: "Claude Code の待ち時間に出る言葉を、自分で決める。",
    languageLabel: "表示言語",
  },

  preview: {
    empty: "下に言葉を書くと、Claude Code での見え方がそのまま出ます。",
    columns: (width, max) => `${max}列のうち${width}列`,
    tooWide: "40列を超えています。経過時間が画面外に押し出されます",
    pause: "止める",
    play: "動かす",
    previous: "前の言葉",
    next: "次の言葉",
    ruler: "40",
  },

  words: {
    heading: "ことばを書く",
    hint: "1行に1つ。末尾の … は Claude Code が付けます。",
    placeholder: "筋トレしています\nプロテインを飲んでいます\nダンベルを見つめています",
    count: (n) => `${n}のことば`,
    allClear: "すべて40列以内",
    toFix: (n) => `${n}件直すところ`,
    empty: "リストを貼るか入力すると始まります。",
  },

  issues: {
    "trailing-ellipsis": () => "末尾の … は外してください。Claude Code が付けます。",
    "too-wide": (width) => `${width}列あります。40列まで詰めてください。`,
    duplicate: () => "同じ言葉がすでにあります。",
    "control-char": () => "制御文字が入っています。",
    "too-long": () => "120文字を超えています。",
  },

  name: {
    heading: "名前をつける",
    nameLabel: "名前",
    namePlaceholder: "筋トレ",
    idLabel: "ファイル名",
    descriptionLabel: "一行の説明",
    descriptionPlaceholder: "ジムでセット間につぶやいていること",
    emojiLabel: "絵文字を選ぶ",
    emojiOther: "自分で入れる",
  },

  inferred: {
    heading: "ことばから読み取りました",
    change: "変更する",
    hide: "閉じる",
    language: "言語",
    category: "種類",
    idNote:
      "ファイル名はリポジトリ全体で重複できません。使われていれば Pull Request で分かります。",
    languages: {
      ja: "日本語",
      en: "英語",
      "zh-Hans": "簡体中国語",
      "zh-Hant": "繁体中国語",
      ko: "韓国語",
      mixed: "用語とその訳",
    },
    categories: {
      meme: "ネタ",
      study: "ながら覚える単語帳",
      classic: "標準の置き換え",
    },
  },

  optional: {
    toggle: "名前を載せる・タグを付ける",
    tagsLabel: "タグ",
    tagsHint: "カンマ区切り、8個まで",
    authorLabel: "あなたの名前",
    githubLabel: "GitHub のユーザー名",
    sourceLabel: "出典",
    sourcePlaceholder: "https://",
  },

  send: {
    heading: "送る",
    notReady: "上の2つが埋まるとボタンが出ます。",
    button: "GitHub で Pull Request を出す",
    afterButton:
      "ファイルが書かれた状態で GitHub が開きます。書き込み権限がなければ fork を促されますが、それが通常の流れです。そのあと「Propose new file」を押してください。",
    tooLong: (length) => `リンクに載せるには長すぎます（${length}文字）。代わりにコピーしてください:`,
    tooLongStep1: "JSON をコピーする。",
    tooLongStep2: "新規ファイルのページを開いて貼る。",
    tooLongLink: "新規ファイルのページを開く",
    copy: "JSON をコピー",
    copied: "コピーしました",
    download: "ダウンロード",
    showJson: "ファイルを見る",
    charCount: (length) => `リンクは${length}文字`,
  },

  errors: {
    id: {
      empty: "ファイル名が必要です。",
      shape: "小文字・数字・ハイフンで、ja-gym のように。",
    },
    name: { empty: "名前が必要です。", long: "40文字までにしてください。" },
    emoji: { empty: "絵文字を選んでください。", many: "絵文字は1つだけです。" },
    description: { empty: "一行の説明が必要です。", long: "120文字までにしてください。" },
    tags: { many: "タグは8個までです。", shape: "小文字の単語で、必要ならハイフン区切り。" },
    source: { shape: "http(s) から始まるURL、または空欄。" },
    verbs: { empty: "ことばを1つ以上入れてください。", many: "500語までです。" },
  },

  footer: {
    cli: "使いたいセットが決まっているなら、CLI から適用できます:",
    repo: "ソースと、同梱の121セット",
  },
};
