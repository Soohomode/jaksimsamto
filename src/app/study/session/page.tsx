import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { buildStudyQueue } from "@/lib/study";
import { SessionRunner } from "@/components/session-runner";

export const metadata: Metadata = { title: "복습 세션 · 작심삼토" };

export default async function StudySessionPage() {
  const user = await requireUser();
  const questions = await buildStudyQueue(user.id, {
    dueLimit: 20,
    newLimit: 10,
  });

  return (
    <SessionRunner questions={questions} mode="review" title="오늘의 복습" />
  );
}
