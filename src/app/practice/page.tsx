import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALL_PARTS } from "@/lib/parts";

export const metadata: Metadata = { title: "연습 · 작심삼토" };

export default async function PracticePage() {
  const user = await requireUser();

  const [counts, wrongCount] = await Promise.all([
    prisma.question.groupBy({
      by: ["part"],
      where: { isPublished: true },
      _count: { _all: true },
    }),
    prisma.quizAttempt
      .findMany({
        where: { userId: user.id, isCorrect: false },
        select: { questionId: true },
        distinct: ["questionId"],
      })
      .then((r) => r.length),
  ]);
  const countMap = new Map(counts.map((c) => [c.part, c._count._all]));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          연습 모드
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          파트를 골라 10문항씩 풀어요. 채점·오답 기록이 남고 복습에도 반영돼요.
        </p>
      </div>

      {wrongCount > 0 && (
        <Link
          href="/practice/session?wrong=1"
          className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-800 dark:bg-amber-950/40"
        >
          <span className="font-semibold text-amber-800 dark:text-amber-300">
            오답 다시 풀기
          </span>
          <span className="text-amber-600 dark:text-amber-400">
            {wrongCount}문항 →
          </span>
        </Link>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {ALL_PARTS.map((p) => {
          const n = countMap.get(p.part) ?? 0;
          const disabled = n === 0;
          return (
            <Link
              key={p.part}
              href={disabled ? "#" : `/practice/session?part=${p.part}`}
              aria-disabled={disabled}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
                disabled
                  ? "cursor-not-allowed border-zinc-200 opacity-50 dark:border-zinc-800"
                  : "border-zinc-200 hover:border-indigo-400 dark:border-zinc-800"
              }`}
            >
              <span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {p.label}
                </span>
                <span className="ml-1 text-xs text-zinc-400">{p.section}</span>
              </span>
              <span className="text-xs text-zinc-400">{n}문항</span>
            </Link>
          );
        })}
      </div>

      <Link
        href="/practice/session"
        className="flex h-11 items-center justify-center rounded-xl border border-zinc-300 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        전체 파트에서 랜덤 10문항
      </Link>
    </div>
  );
}
