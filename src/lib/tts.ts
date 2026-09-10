/**
 * 브라우저 내장 TTS(Web Speech API) 유틸.
 * 서버 오디오 저장/스트리밍 없이 클라이언트에서 즉시 합성·재생한다.
 * (CLAUDE.md 5번 가이드)
 */

export interface ScriptSegment {
  /** 화자 라벨 (예: "W", "M", "Woman", "Narrator"). 없으면 단일 화자. */
  speaker?: string;
  text: string;
}

const SPEAKER_LINE = /^\s*([A-Za-z][A-Za-z. ]{0,18}?)\s*:\s*(.+)$/;
const CHOICE_SPLIT = /(?=\([A-D]\))/g;

/**
 * audioScript 문자열을 발화 단위로 쪼갠다.
 * - "W: ... / M: ..." 형태 → 줄 단위 화자 세그먼트
 * - "(A) ... (B) ..." 형태 → 보기별 세그먼트 (+ 앞의 질문)
 * - 그 외 → 통짜 한 세그먼트
 */
export function parseScript(script: string, part?: number): ScriptSegment[] {
  const trimmed = script.trim();
  if (!trimmed) return [];

  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const hasSpeakerPrefix = lines.some((l) => SPEAKER_LINE.test(l));

  if (hasSpeakerPrefix) {
    const segments: ScriptSegment[] = [];
    for (const line of lines) {
      const m = line.match(SPEAKER_LINE);
      if (m) {
        segments.push({ speaker: m[1].trim(), text: m[2].trim() });
      } else if (segments.length > 0) {
        segments[segments.length - 1].text += " " + line;
      } else {
        segments.push({ text: line });
      }
    }
    return segments;
  }

  // Part 1·2: 보기 마커 분리
  if (/\([A-D]\)/.test(trimmed)) {
    const parts = trimmed
      .split(CHOICE_SPLIT)
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.map((text) => ({ text }));
  }

  // Part 2 질문 + 응답이 한 줄인 경우 물음표로 1차 분리
  if (part === 2 && trimmed.includes("?")) {
    const idx = trimmed.indexOf("?");
    return [
      { text: trimmed.slice(0, idx + 1).trim() },
      { text: trimmed.slice(idx + 1).trim() },
    ].filter((s) => s.text);
  }

  return [{ text: trimmed }];
}

/** 화자 라벨이 여성/남성 힌트를 갖는지. */
function speakerGender(label?: string): "f" | "m" | undefined {
  if (!label) return undefined;
  const l = label.toLowerCase();
  if (/^w|wom(a|e)n|female|f$|ms\.|mrs\./.test(l)) return "f";
  if (/^m|man|male|mr\./.test(l)) return "m";
  return undefined;
}

const FEMALE_HINTS = /female|woman|samantha|victoria|karen|moira|tessa|fiona|serena|zira|susan|linda|heera|catherine|allison|ava|joanna|salli|kimberly|amy|emma/i;
const MALE_HINTS = /male|man|daniel|alex|fred|tom|david|mark|george|james|arthur|oliver|matthew|justin|joey|brian|russell/i;

export interface VoicePlan {
  bySpeaker: Map<string, SpeechSynthesisVoice | undefined>;
  fallback: SpeechSynthesisVoice | undefined;
}

/**
 * 스크립트의 화자 목록에 브라우저 음성을 배정한다.
 * 영어 음성 우선, 성별 힌트가 있으면 맞추고, 없으면 화자별로 번갈아 배정.
 */
export function planVoices(
  segments: ScriptSegment[],
  voices: SpeechSynthesisVoice[],
): VoicePlan {
  const english = voices.filter((v) => /^en(-|_|$)/i.test(v.lang));
  const pool = english.length > 0 ? english : voices;

  const female = pool.filter((v) => FEMALE_HINTS.test(v.name));
  const male = pool.filter((v) => MALE_HINTS.test(v.name));
  const neutral = pool.filter(
    (v) => !FEMALE_HINTS.test(v.name) && !MALE_HINTS.test(v.name),
  );

  const speakers = [...new Set(segments.map((s) => s.speaker).filter(Boolean))] as string[];
  const bySpeaker = new Map<string, SpeechSynthesisVoice | undefined>();

  let altIndex = 0;
  for (const sp of speakers) {
    const g = speakerGender(sp);
    let pick: SpeechSynthesisVoice | undefined;
    if (g === "f") pick = female[0] ?? neutral[altIndex % Math.max(1, neutral.length)];
    else if (g === "m") pick = male[0] ?? neutral[altIndex % Math.max(1, neutral.length)];
    else {
      const rotation = [...neutral, ...female, ...male];
      pick = rotation[altIndex % Math.max(1, rotation.length)];
    }
    bySpeaker.set(sp, pick);
    altIndex++;
  }

  return { bySpeaker, fallback: pool[0] };
}

export const RATE_MIN = 0.75;
export const RATE_MAX = 1;
export const RATE_STEP = 0.05;
export const DEFAULT_RATE = 0.9;

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
