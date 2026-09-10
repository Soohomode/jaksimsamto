import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMockResult } from "@/lib/mock";

export const metadata: Metadata = { title: "모의고사 결과 · 작심삼토" };

function bar(estimated: number) {
  return Math.round((estimated / 495) * 100);
}

export default async function MockResultPage({
  params,
}: PageProps<"/mock/result/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const r = await getMockResult(id, user.id);
  if (!r) notFound();

  const rows = [
    {
      label: "LC (Listening)",
      raw: r.lcRawScore,
      estimated: r.lcEstimated,
      color: "bg-sky-500",
    },
    {
      label: "RC (Reading)",
      raw: r.rcRawScore,
      estimated: r.rcEstimated,
      color: "bg-violet-500",
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <div className="text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {r.takenAt.toLocaleString("ko-KR")}
        </p>
        <p className="mt-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          예상 총점 (추정)
        </p>
        <p className="text-6xl font-bold text-indigo-600 dark:text-indigo-400">
          {r.estimatedScore}
          <span className="text-2xl text-zinc-400"> / 990</span>
        </p>
      </div>

      <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        이 점수는 근사 환산표로 계산한 <strong>추정치</strong>예요. 실제 공식 토익
        점수와 차이가 있을 수 있으니, 회차별 흐름을 보는 용도로만 참고하세요.
      </div>

      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {row.label}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400">
                정답 {row.raw}개 · 환산 약 {row.estimated}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full ${row.color}`}
                style={{ width: `${bar(row.estimated)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {r.durationSec != null && (
        <p className="text-center text-xs text-zinc-400">
          소요 시간 {Math.floor(r.durationSec / 60)}분 {r.durationSec % 60}초
        </p>
      )}

      <div className="flex justify-center gap-3">
        <Link
          href="/practice/session?wrong=1"
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          오답 복습하기
        </Link>
        <Link
          href="/mock"
          className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          모의고사 홈
        </Link>
      </div>
    </div>
  );
}
