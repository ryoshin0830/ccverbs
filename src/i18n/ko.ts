import { DEFAULT_VERB_COUNT } from "../constants.js";
import type { Catalog } from "./en.js";

export const ko: Catalog = {
  meta: {
    name: "Korean",
    nativeName: "한국어",
    reviewed: false,
  },

  common: {
    appName: "ccverbs",
    verbCount: (n) => `${n}개 단어`,
    setCount: (n) => `${n}개 세트`,
    registrySummary: (sets, verbs) =>
      `${sets}개 세트 · ${verbs}개 단어 · Claude Code 기본 ${DEFAULT_VERB_COUNT}개`,
    yesNo: "(Y/n)",
    minutesAgo: (n) => `${n}분 전`,
    justNow: "방금",
    never: "아직 가져오지 않음",
  },

  wizard: {
    searchLabel: "검색:",
    randomRow: "무작위",
    randomHint: "세트를 하나 무작위로 고릅니다",
    noMatches: "일치하는 세트가 없습니다.",
    footerSet: "↑↓ 이동 · Enter 선택 · 입력하면 검색 · Esc 종료",
    footerChoice: "↑↓ 이동 · Enter 선택 · Esc 뒤로",
    footerConfirm: "y 적용 · n 뒤로 · Esc 뒤로",
    pickHint: "세트를 고르면 미리보기가 나옵니다.",
    applyTitle: (name) => `${name} 적용`,
    modeLabel: "적용 방식",
    scopeLabel: "저장 위치",
    applyQuestion: "적용할까요?",
    changeSettings: "변경은 ccverbs config",
    willPickFrom: (n) => `적용 후 ${n}개 단어에서 골라 표시됩니다.`,
    appliedTitle: (name, n, mode) => `${name} 적용 완료 — ${n}개 단어, ${mode}`,
    settingsPath: "설정 파일:",
    backupPath: "백업:",
    restartHint: "새 Claude Code 세션을 시작하면 반영됩니다.",
    anyKeyToExit: "아무 키나 누르면 종료합니다.",
    skippedSets: (n, ids) => `형식이 잘못된 세트 ${n}개를 건너뛰었습니다: ${ids}`,
    andMore: (n) => `... 그 외 ${n}개`,
  },

  modes: {
    replace: "교체",
    replaceHint: (n) => `이 세트의 ${n}개 단어만 사용합니다`,
    append: "추가",
    appendHint: (base, add) => `기본 ${base}개 ＋ 이 ${add}개 = ${base + add}개`,
  },

  scopes: {
    user: "전체",
    project: "이 프로젝트",
    local: "이 프로젝트（로컬 전용）",
    localNote: "git에 커밋되지 않음",
  },

  list: {
    totals: (sets, verbs) =>
      `${sets}개 세트, ${verbs}개 단어. Claude Code 기본은 ${DEFAULT_VERB_COUNT}개입니다.`,
    noneMatched: "일치하는 세트가 없습니다.",
    byAuthor: (name) => `작성: ${name}`,
    verbTotal: (n) => `${n}개 단어`,
    noTags: "태그 없음",
    otherLanguages: "다른 언어",
  },

  apply: {
    removed: (n) => `spinnerVerbs를 삭제했습니다 — 기본 ${n}개 단어로 돌아갑니다`,
    dryRun: "미리보기만 — 아무것도 쓰지 않았습니다.",
    needsYes: "--yes를 붙이면 적용합니다.",
  },

  current: {
    notConfigured: (n) => `spinnerVerbs가 설정되지 않았습니다 — 기본 ${n}개 단어를 사용합니다.`,
    customList: "저장소의 어떤 세트와도 일치하지 않는 사용자 목록",
    modeAndCount: (mode, n) => `적용 방식: ${mode}  단어 수: ${n}`,
    willPickFrom: (n) => `${n}개 단어에서 골라 표시됩니다.`,
    andMore: (n) => `... 그 외 ${n}개`,
  },

  config: {
    title: "ccverbs 설정",
    language: "언어",
    mode: "적용 방식",
    scope: "저장 위치",
    resetRow: "기본값으로 되돌리기",
    footerList: "↑↓ 이동 · Enter 변경 · Esc 종료",
    auto: "자동",
    autoDetected: (name, source) => `감지 결과: ${name}（${source}）`,
    unreviewed: "원어민 검수를 구하고 있습니다",
    configLabel: "설정",
    cacheLabel: "캐시",
    saveFailed: (message) => `설정을 저장할 수 없습니다: ${message}`,
    sourceFlag: "--lang 지정",
    sourceEnv: "CCVERBS_LANG 지정",
    sourceConfig: "설정 파일",
    sourcePosixEnv: "환경 변수 LANG",
    sourceOs: "운영체제의 언어 설정",
    sourceIntl: "실행 환경의 로케일",
    sourceDefault: "기본값",
    unreviewedNotice: (name) =>
      `${name}은 원어민 검수를 받지 않았습니다. 수정 제안을 환영합니다: https://github.com/ryoshin0830/ccverbs`,
  },

  errors: {
    setNotFound: (id) => `"${id}" 세트가 없습니다`,
    registryUnavailable: (message) => `단어 세트를 가져올 수 없습니다: ${message}`,
    registryHint: "단어 세트는 GitHub에서 가져옵니다. 연결을 확인한 뒤 다시 실행하세요.",
    noTty: "대화형 화면을 띄울 터미널이 없습니다. 단일 명령을 사용하세요.",
    unknownCommand: (name) => `${name} 명령은 없습니다`,
    unknownOption: (name) => `${name} 옵션은 없습니다`,
    unexpectedArgument: (name) => `불필요한 인수입니다: ${name}`,
    invalidValue: (flag, allowed, got) =>
      `${flag}는 ${allowed} 중 하나여야 합니다. 받은 값: ${got}`,
    requiresArgument: (command, what) => `${command}에는 ${what}가 필요합니다`,
    exclusiveOptions: (a, b) => `${a}와 ${b}는 함께 쓸 수 없습니다`,
    unknownConfigKey: (key, allowed) =>
      `"${key}" 설정은 없습니다. ${allowed} 중 하나여야 합니다`,
    configNeedsValue: (key, allowed) => `${key}에는 값이 필요합니다: ${allowed} 중 하나`,
    writeFailed: (message) => `쓰지 못했습니다: ${message}`,
    noSets: "사용할 수 있는 단어 세트가 없습니다",
    setId: "세트 id",
    query: "검색어",
  },

  help: {
    tagline: "Claude Code의 진행 표시 동사를 바꿉니다",
    usage: "사용법: ccverbs [명령] [옵션]",
    defaultLine: "대화형 화면 열기（기본）",
    commandsHeading: "명령:",
    optionsHeading: "옵션:",
    examplesHeading: "예:",
    exitCodes:
      "종료 코드: 0 성공 / 1 실행 오류 / 2 인수 오류 / 3 세트 없음 / 4 저장소 가져오기 실패",
    footer: "단어 세트는 https://github.com/ryoshin0830/ccverbs 에 있습니다. PR 환영합니다.",
    commands: {
      list: "모든 단어 세트를 나열합니다",
      show: "세트의 모든 단어를 표시합니다",
      search: "id·이름·설명·태그로 검색합니다",
      set: "세트를 Claude Code에 적용합니다",
      random: "세트를 하나 무작위로 골라 적용합니다",
      current: "현재 적용된 설정을 표시합니다",
      reset: `spinnerVerbs를 삭제하고 기본 ${DEFAULT_VERB_COUNT}개로 되돌립니다`,
      config: "설정（언어·적용 방식·저장 위치）을 보거나 바꿉니다",
    },
    options: {
      mode: "이번 실행만 적용 방식을 덮어씁니다",
      scope: "이번 실행만 저장 위치를 덮어씁니다",
      lang: "이번 실행만 표시 언어를 덮어씁니다",
      json: "기계가 읽을 수 있는 형식으로 출력합니다",
      yes: "확인을 건너뜁니다",
      "dry-run": "차이만 표시하고 쓰지 않습니다",
      "no-backup": ".ccverbs.bak를 만들지 않습니다",
      refresh: "캐시를 무시하고 다시 가져옵니다",
      offline: "캐시만 쓰고 통신하지 않습니다",
      "no-group": "목록을 언어별로 묶지 않습니다",
      help: "도움말을 표시합니다",
      version: "버전을 표시합니다",
    },
    examples: [
      { cmd: "ccverbs", text: "세트를 찾아서 고릅니다" },
      { cmd: "ccverbs config", text: "언어·적용 방식·저장 위치를 바꿉니다" },
      { cmd: "ccverbs list --json", text: "모든 세트와 단어 수를 봅니다" },
      { cmd: "ccverbs set git-commands --yes", text: "확인 없이 적용합니다" },
      { cmd: "ccverbs random --yes", text: "무작위로 적용합니다" },
      { cmd: "ccverbs current --json", text: "지금 적용된 내용을 봅니다" },
      { cmd: "ccverbs reset --yes", text: "기본 동사로 되돌립니다" },
    ],
  },
};
