"use server";

import { requireUser } from "@/lib/auth";
import { applyReview, gradeAndRecord, type GradeResult } from "@/lib/study";
import { qualityFromCorrectness, GRADE_QUALITY } from "@/lib/srs";
import type { ReviewGrade } from "@/lib/srs";

export type SessionMode = "review" | "practice";

export interface SubmitAnswerInput {
  questionId: string;
  selected: string;
  elapsedMs?: number;
  mode: SessionMode;
}

export interface SubmitAnswerResult extends GradeResult {
  /** practice 모드에서 자동 반영된 다음 복습 간격(일). review 모드면 null. */
  autoIntervalDays: number | null;
}

export async function submitAnswer(
  input: SubmitAnswerInput,
): Promise<SubmitAnswerResult> {
  const user = await requireUser();
  const source = input.mode === "review" ? "review" : "practice";

  const result = await gradeAndRecord({
    userId: user.id,
    questionId: input.questionId,
    selected: input.selected,
    elapsedMs: input.elapsedMs ?? null,
    source,
  });

  let autoIntervalDays: number | null = null;
  if (input.mode === "practice") {
    const next = await applyReview({
      userId: user.id,
      questionId: input.questionId,
      quality: qualityFromCorrectness(result.isCorrect),
    });
    autoIntervalDays = next.intervalDays;
  }

  return { ...result, autoIntervalDays };
}

export interface RateCardInput {
  questionId: string;
  grade: ReviewGrade;
}

export async function rateCard(input: RateCardInput) {
  const user = await requireUser();
  const next = await applyReview({
    userId: user.id,
    questionId: input.questionId,
    quality: GRADE_QUALITY[input.grade],
  });
  return { intervalDays: next.intervalDays };
}
