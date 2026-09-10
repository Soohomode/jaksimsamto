"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { gradeMockExam } from "@/lib/mock";
import { touchStreak } from "@/lib/streak";
import { advanceSprint } from "@/lib/sprint";

export interface SubmitMockInput {
  answers: Record<string, string>;
  durationSec?: number;
}

export async function submitMock(input: SubmitMockInput) {
  const user = await requireUser();
  const result = await gradeMockExam({
    userId: user.id,
    answers: input.answers,
    durationSec: input.durationSec,
  });
  await touchStreak(user.id);
  await advanceSprint(user.id);
  revalidatePath("/mock");
  redirect(`/mock/result/${result.id}`);
}
