import type { Metadata } from "next";
import { createQuestionAction } from "@/app/admin/actions";
import { QuestionForm } from "@/components/question-form";

export const metadata: Metadata = { title: "문제 추가 · 관리자" };

export default function NewQuestionPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        문제 추가
      </h1>
      <QuestionForm action={createQuestionAction} submitLabel="문제 저장" />
    </div>
  );
}
