import type { Catalog } from "./en";

export const zhHant: Catalog = {
  meta: { nativeName: "繁體中文", reviewed: false },

  header: {
    tagline: "自己決定 Claude Code 工作時顯示的詞。",
    languageLabel: "介面語言",
  },

  preview: {
    empty: "在下面寫一個詞，這裡會照 Claude Code 的實際樣子顯示。",
    columns: (width, max) => `${max} 欄中的 ${width} 欄`,
    tooWide: "超過 40 欄，計時會被擠出畫面",
    pause: "暫停",
    play: "播放",
    previous: "上一個詞",
    next: "下一個詞",
    ruler: "40",
  },

  words: {
    heading: "寫下詞句",
    hint: "每行一個。結尾的 … 由 Claude Code 加上。",
    placeholder: "正在健身\n正在喝乳清\n正在盯著啞鈴",
    count: (n) => `${n} 個詞`,
    allClear: "都在 40 欄以內",
    toFix: (n) => `${n} 處要修改`,
    empty: "貼上或輸入你的清單就能開始。",
  },

  issues: {
    "trailing-ellipsis": () => "請去掉結尾的 …，Claude Code 會自己加。",
    "too-wide": (width) => `有 ${width} 欄，請縮短到 40 欄。`,
    duplicate: () => "這個詞已經有了。",
    "control-char": () => "包含控制字元。",
    "too-long": () => "超過 120 個字元。",
  },

  name: {
    heading: "取個名字",
    nameLabel: "名稱",
    namePlaceholder: "健身",
    idLabel: "檔名",
    descriptionLabel: "一行說明",
    descriptionPlaceholder: "在健身房組間會念的話",
    emojiLabel: "選一個表情",
    emojiOther: "自己輸入",
  },

  inferred: {
    heading: "從詞句中讀出的資訊",
    change: "修改",
    hide: "收起",
    language: "語言",
    category: "類型",
    idNote: "檔名在整個儲存庫中不能重複。若已被使用，Pull Request 會提示。",
    languages: {
      ja: "日文",
      en: "英文",
      "zh-Hans": "簡體中文",
      "zh-Hant": "繁體中文",
      ko: "韓文",
      mixed: "術語加譯文",
    },
    categories: {
      meme: "趣味",
      study: "順手就記住的單字卡",
      classic: "取代預設詞表",
    },
  },

  optional: {
    toggle: "署名、加上標籤",
    tagsLabel: "標籤",
    tagsHint: "逗號分隔，最多 8 個",
    authorLabel: "你的名字",
    githubLabel: "GitHub 使用者名稱",
    sourceLabel: "來源",
    sourcePlaceholder: "https://",
  },

  send: {
    heading: "送出",
    notReady: "上面兩步填好後按鈕就會出現。",
    button: "在 GitHub 上開 Pull Request",
    afterButton:
      "GitHub 會帶著寫好的檔案打開。沒有寫入權限時它會先讓你 fork，這是正常流程。然後按「Propose new file」。",
    tooLong: (length) => `清單太長，放不進連結（${length} 個字元）。請改用複製:`,
    tooLongStep1: "複製 JSON。",
    tooLongStep2: "開啟新增檔案頁面並貼上。",
    tooLongLink: "開啟新增檔案頁面",
    copy: "複製 JSON",
    copied: "已複製",
    download: "下載",
    showJson: "檢視檔案",
    charCount: (length) => `連結 ${length} 個字元`,
  },

  errors: {
    id: {
      empty: "需要檔名。",
      shape: "只用小寫字母、數字和單一連字號，例如 ja-gym。",
    },
    name: { empty: "需要名稱。", long: "請控制在 40 個字元以內。" },
    emoji: { empty: "請選一個表情。", many: "只要一個表情。" },
    description: { empty: "需要一行說明。", long: "請控制在 120 個字元以內。" },
    tags: { many: "標籤最多 8 個。", shape: "小寫單字，可用連字號。" },
    source: { shape: "完整的 http(s) 網址，或者留空。" },
    verbs: { empty: "請至少輸入一個詞。", many: "最多 500 個詞。" },
  },

  footer: {
    cli: "已經想好要用哪個詞集？用 CLI 直接套用:",
    repo: "原始碼，以及內建的 22 個詞集",
  },
};
