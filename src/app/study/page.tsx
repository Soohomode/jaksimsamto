import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getStudyStats } from "@/lib/study";

export const metadata: Metadata = { title: "복습 · 작심삼토" };

export default async function StudyPage() {
  const user = await requireUser();
  const stats = await getStudyStats(user.id);

  const nothingToDo = stats.dueCount === 0 && stats.newAvailable === 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          오늘의 복습
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          간격 반복(SM-2)으로 잊을 만하면 다시 꺼내 보여줘요.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "복습 예정", value: stats.dueCount, accent: true },
          { label: "새 문제", value: stats.newAvailable },
          { label: "오늘 복습함", value: stats.reviewedToday },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-xs text-zinc-400">{s.label}</p>
            <p
              className={`mt-1 text-2xl font-bold ${
                s.accent
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {nothingToDo ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          지금은 복습할 게 없어요. 오늘 몫은 끝! 연습 문제로 더 풀거나 내일 다시 와요.
        </p>
      ) : (
        <Link
          href="/study/session"
          className="flex h-12 items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          복습 시작 ({Math.min(stats.dueCount, 20) + Math.min(stats.newAvailable, 10)}문항)
        </Link>
      )}

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              연습 모드
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              파트를 골라 자유롭게 풀기 (기록은 복습에도 반영돼요)
            </p>
          </div>
          <Link
            href="/practice"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            연습하러 가기
          </Link>
        </div>
      </div>
    </div>
  );
}
