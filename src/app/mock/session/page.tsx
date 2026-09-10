import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { buildMockExam } from "@/lib/mock";
import { MockRunner } from "@/components/mock-runner";

export const metadata: Metadata = { title: "모의고사 응시 · 작심삼토" };

export default async function MockSessionPage() {
  await requireUser();
  const plan = await buildMockExam();

  if (plan.questions.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          공개된 문항이 없어서 모의고사를 만들 수 없어요.
        </p>
        <Link
          href="/mock"
          className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← 모의고사 홈
        </Link>
      </div>
    );
  }

  return (
    <MockRunner
      questions={plan.questions}
      lcCount={plan.lcCount}
      rcCount={plan.rcCount}
    />
  );
}
