import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  MOCK_LC_TARGET,
  MOCK_RC_TARGET,
  listMockResults,
} from "@/lib/mock";

export const metadata: Metadata = { title: "모의고사 · 작심삼토" };

export default async function MockPage() {
  const user = await requireUser();

  const [counts, results] = await Promise.all([
    prisma.question.groupBy({
      by: ["part"],
      where: { isPublished: true },
      _count: { _all: true },
    }),
    listMockResults(user.id),
  ]);
  const lcAvail = counts
    .filter((c) => c.part <= 4)
    .reduce((s, c) => s + c._count._all, 0);
  const rcAvail = counts
    .filter((c) => c.part >= 5)
    .reduce((s, c) => s + c._count._all, 0);
  const below = lcAvail < MOCK_LC_TARGET || rcAvail < MOCK_RC_TARGET;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          모의고사
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          LC {MOCK_LC_TARGET} + RC {MOCK_RC_TARGET}문항을 한 번에 풀고 예상 점수를
          확인해요.
        </p>
      </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        <strong>환산 점수는 추정치예요.</strong> 근사 환산표로 계산하며 실제 공식
        토익 점수와 다를 수 있어요. 실력 흐름을 보는 참고용으로 사용하세요.
      </div>

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500 dark:text-zinc-400">
            현재 문제은행
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            LC {lcAvail} · RC {rcAvail}
          </span>
        </div>
        {below && (
          <p className="mt-2 text-xs text-zinc-400">
            아직 {MOCK_LC_TARGET}+{MOCK_RC_TARGET}문항에 못 미쳐서, 있는 문항으로만
            축소된 모의고사가 생성돼요.
          </p>
        )}
      </div>

      <Link
        href="/mock/session"
        className="flex h-12 items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        모의고사 시작
      </Link>

      {results.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            지난 응시 기록
          </h2>
          <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {results.map((r) => (
              <Link
                key={r.id}
                href={`/mock/result/${r.id}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <span className="text-zinc-500 dark:text-zinc-400">
                  {r.takenAt.toLocaleDateString("ko-KR")}
                </span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  약 {r.estimatedScore}점
                  <span className="ml-2 text-xs font-normal text-zinc-400">
                    LC {r.lcEstimated} · RC {r.rcEstimated}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
