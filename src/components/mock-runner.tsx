"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { indexToChoiceKey } from "@/lib/parts";
import { asChoices } from "@/lib/question-shape";
import type { MockQuestion } from "@/lib/mock";
import { AudioPlayer } from "@/components/audio-player";
import { submitMock } from "@/app/mock/actions";

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function MockRunner({
  questions,
  lcCount,
  rcCount,
}: {
  questions: MockQuestion[];
  lcCount: number;
  rcCount: number;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const startRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = Date.now();
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const q = questions[current];
  const choices = useMemo(() => (q ? asChoices(q.choices) : []), [q]);
  const answeredCount = Object.keys(answers).length;

  const pick = (key: string) => {
    setAnswers((a) => ({ ...a, [q.id]: key }));
  };

  const doSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitMock({
        answers,
        durationSec: Math.floor((Date.now() - startRef.current) / 1000),
      });
    } catch (e) {
      setSubmitting(false);
      throw e;
    }
  }, [answers, submitting]);

  function onSubmitClick() {
    const remaining = questions.length - answeredCount;
    if (
      remaining > 0 &&
      !confirm(`아직 ${remaining}문항이 미응답이에요. 그래도 제출할까요?`)
    ) {
      return;
    }
    void doSubmit();
  }

  if (!q) {
    return (
      <div className="p-8 text-center text-sm text-zinc-500">
        문제은행에 공개된 문항이 없어요. 관리자 화면에서 먼저 문제를 추가해주세요.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
              q.section === "LC"
                ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
            }`}
          >
            {q.section}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {current + 1} / {questions.length}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
            ⏱ {fmt(elapsed)}
          </span>
          <button
            type="button"
            onClick={() => setShowGrid((s) => !s)}
            className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            답안지 ({answeredCount}/{questions.length})
          </button>
        </div>
      </div>

      {showGrid && (
        <div className="grid grid-cols-10 gap-1.5 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          {questions.map((qq, i) => (
            <button
              key={qq.id}
              type="button"
              onClick={() => {
                setCurrent(i);
                setShowGrid(false);
              }}
              className={`aspect-square rounded text-xs font-medium ${
                i === current
                  ? "bg-indigo-600 text-white"
                  : answers[qq.id]
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        {q.audioScript && (
          <div className="mb-3">
            <AudioPlayer key={q.id} script={q.audioScript} part={q.part} />
          </div>
        )}
        <p className="whitespace-pre-line text-[15px] leading-7 text-zinc-900 dark:text-zinc-100">
          {q.content}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {choices.map((choice, i) => {
            const key = indexToChoiceKey(i);
            const picked = answers[q.id] === key;
            return (
              <button
                key={i}
                type="button"
                onClick={() => pick(key)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  picked
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                }`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium disabled:opacity-40 dark:border-zinc-700"
        >
          이전
        </button>
        {current + 1 < questions.length ? (
          <button
            type="button"
            onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            다음
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmitClick}
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {submitting ? "채점 중…" : "제출하고 채점"}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onSubmitClick}
        disabled={submitting}
        className="text-center text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
      >
        지금 제출하기
      </button>

      <p className="text-center text-[11px] text-zinc-400">
        LC {lcCount}문항 · RC {rcCount}문항 · 환산 점수는 추정치입니다.
      </p>
    </div>
  );
}
