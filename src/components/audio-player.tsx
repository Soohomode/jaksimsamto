"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  DEFAULT_RATE,
  RATE_MAX,
  RATE_MIN,
  RATE_STEP,
  isSpeechSupported,
  listEnglishVoices,
  parseScript,
  planVoices,
  speakerPitch,
  type ScriptSegment,
} from "@/lib/tts";
import { getPartMeta } from "@/lib/parts";

const VOICE_STORAGE_KEY = "jaksimsamto:tts-voice";

function readVoicePref(): string {
  try {
    return localStorage.getItem(VOICE_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

/** localStorage에 저장되는 음성 선택. 같은 탭 갱신을 위해 storage 이벤트를 직접 발생시킨다. */
function usePreferredVoice(): [string, (v: string) => void] {
  const uri = useSyncExternalStore(
    (cb) => {
      window.addEventListener("storage", cb);
      return () => window.removeEventListener("storage", cb);
    },
    readVoicePref,
    () => "",
  );
  const setPref = useCallback((v: string) => {
    try {
      localStorage.setItem(VOICE_STORAGE_KEY, v);
    } catch {
      /* private mode 등 */
    }
    window.dispatchEvent(new Event("storage"));
  }, []);
  return [uri, setPref];
}

type PlayState = "idle" | "playing" | "paused";

const NO_VOICES: SpeechSynthesisVoice[] = [];
let voiceCache: SpeechSynthesisVoice[] = NO_VOICES;
let voiceCacheSig = "";

function subscribeVoices(onChange: () => void) {
  if (!isSpeechSupported()) return () => {};
  window.speechSynthesis.addEventListener("voiceschanged", onChange);
  return () =>
    window.speechSynthesis.removeEventListener("voiceschanged", onChange);
}

/** getVoices()는 매번 새 배열을 주므로 시그니처가 같으면 캐시를 재사용한다. */
function getVoicesSnapshot(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return NO_VOICES;
  const v = window.speechSynthesis.getVoices();
  const sig = v.map((x) => x.voiceURI).join("|");
  if (sig !== voiceCacheSig) {
    voiceCacheSig = sig;
    voiceCache = v;
  }
  return voiceCache;
}

function useVoices() {
  return useSyncExternalStore(
    subscribeVoices,
    getVoicesSnapshot,
    () => NO_VOICES,
  );
}

function useSpeechSupported() {
  return useSyncExternalStore(
    () => () => {},
    () => isSpeechSupported(),
    () => false,
  );
}

export function AudioPlayer({
  script,
  part,
}: {
  script: string;
  part: number;
}) {
  const voices = useVoices();
  const supported = useSpeechSupported();

  const [state, setState] = useState<PlayState>("idle");
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [showScript, setShowScript] = useState(false);
  const [voiceURI, setVoiceURI] = usePreferredVoice();

  const englishVoices = useMemo(() => listEnglishVoices(voices), [voices]);

  const cancelledRef = useRef(false);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const segments = useMemo<ScriptSegment[]>(
    () => parseScript(script, part),
    [script, part],
  );
  const meta = getPartMeta(part);

  const stopKeepAlive = () => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  };

  const hardStop = useCallback(() => {
    cancelledRef.current = true;
    stopKeepAlive();
    if (isSpeechSupported()) window.speechSynthesis.cancel();
    setState("idle");
    setActiveIdx(-1);
  }, []);

  // 언마운트 시 정지. (문항 전환 시엔 상위에서 key로 리마운트됨)
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
      if (isSpeechSupported()) window.speechSynthesis.cancel();
    };
  }, []);

  const play = useCallback(() => {
    if (!isSpeechSupported() || segments.length === 0) return;

    window.speechSynthesis.cancel();
    cancelledRef.current = false;
    setState("playing");

    const plan = planVoices(segments, voices, voiceURI || undefined);
    // 여러 화자가 같은 음성을 쓰면 피치로 구분
    const distinctVoices = new Set(
      [...plan.bySpeaker.values()].map((v) => v?.voiceURI),
    );
    const sharedVoice = plan.bySpeaker.size > 1 && distinctVoices.size <= 1;
    const speakerOrder = [
      ...new Set(segments.map((s) => s.speaker).filter(Boolean)),
    ] as string[];

    const speakFrom = (i: number) => {
      if (cancelledRef.current || i >= segments.length) {
        stopKeepAlive();
        if (!cancelledRef.current) {
          setState("idle");
          setActiveIdx(-1);
        }
        return;
      }
      const seg = segments[i];
      const u = new SpeechSynthesisUtterance(seg.text);
      u.rate = rate;
      u.lang = "en-US";
      const v = seg.speaker
        ? plan.bySpeaker.get(seg.speaker) ?? plan.fallback
        : plan.fallback;
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      }
      if (sharedVoice && seg.speaker) {
        u.pitch = speakerPitch(seg.speaker, speakerOrder.indexOf(seg.speaker));
      }
      u.onstart = () => setActiveIdx(i);
      u.onend = () => {
        if (!cancelledRef.current) speakFrom(i + 1);
      };
      u.onerror = () => {
        if (!cancelledRef.current) speakFrom(i + 1);
      };
      window.speechSynthesis.speak(u);
    };

    // Chrome 장시간 발화 중단 방지
    stopKeepAlive();
    keepAliveRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 8000);

    speakFrom(0);
  }, [segments, voices, rate, voiceURI]);

  const pause = useCallback(() => {
    if (!isSpeechSupported()) return;
    window.speechSynthesis.pause();
    setState("paused");
  }, []);

  const resume = useCallback(() => {
    if (!isSpeechSupported()) return;
    window.speechSynthesis.resume();
    setState("playing");
  }, []);

  if (!supported) {
    return (
      <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        이 브라우저는 음성 합성을 지원하지 않아요. 아래 스크립트로 대신 확인해주세요.
        <p className="mt-2 whitespace-pre-line text-amber-800 dark:text-amber-200">
          {script}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        {state === "idle" && (
          <button
            type="button"
            onClick={play}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            ▶ 듣기
          </button>
        )}
        {state === "playing" && (
          <button
            type="button"
            onClick={pause}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-700 px-3 text-sm font-semibold text-white hover:bg-zinc-600"
          >
            ❚❚ 일시정지
          </button>
        )}
        {state === "paused" && (
          <button
            type="button"
            onClick={resume}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            ▶ 이어듣기
          </button>
        )}
        {state !== "idle" && (
          <button
            type="button"
            onClick={hardStop}
            className="inline-flex h-9 items-center rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            ■ 정지
          </button>
        )}

        <label className="ml-auto flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          속도 {rate.toFixed(2)}×
          <input
            type="range"
            min={RATE_MIN}
            max={RATE_MAX}
            step={RATE_STEP}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-24 accent-indigo-600"
          />
        </label>
      </div>

      {englishVoices.length > 0 && (
        <label className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="shrink-0">음성</span>
          <select
            value={voiceURI}
            onChange={(e) => {
              setVoiceURI(e.target.value);
              hardStop();
            }}
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-950"
          >
            <option value="">자동 (추천 음성)</option>
            {englishVoices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
                {v.localService === false ? " · 온라인" : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        type="button"
        onClick={() => setShowScript((s) => !s)}
        className="mt-2 text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
      >
        {showScript ? "스크립트 숨기기" : "스크립트 보기"}
      </button>

      {showScript && (
        <div className="mt-2 space-y-1 rounded-lg bg-white p-2.5 text-sm dark:bg-zinc-950">
          {segments.map((seg, i) => (
            <p
              key={i}
              className={
                i === activeIdx
                  ? "rounded bg-indigo-100 px-1 text-zinc-900 dark:bg-indigo-950 dark:text-zinc-100"
                  : "px-1 text-zinc-600 dark:text-zinc-300"
              }
            >
              {seg.speaker && (
                <span className="font-semibold text-zinc-400">
                  {seg.speaker}:{" "}
                </span>
              )}
              {seg.text}
            </p>
          ))}
        </div>
      )}

      {voices.length === 0 && (
        <p className="mt-2 text-xs text-zinc-400">
          음성을 불러오는 중이거나 설치된 영어 음성이 없어요. 브라우저·OS에 따라
          소리가 다르게 들릴 수 있어요.
        </p>
      )}
      {meta?.section === "LC" && (
        <p className="mt-1 text-[11px] leading-4 text-zinc-400">
          ※ 브라우저 내장 음성이라 실제 시험 성우와 다릅니다. 더 자연스러운 음성을
          원하면 Chrome에서 열거나(온라인 Google 음성), Mac은 시스템 설정 → 손쉬운
          사용 → 음성 콘텐츠에서 &apos;향상된/프리미엄&apos; 영어 음성을
          내려받으세요.
        </p>
      )}
    </div>
  );
}
