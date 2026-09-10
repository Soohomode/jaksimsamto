"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getPartMeta, indexToChoiceKey } from "@/lib/parts";
import { asChoices, type ClientQuestion } from "@/lib/question-shape";
import { GRADE_LABEL, type ReviewGrade } from "@/lib/srs";
import {
  rateCard,
  submitAnswer,
  type SessionMode,
  type SubmitAnswerResult,
} from "@/app/study/actions";

type Phase = "answering" | "feedback" | "done";

const GRADES: ReviewGrade[] = ["again", "hard", "good", "easy"];
const GRADE_STYLE: Record<ReviewGrade, string> = {
  again: "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:text-red-300",
  hard: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300",
  good: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
  easy: "bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-950 dark:text-sky-300",
};

export function SessionRunner({
  questions,
  mode,
  title,
}: {
  questions: ClientQuestion[];
  mode: SessionMode;
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>(
    questions.length === 0 ? "done" : "answering",
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitAnswerResult | null>(null);
  const [pending, setPending] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [correctCount, setCorrectCount] = useState(0);

  const q = questions[index];
  const meta = q ? getPartMeta(q.part) : undefined;
  const choices = useMemo(() => (q ? asChoices(q.choices) : []), [q]);

  async function onSubmit() {
    if (!q || selected === null || pending) return;
    setPending(true);
    try {
      const r = await submitAnswer({
        questionId: q.id,
        selected,
        elapsedMs: Date.now() - startedAt,
        mode,
      });
      setResult(r);
      if (r.isCorrect) setCorrectCount((c) => c + 1);
      setPhase("feedback");
    } finally {
      setPending(false);
    }
  }

  function goNext() {
    if (index + 1 >= questions.length) {
      setPhase("done");
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setResult(null);
    setStartedAt(Date.now());
    setPhase("answering");
  }

  async function onRate(grade: ReviewGrade) {
    if (!q || pending) return;
    setPending(true);
    try {
      await rateCard({ questionId: q.id, grade });
      goNext();
    } finally {
      setPending(false);
    }
  }

  if (phase === "done") {
    const total = questions.length;
    const pct = total ? Math.round((correctCount / total) * 100) : 0;
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {total === 0 ? "지금은 풀 문제가 없어요" : "세션 완료!"}
        </h1>
        {total > 0 && (
          <>
            <p className="text-5xl font-bold text-indigo-600 dark:text-indigo-400">
              {correctCount}
              <span className="text-2xl text-zinc-400"> / {total}</span>
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              정답률 {pct}% · {mode === "review" ? "복습" : "연습"} 기록이 저장됐어요.
            </p>
          </>
        )}
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          오늘 여기까지 온 것만으로 충분해요. 3일 중 하루, 잘 채웠어요.
        </p>
        <div className="flex gap-3">
          <Link
            href="/study"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            복습으로
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            대시보드
          </Link>
        </div>
      </div>
    );
  }

  if (!q) return null;

  const progress =
    ((index + (phase === "feedback" ? 1 : 0)) / questions.length) * 100;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-8">
      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span className="font-medium">{title}</span>
        <span>
          {index + 1} / {questions.length}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-xs font-medium text-zinc-400">{meta?.label}</p>

        {q.audioScript && (
          <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            <p className="mb-1 text-xs font-semibold text-zinc-400">
              🔊 음성 스크립트 (TTS 재생은 8단계에서 연결)
            </p>
            <p className="whitespace-pre-line">{q.audioScript}</p>
          </div>
        )}

        <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-zinc-900 dark:text-zinc-100">
          {q.content}
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {choices.map((choice, i) => {
            const key = indexToChoiceKey(i);
            const isPicked = selected === key;
            const isAnswer =
              phase === "feedback" && result?.correctAnswer === key;
            const isWrongPick =
              phase === "feedback" && isPicked && !result?.isCorrect;

            return (
              <button
                key={i}
                type="button"
                disabled={phase === "feedback" || pending}
                onClick={() => setSelected(key)}
                className={[
                  "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                  isAnswer
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                    : isWrongPick
                      ? "border-red-500 bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200"
                      : isPicked
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600",
                ].join(" ")}
              >
                {choice}
              </button>
            );
          })}
        </div>

        {phase === "feedback" && result && (
          <div className="mt-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
            <p
              className={
                result.isCorrect
                  ? "text-sm font-semibold text-emerald-600 dark:text-emerald-400"
                  : "text-sm font-semibold text-red-600 dark:text-red-400"
              }
            >
              {result.isCorrect ? "정답이에요 🎉" : `아쉬워요. 정답은 (${result.correctAnswer})`}
            </p>
            {result.explanation && (
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {result.explanation}
              </p>
            )}
          </div>
        )}
      </div>

      {phase === "answering" && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={selected === null || pending}
          className="h-12 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {pending ? "채점 중…" : "제출"}
        </button>
      )}

      {phase === "feedback" && mode === "practice" && (
        <button
          type="button"
          onClick={goNext}
          disabled={pending}
          className="h-12 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {index + 1 >= questions.length ? "결과 보기" : "다음 문제"}
        </button>
      )}

      {phase === "feedback" && mode === "review" && (
        <div>
          <p className="mb-2 text-center text-xs text-zinc-400">
            얼마나 쉽게 떠올렸나요?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {GRADES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onRate(g)}
                disabled={pending}
                className={`rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50 ${GRADE_STYLE[g]}`}
              >
                {GRADE_LABEL[g]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
