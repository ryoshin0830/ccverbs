import type { Catalog } from "./en";

export const zhHans: Catalog = {
  meta: { nativeName: "简体中文", reviewed: false },

  header: {
    tagline: "自己决定 Claude Code 工作时显示的词。",
    languageLabel: "界面语言",
  },

  preview: {
    empty: "在下面写一个词，这里会按 Claude Code 的实际样子显示。",
    columns: (width, max) => `${max} 列中的 ${width} 列`,
    tooWide: "超过 40 列，计时会被挤出屏幕",
    pause: "暂停",
    play: "播放",
    previous: "上一个词",
    next: "下一个词",
    ruler: "40",
  },

  words: {
    heading: "写下词句",
    hint: "每行一个。末尾的 … 由 Claude Code 添加。",
    placeholder: "正在健身\n正在喝蛋白粉\n正在盯着哑铃",
    count: (n) => `${n} 个词`,
    allClear: "都在 40 列以内",
    toFix: (n) => `${n} 处需要修改`,
    empty: "粘贴或输入你的列表即可开始。",
  },

  issues: {
    "trailing-ellipsis": () => "请去掉末尾的 …，Claude Code 会自己加。",
    "too-wide": (width) => `有 ${width} 列，请缩短到 40 列。`,
    duplicate: () => "这个词已经有了。",
    "control-char": () => "包含控制字符。",
    "too-long": () => "超过 120 个字符。",
  },

  name: {
    heading: "取个名字",
    nameLabel: "名称",
    namePlaceholder: "健身",
    idLabel: "文件名",
    descriptionLabel: "一行说明",
    descriptionPlaceholder: "在健身房组间会念的话",
    emojiLabel: "选一个表情",
    emojiOther: "自己输入",
  },

  inferred: {
    heading: "从词句中读出的信息",
    change: "修改",
    hide: "收起",
    language: "语言",
    category: "类型",
    idNote: "文件名在整个仓库中不能重复。若已被占用，Pull Request 会提示。",
    languages: {
      ja: "日语",
      en: "英语",
      "zh-Hans": "简体中文",
      "zh-Hant": "繁体中文",
      ko: "韩语",
      mixed: "术语加译文",
    },
    categories: {
      meme: "趣味",
      study: "顺手就记住的单词卡",
      classic: "替换默认词表",
    },
  },

  optional: {
    toggle: "署名、添加标签",
    tagsLabel: "标签",
    tagsHint: "逗号分隔，最多 8 个",
    authorLabel: "你的名字",
    githubLabel: "GitHub 用户名",
    sourceLabel: "来源",
    sourcePlaceholder: "https://",
  },

  send: {
    heading: "提交",
    notReady: "上面两步填好后按钮就会出现。",
    button: "在 GitHub 上开 Pull Request",
    afterButton:
      "GitHub 会带着写好的文件打开。没有写入权限时它会先让你 fork，这是正常流程。然后按 “Propose new file”。",
    tooLong: (length) => `列表太长，无法放进链接（${length} 个字符）。请改用复制:`,
    tooLongStep1: "复制 JSON。",
    tooLongStep2: "打开新建文件页面并粘贴。",
    tooLongLink: "打开新建文件页面",
    copy: "复制 JSON",
    copied: "已复制",
    download: "下载",
    showJson: "查看文件",
    charCount: (length) => `链接 ${length} 个字符`,
  },

  errors: {
    id: {
      empty: "需要文件名。",
      shape: "只用小写字母、数字和单个连字符，例如 ja-gym。",
    },
    name: { empty: "需要名称。", long: "请控制在 40 个字符以内。" },
    emoji: { empty: "请选一个表情。", many: "只要一个表情。" },
    description: { empty: "需要一行说明。", long: "请控制在 120 个字符以内。" },
    tags: { many: "标签最多 8 个。", shape: "小写单词，可用连字符。" },
    source: { shape: "完整的 http(s) 网址，或者留空。" },
    verbs: { empty: "请至少输入一个词。", many: "最多 500 个词。" },
  },

  footer: {
    cli: "已经想好要用哪个词集？用 CLI 直接应用:",
    repo: "源码，以及内置的 23 个词集",
  },
};
