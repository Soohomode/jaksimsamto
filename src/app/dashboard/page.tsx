import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata: Metadata = { title: "대시보드 · 작심삼토" };

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const user = await requireUser();
  const admin = await isAdmin();
  const { error } = await searchParams;

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

      <div className="grid gap-3 sm:grid-cols-2">
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
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          이번 3일 스프린트
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          챌린지 기능은 곧 여기에 붙어요. (개발 진행 순서 11단계)
        </p>
      </section>
    </div>
  );
}
