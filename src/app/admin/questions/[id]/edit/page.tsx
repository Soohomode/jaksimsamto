import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateQuestionAction } from "@/app/admin/actions";
import { QuestionForm } from "@/components/question-form";
import { getQuestion } from "@/lib/questions";

export const metadata: Metadata = { title: "문제 수정 · 관리자" };

export default async function EditQuestionPage({
  params,
}: PageProps<"/admin/questions/[id]/edit">) {
  const { id } = await params;
  const q = await getQuestion(id);
  if (!q) notFound();

  const action = updateQuestionAction.bind(null, q.id);
  const choices = Array.isArray(q.choices) ? (q.choices as string[]) : [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        문제 수정
      </h1>
      <QuestionForm
        action={action}
        submitLabel="변경 사항 저장"
        initial={{
          part: q.part,
          type: q.type,
          content: q.content,
          choices,
          answer: q.answer,
          audioScript: q.audioScript ?? "",
          explanation: q.explanation ?? "",
          difficulty: q.difficulty,
          tags: q.tags,
          isPublished: q.isPublished,
          passageGroup: q.passageGroup ?? "",
          passageOrder: q.passageOrder,
        }}
      />
    </div>
  );
}
