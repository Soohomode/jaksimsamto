import Link from "next/link";
import type { Metadata } from "next";
import { ALL_PARTS, getPartMeta } from "@/lib/parts";
import { listQuestions } from "@/lib/questions";
import { deleteQuestionAction } from "@/app/admin/actions";

export const metadata: Metadata = { title: "문제은행 · 관리자" };

export default async function QuestionsPage({
  searchParams,
}: PageProps<"/admin/questions">) {
  const sp = await searchParams;
  const part = sp.part ? Number(sp.part) : undefined;
  const search = typeof sp.search === "string" ? sp.search : undefined;
  const page = sp.page ? Number(sp.page) : 1;

  const { items, total, pageCount } = await listQuestions({
    part,
    search,
    page,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          문제은행{" "}
          <span className="text-sm font-normal text-zinc-400">
            {total.toLocaleString()}문항
          </span>
        </h1>
        <Link
          href="/admin/questions/new"
          className="inline-flex h-9 items-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          + 문제 추가
        </Link>
      </div>

      <form className="flex flex-wrap gap-2" action="/admin/questions">
        <select
          name="part"
          defaultValue={part ?? ""}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">전체 파트</option>
          {ALL_PARTS.map((p) => (
            <option key={p.part} value={p.part}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          name="search"
          defaultValue={search ?? ""}
          placeholder="본문·대본·태그 검색"
          className="min-w-48 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          검색
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-2">파트</th>
              <th className="px-3 py-2">본문</th>
              <th className="px-3 py-2">정답</th>
              <th className="px-3 py-2">난이도</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-10 text-center text-zinc-400"
                >
                  아직 등록된 문제가 없어요.
                </td>
              </tr>
            )}
            {items.map((q) => (
              <tr key={q.id} className="align-top">
                <td className="whitespace-nowrap px-3 py-2.5 text-xs font-medium text-zinc-500">
                  {getPartMeta(q.part)?.label ?? `Part ${q.part}`}
                </td>
                <td className="px-3 py-2.5">
                  <span className="line-clamp-2 text-zinc-800 dark:text-zinc-200">
                    {q.content}
                  </span>
                  {q.passageGroup && (
                    <span className="mt-0.5 block text-xs text-zinc-400">
                      그룹 {q.passageGroup} #{q.passageOrder ?? "?"}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 font-semibold text-indigo-600 dark:text-indigo-400">
                  {q.answer}
                </td>
                <td className="px-3 py-2.5 text-zinc-500">{q.difficulty}</td>
                <td className="px-3 py-2.5">
                  {q.isPublished ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">
                      공개
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">비공개</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">
                  <Link
                    href={`/admin/questions/${q.id}/edit`}
                    className="text-xs font-medium text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    수정
                  </Link>
                  <form action={deleteQuestionAction} className="inline">
                    <input type="hidden" name="id" value={q.id} />
                    <button
                      type="submit"
                      className="ml-3 text-xs font-medium text-zinc-500 hover:text-red-600"
                    >
                      삭제
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams();
            if (part) params.set("part", String(part));
            if (search) params.set("search", search);
            params.set("page", String(p));
            return (
              <Link
                key={p}
                href={`/admin/questions?${params.toString()}`}
                className={
                  p === page
                    ? "rounded-md bg-indigo-600 px-2.5 py-1 font-semibold text-white"
                    : "rounded-md px-2.5 py-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
