import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getOverviewStats } from "@/lib/stats";
import { getSprintView } from "@/lib/sprint";
import { getStreak } from "@/lib/streak";
import { SignOutButton } from "@/components/sign-out-button";
import { ProgressDashboard } from "@/components/progress-dashboard";
import { SprintPanel } from "@/components/sprint-panel";

export const metadata: Metadata = { title: "대시보드 · 작심삼토" };

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const user = await requireUser();
  const admin = await isAdmin();
  const { error } = await searchParams;
  const [stats, sprint, streak] = await Promise.all([
    getOverviewStats(user.id),
    getSprintView(user.id),
    getStreak(user.id),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">환영해요</p>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {user.email}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/challenge"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            챌린지
          </Link>
          {admin && (
            <Link
              href="/admin"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              관리자
            </Link>
          )}
          <SignOutButton />
        </div>
      </header>

      {error === "forbidden" && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
          관리자 권한이 필요한 페이지예요.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/study"
          className="rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            오늘의 복습 →
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            간격 반복으로 예정된 문제 풀기
          </p>
        </Link>
        <Link
          href="/practice"
          className="rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            연습 모드 →
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            파트별로 골라서 문제 풀기
          </p>
        </Link>
        <Link
          href="/mock"
          className="rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            모의고사 →
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            전체 시뮬레이션 + 예상 점수(추정)
          </p>
        </Link>
      </div>

      {stats.totalAttempts === 0 ? (
        <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            아직 푼 문제가 없어요. 연습이나 복습을 시작하면 여기에 진행도가
            쌓여요.
          </p>
          <Link
            href="/practice"
            className="mt-4 inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            첫 문제 풀러 가기
          </Link>
        </section>
      ) : (
        <ProgressDashboard stats={stats} />
      )}

      <SprintPanel
        current={sprint.current}
        next={sprint.next}
        streak={streak.current}
        compact
      />
    </div>
  );
}
