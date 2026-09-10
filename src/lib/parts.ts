/**
 * 토익 파트 메타데이터.
 * Part 1~4 = LC(리스닝), Part 5~7 = RC(리딩).
 */

export type Section = "LC" | "RC";

export interface PartMeta {
  part: number;
  section: Section;
  label: string; // 한국어 표기
  englishLabel: string;
  choiceCount: number; // 보기 개수 (Part 2만 3개)
  hasAudio: boolean; // audioScript 필요 여부
  grouped: boolean; // 하나의 지문/음성에 여러 문항이 붙는 파트
  defaultType: string;
}

export const PARTS: Record<number, PartMeta> = {
  1: {
    part: 1,
    section: "LC",
    label: "Part 1 · 사진 묘사",
    englishLabel: "Photographs",
    choiceCount: 4,
    hasAudio: true,
    grouped: false,
    defaultType: "photo",
  },
  2: {
    part: 2,
    section: "LC",
    label: "Part 2 · 질의응답",
    englishLabel: "Question-Response",
    choiceCount: 3,
    hasAudio: true,
    grouped: false,
    defaultType: "qa",
  },
  3: {
    part: 3,
    section: "LC",
    label: "Part 3 · 짧은 대화",
    englishLabel: "Conversations",
    choiceCount: 4,
    hasAudio: true,
    grouped: true,
    defaultType: "conversation",
  },
  4: {
    part: 4,
    section: "LC",
    label: "Part 4 · 짧은 담화",
    englishLabel: "Talks",
    choiceCount: 4,
    hasAudio: true,
    grouped: true,
    defaultType: "talk",
  },
  5: {
    part: 5,
    section: "RC",
    label: "Part 5 · 단문 공란 채우기",
    englishLabel: "Incomplete Sentences",
    choiceCount: 4,
    hasAudio: false,
    grouped: false,
    defaultType: "incomplete-sentence",
  },
  6: {
    part: 6,
    section: "RC",
    label: "Part 6 · 장문 공란 채우기",
    englishLabel: "Text Completion",
    choiceCount: 4,
    hasAudio: false,
    grouped: true,
    defaultType: "text-completion",
  },
  7: {
    part: 7,
    section: "RC",
    label: "Part 7 · 독해",
    englishLabel: "Reading Comprehension",
    choiceCount: 4,
    hasAudio: false,
    grouped: true,
    defaultType: "reading-comprehension",
  },
};

export const ALL_PARTS = Object.values(PARTS);
export const LC_PARTS = ALL_PARTS.filter((p) => p.section === "LC");
export const RC_PARTS = ALL_PARTS.filter((p) => p.section === "RC");

export function getPartMeta(part: number): PartMeta | undefined {
  return PARTS[part];
}

export function sectionOf(part: number): Section {
  return part <= 4 ? "LC" : "RC";
}

/** "A" → 0, "B" → 1 ... */
export function choiceKeyToIndex(key: string): number {
  return key.trim().toUpperCase().charCodeAt(0) - 65;
}

/** 0 → "A", 1 → "B" ... */
export function indexToChoiceKey(index: number): string {
  return String.fromCharCode(65 + index);
}

export const CHOICE_KEYS = ["A", "B", "C", "D"] as const;
