import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { pickQuizQuestions, quizTitle } from "@/lib/quiz";
import { SessionRunner } from "@/components/session-runner";

export const metadata: Metadata = { title: "연습 세션 · 작심삼토" };

export default async function PracticeSessionPage({
  searchParams,
}: PageProps<"/practice/session">) {
  const user = await requireUser();
  const sp = await searchParams;

  const part = sp.part ? Number(sp.part) : undefined;
  const onlyWrong = sp.wrong === "1";

  const questions = await pickQuizQuestions({
    part: Number.isFinite(part) ? part : undefined,
    count: 10,
    onlyWrong,
    userId: user.id,
  });

  return (
    <SessionRunner
      questions={questions}
      mode="practice"
      title={quizTitle(part, onlyWrong)}
    />
  );
}
