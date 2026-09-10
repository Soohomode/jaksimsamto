import Link from "next/link";
import { getUser } from "@/lib/auth";

export default async function Home() {
  const user = await getUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-20 dark:bg-black">
      <main className="flex w-full max-w-xl flex-col items-center gap-8 text-center">
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          3일 스프린트 토익 챌린지
        </span>

        <h1 className="text-4xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          작심삼일도
          <br />
          10번이면 한 달
        </h1>

        <p className="max-w-md text-base leading-7 text-zinc-600 dark:text-zinc-400">
          의지가 오래 못 가도 괜찮아요. 3일씩 짧게 끊어서 단어·문법·모의고사를
          끝내고, 그게 쌓이면 완주가 됩니다. 포기도 습관, 완주도 습관이니까요.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          {user ? (
            <Link
              href="/dashboard"
              className="flex h-12 items-center justify-center rounded-full bg-indigo-600 px-8 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              대시보드로 이동
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="flex h-12 items-center justify-center rounded-full bg-indigo-600 px-8 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                무료로 시작하기
              </Link>
              <Link
                href="/login"
                className="flex h-12 items-center justify-center rounded-full border border-zinc-300 px-8 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                로그인
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
