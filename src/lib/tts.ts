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
/** 이름으로 "고품질" 힌트를 갖는 음성 (자연스러운 신경망 음성). */
const HQ_HINTS =
  /google|natural|neural|premium|enhanced|siri|multilingual|wavenet|journey|studio|online/i;
/** 저품질(compact/eSpeak) 힌트. */
const LQ_HINTS = /compact|espeak|pico|festival/i;

/** macOS/기타 OS의 장난스러운 노벨티 음성 (TTS 학습용으로 부적합). */
const NOVELTY_VOICES = new Set(
  [
    "Albert", "Bad News", "Bahh", "Bells", "Boing", "Bubbles", "Cellos",
    "Good News", "Jester", "Junior", "Organ", "Superstar", "Trinoids",
    "Whisper", "Wobble", "Zarvox", "Ralph", "Fred", "Kathy", "Deranged",
    "Hysterical", "Pipe Organ", "Princess", "Bruce", "Agnes", "Vicki",
  ].map((n) => n.toLowerCase()),
);

/** 안정적으로 자연스러운 편의 실제 화자 음성 이름 (macOS/Windows/모바일). */
const GOOD_VOICE_HINTS =
  /samantha|alex|daniel|karen|moira|tessa|fiona|victoria|allison|ava|susan|tom|serena|kate|oliver|arthur|matilda|zira|david|mark|catherine|james|linda|heera|nora|luca|joana/i;

/**
 * 음질이 좋을 법한 순서로 정렬한다.
 * - localService === false (네트워크 음성)가 대체로 훨씬 자연스러움 (Chrome의 Google 음성 등)
 * - 이름에 고품질 힌트가 있으면 가산, compact 계열이면 감점
 */
export function voiceScore(v: SpeechSynthesisVoice): number {
  let s = 0;
  if (v.localService === false) s += 6; // 네트워크 음성 (Google 등) — 대체로 최상
  if (HQ_HINTS.test(v.name)) s += 5;
  if (GOOD_VOICE_HINTS.test(v.name)) s += 3;
  if (LQ_HINTS.test(v.name)) s -= 5;
  if (isNoveltyVoice(v.name)) s -= 20;
  if (/^en-US/i.test(v.lang)) s += 1;
  if (/^en-GB/i.test(v.lang)) s += 0.8;
  if (/^en-AU/i.test(v.lang)) s += 0.5;
  return s;
}

function isNoveltyVoice(name: string): boolean {
  const base = name.toLowerCase().replace(/\s*\(.*\)\s*$/, "").trim();
  return NOVELTY_VOICES.has(base);
}

export function rankVoices(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice[] {
  return [...voices].sort((a, b) => voiceScore(b) - voiceScore(a));
}

/** 재생에 쓸 영어 음성 목록 (품질순). 노벨티 음성은 제외. 없으면 전체. */
export function listEnglishVoices(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice[] {
  const english = voices.filter(
    (v) => /^en(-|_|$)/i.test(v.lang) && !isNoveltyVoice(v.name),
  );
  return rankVoices(english.length > 0 ? english : voices);
}

/** 화자별 피치 오프셋 (하나의 음성으로 화자를 구분해야 할 때). */
export function speakerPitch(label: string | undefined, index: number): number {
  const g = speakerGender(label);
  if (g === "m") return 0.85;
  if (g === "f") return 1.12;
  return index % 2 === 0 ? 1.05 : 0.9;
}

export function planVoices(
  segments: ScriptSegment[],
  voices: SpeechSynthesisVoice[],
  preferredVoiceURI?: string,
): VoicePlan {
  const pool = listEnglishVoices(voices);
  const preferred = preferredVoiceURI
    ? pool.find((v) => v.voiceURI === preferredVoiceURI)
    : undefined;

  const female = pool.filter((v) => FEMALE_HINTS.test(v.name));
  const male = pool.filter((v) => MALE_HINTS.test(v.name));

  const speakers = [
    ...new Set(segments.map((s) => s.speaker).filter(Boolean)),
  ] as string[];
  const bySpeaker = new Map<string, SpeechSynthesisVoice | undefined>();

  // 사용자가 음성을 골랐으면 그걸 기본으로, 다화자면 반대 성별 후보만 교체 시도
  const base = preferred ?? pool[0];

  let altIndex = 0;
  for (const sp of speakers) {
    const g = speakerGender(sp);
    let pick: SpeechSynthesisVoice | undefined = base;
    if (g === "f" && female[0]) pick = preferred && FEMALE_HINTS.test(preferred.name) ? preferred : female[0];
    else if (g === "m" && male[0]) pick = preferred && MALE_HINTS.test(preferred.name) ? preferred : male[0];
    else if (!preferred) {
      const rotation = [...pool];
      pick = rotation[altIndex % Math.max(1, rotation.length)];
    }
    bySpeaker.set(sp, pick);
    altIndex++;
  }

  return { bySpeaker, fallback: base };
}

export const RATE_MIN = 0.75;
export const RATE_MAX = 1;
export const RATE_STEP = 0.05;
export const DEFAULT_RATE = 0.9;

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}
