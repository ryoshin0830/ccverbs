import { DEFAULT_VERB_COUNT } from "../constants.js";
import type { Catalog } from "./en.js";

export const zhHans: Catalog = {
  meta: {
    name: "Chinese (Simplified)",
    nativeName: "简体中文",
    reviewed: false,
  },

  common: {
    appName: "ccverbs",
    verbCount: (n) => `${n} 个词`,
    setCount: (n) => `${n} 个词集`,
    registrySummary: (sets, verbs) =>
      `${sets} 个词集 · ${verbs} 个词 · Claude Code 自带 ${DEFAULT_VERB_COUNT} 个`,
    yesNo: "(Y/n)",
    minutesAgo: (n) => `${n} 分钟前`,
    justNow: "刚刚",
    never: "尚未获取",
  },

  wizard: {
    searchLabel: "搜索:",
    randomRow: "随机",
    randomHint: "随机选一个词集",
    noMatches: "没有匹配的词集。",
    footerSet: "↑↓ 移动 · Enter 选择 · 输入文字搜索 · Esc 退出",
    footerChoice: "↑↓ 移动 · Enter 选择 · Esc 返回",
    footerConfirm: "y 应用 · n 返回 · Esc 返回",
    pickHint: "选择一个词集即可预览。",
    applyTitle: (name) => `准备应用 ${name}`,
    modeLabel: "应用方式",
    scopeLabel: "保存位置",
    applyQuestion: "要应用吗？",
    changeSettings: "用 ccverbs config 修改",
    willPickFrom: (n) => `应用后将从 ${n} 个词中随机选取。`,
    appliedTitle: (name, n, mode) => `已应用 ${name} — ${n} 个词，${mode}`,
    settingsPath: "设置文件:",
    backupPath: "备份:",
    restartHint: "新开一个 Claude Code 会话即可看到效果。",
    anyKeyToExit: "按任意键退出。",
    skippedSets: (n, ids) => `已跳过 ${n} 个格式错误的词集: ${ids}`,
    andMore: (n) => `... 还有 ${n} 个`,
  },

  modes: {
    replace: "替换",
    replaceHint: (n) => `只使用这个词集的 ${n} 个词`,
    append: "追加",
    appendHint: (base, add) => `自带 ${base} 个 ＋ 这 ${add} 个 = ${base + add} 个`,
  },

  scopes: {
    user: "全局",
    project: "当前项目",
    local: "当前项目（仅本地）",
    localNote: "不提交到 git",
  },

  list: {
    totals: (sets, verbs) =>
      `${sets} 个词集，${verbs} 个词。Claude Code 自带 ${DEFAULT_VERB_COUNT} 个。`,
    noneMatched: "没有匹配的词集。",
    byAuthor: (name) => `作者: ${name}`,
    verbTotal: (n) => `${n} 个词`,
    noTags: "无标签",
    otherLanguages: "其他语言",
  },

  apply: {
    removed: (n) => `已删除 spinnerVerbs — 回到 Claude Code 自带的 ${n} 个词`,
    dryRun: "仅预览 — 未写入任何内容。",
    needsYes: "加上 --yes 即可应用。",
  },

  current: {
    notConfigured: (n) => `spinnerVerbs 未设置 — Claude Code 使用自带的 ${n} 个词。`,
    customList: "自定义词表（与词集库中的任何词集都不匹配）",
    modeAndCount: (mode, n) => `应用方式: ${mode}  词数: ${n}`,
    willPickFrom: (n) => `将从 ${n} 个词中随机选取。`,
    andMore: (n) => `... 还有 ${n} 个`,
  },

  config: {
    title: "ccverbs 设置",
    language: "语言",
    mode: "应用方式",
    scope: "保存位置",
    resetRow: "恢复默认",
    footerList: "↑↓ 移动 · Enter 修改 · Esc 退出",
    auto: "自动",
    autoDetected: (name, source) => `识别结果: ${name}（${source}）`,
    unreviewed: "征求母语者校对",
    configLabel: "设置",
    cacheLabel: "缓存",
    saveFailed: (message) => `无法保存设置: ${message}`,
    sourceFlag: "来自 --lang",
    sourceEnv: "来自 CCVERBS_LANG",
    sourceConfig: "来自你的设置",
    sourcePosixEnv: "来自环境变量 LANG",
    sourceOs: "来自操作系统的语言设置",
    sourceIntl: "来自运行环境的区域设置",
    sourceDefault: "默认值",
    unreviewedNotice: (name) =>
      `${name} 尚未经母语者校对，欢迎提交修正: https://github.com/ryoshin0830/ccverbs`,
  },

  errors: {
    setNotFound: (id) => `没有名为 "${id}" 的词集`,
    registryUnavailable: (message) => `无法获取词集库: ${message}`,
    registryHint: "词集从 GitHub 获取，请检查网络后重试。",
    noTty: "当前环境没有可用终端，请改用一次性命令。",
    unknownCommand: (name) => `没有 ${name} 这个命令`,
    unknownOption: (name) => `没有 ${name} 这个选项`,
    unexpectedArgument: (name) => `多余的参数: ${name}`,
    invalidValue: (flag, allowed, got) =>
      `${flag} 必须是 ${allowed} 之一，收到的是 ${got}`,
    requiresArgument: (command, what) => `${command} 需要一个${what}`,
    exclusiveOptions: (a, b) => `${a} 与 ${b} 不能同时使用`,
    unknownConfigKey: (key, allowed) => `没有 "${key}" 这个设置项，应为 ${allowed} 之一`,
    configNeedsValue: (key, allowed) => `${key} 需要一个值: ${allowed} 之一`,
    writeFailed: (message) => `写入失败: ${message}`,
    noSets: "没有可用的词集",
    setId: "词集 id",
    query: "搜索词",
  },

  help: {
    tagline: "替换 Claude Code 的加载动词",
    usage: "用法: ccverbs [命令] [选项]",
    defaultLine: "打开交互界面（默认）",
    commandsHeading: "命令:",
    optionsHeading: "选项:",
    examplesHeading: "示例:",
    exitCodes:
      "退出码: 0 成功 / 1 运行错误 / 2 参数错误 / 3 词集不存在 / 4 无法获取词集库",
    footer: "词集在 https://github.com/ryoshin0830/ccverbs，欢迎提交 PR。",
    commands: {
      list: "列出所有词集",
      show: "显示一个词集的全部词",
      search: "按 id、名称、说明、标签搜索",
      set: "把一个词集应用到 Claude Code",
      random: "随机选一个词集并应用",
      current: "显示当前已应用的配置",
      reset: `删除 spinnerVerbs，恢复自带的 ${DEFAULT_VERB_COUNT} 个词`,
      config: "查看或修改设置（语言、应用方式、保存位置）",
    },
    options: {
      mode: "仅本次覆盖应用方式",
      scope: "仅本次覆盖保存位置",
      lang: "仅本次覆盖界面语言",
      json: "输出机器可读格式",
      yes: "跳过确认",
      "dry-run": "只显示差异，不写入",
      "no-backup": "不创建 .ccverbs.bak",
      refresh: "无效果 — 默认每次都重新获取",
      offline: "使用上次获取的内容，不联网",
      "no-group": "不按语言分组显示",
      help: "显示帮助",
      version: "显示版本",
    },
    examples: [
      { cmd: "ccverbs", text: "浏览并选择词集" },
      { cmd: "ccverbs config", text: "修改语言、应用方式或保存位置" },
      { cmd: "ccverbs list --json", text: "列出所有词集及词数" },
      { cmd: "ccverbs set git-commands --yes", text: "不经确认直接应用" },
      { cmd: "ccverbs random --yes", text: "随机来一个" },
      { cmd: "ccverbs current --json", text: "查看当前配置" },
      { cmd: "ccverbs reset --yes", text: "恢复自带的动词" },
    ],
  },
};
