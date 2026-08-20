import type { Catalog } from "./en";

export const ko: Catalog = {
  meta: { nativeName: "한국어", reviewed: false },

  header: {
    tagline: "Claude Code가 작업할 때 보여줄 말을 직접 고릅니다.",
    languageLabel: "표시 언어",
  },

  preview: {
    empty: "아래에 단어를 쓰면 Claude Code에서 보이는 그대로 여기 나옵니다.",
    columns: (width, max) => `${max}칸 중 ${width}칸`,
    tooWide: "40칸을 넘었습니다. 경과 시간이 화면 밖으로 밀립니다",
    pause: "멈춤",
    play: "재생",
    previous: "이전 단어",
    next: "다음 단어",
    ruler: "40",
  },

  words: {
    heading: "말을 씁니다",
    hint: "한 줄에 하나씩. 끝의 … 는 Claude Code가 붙입니다.",
    placeholder: "근력 운동 중입니다\n프로틴을 마시고 있습니다\n덤벨을 바라보고 있습니다",
    count: (n) => `${n}개 단어`,
    allClear: "모두 40칸 이내",
    toFix: (n) => `${n}개 고칠 곳`,
    empty: "목록을 붙여넣거나 입력하면 시작됩니다.",
  },

  issues: {
    "trailing-ellipsis": () => "끝의 … 는 지워주세요. Claude Code가 붙입니다.",
    "too-wide": (width) => `${width}칸입니다. 40칸으로 줄여주세요.`,
    duplicate: () => "같은 단어가 이미 있습니다.",
    "control-char": () => "제어 문자가 들어 있습니다.",
    "too-long": () => "120자를 넘었습니다.",
  },

  name: {
    heading: "이름을 붙입니다",
    nameLabel: "이름",
    namePlaceholder: "근력 운동",
    idLabel: "파일 이름",
    descriptionLabel: "한 줄 설명",
    descriptionPlaceholder: "헬스장에서 세트 사이에 중얼거리는 말",
    emojiLabel: "이모지 선택",
    emojiOther: "직접 입력",
  },

  inferred: {
    heading: "단어에서 읽어낸 것",
    change: "수정",
    hide: "닫기",
    language: "언어",
    category: "종류",
    idNote: "파일 이름은 저장소 전체에서 중복될 수 없습니다. 이미 있으면 Pull Request에서 알려줍니다.",
    languages: {
      ja: "일본어",
      en: "영어",
      "zh-Hans": "중국어 간체",
      "zh-Hant": "중국어 번체",
      ko: "한국어",
      mixed: "용어와 그 번역",
    },
    categories: {
      meme: "재미로",
      study: "저절로 외워지는 단어장",
      classic: "기본 목록 대체",
    },
  },

  optional: {
    toggle: "이름 남기기, 태그 달기",
    tagsLabel: "태그",
    tagsHint: "쉼표로 구분, 8개까지",
    authorLabel: "당신의 이름",
    githubLabel: "GitHub 아이디",
    sourceLabel: "출처",
    sourcePlaceholder: "https://",
  },

  send: {
    heading: "보냅니다",
    notReady: "위 두 단계를 채우면 버튼이 나타납니다.",
    button: "GitHub에서 Pull Request 열기",
    afterButton:
      "파일이 작성된 상태로 GitHub가 열립니다. 쓰기 권한이 없으면 먼저 fork를 권하는데, 그게 정상 경로입니다. 그다음 “Propose new file”을 누르세요.",
    tooLong: (length) => `링크에 담기에는 너무 깁니다(${length}자). 대신 복사해 주세요:`,
    tooLongStep1: "JSON을 복사합니다.",
    tooLongStep2: "새 파일 페이지를 열고 붙여넣습니다.",
    tooLongLink: "새 파일 페이지 열기",
    copy: "JSON 복사",
    copied: "복사했습니다",
    download: "다운로드",
    showJson: "파일 보기",
    charCount: (length) => `링크 ${length}자`,
  },

  errors: {
    id: {
      empty: "파일 이름이 필요합니다.",
      shape: "소문자, 숫자, 하이픈 하나로. 예: ja-gym",
    },
    name: { empty: "이름이 필요합니다.", long: "40자 이내로 해주세요." },
    emoji: { empty: "이모지를 선택해 주세요.", many: "이모지는 하나만." },
    description: { empty: "한 줄 설명이 필요합니다.", long: "120자 이내로 해주세요." },
    tags: { many: "태그는 8개까지입니다.", shape: "소문자 단어, 필요하면 하이픈." },
    source: { shape: "http(s)로 시작하는 URL, 또는 비워두기." },
    verbs: { empty: "단어를 하나 이상 넣어주세요.", many: "500개까지입니다." },
  },

  footer: {
    cli: "쓰고 싶은 세트가 정해졌다면 CLI로 바로 적용할 수 있습니다:",
    repo: "소스와 기본 제공되는 23개 세트",
  },
};
