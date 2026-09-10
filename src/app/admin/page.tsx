import Link from "next/link";
import type { Metadata } from "next";
import { ALL_PARTS } from "@/lib/parts";
import { questionCountsByPart } from "@/lib/questions";

export const metadata: Metadata = { title: "관리자 · 작심삼토" };

export default async function AdminHome() {
  const counts = await questionCountsByPart();
  const total = [...counts.values()].reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          문제은행 현황
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          총 {total.toLocaleString()}문항
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ALL_PARTS.map((p) => (
          <Link
            key={p.part}
            href={`/admin/questions?part=${p.part}`}
            className="rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-indigo-400 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <p className="text-xs font-medium text-zinc-400">{p.section}</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {p.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {(counts.get(p.part) ?? 0).toLocaleString()}
            </p>
          </Link>
        ))}
      </div>

      <div>
        <Link
          href="/admin/questions/new"
          className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          + 문제 추가
        </Link>
      </div>
    </div>
  );
}
