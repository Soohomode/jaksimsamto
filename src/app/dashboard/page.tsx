import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export const metadata: Metadata = { title: "대시보드 · 작심삼토" };

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">환영해요</p>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {user.email}
          </h1>
        </div>
        <SignOutButton />
      </header>

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
