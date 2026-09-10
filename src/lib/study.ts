import { prisma } from "@/lib/prisma";
import { INITIAL_SRS, schedule } from "@/lib/srs";
import { toClientQuestion, type ClientQuestion } from "@/lib/question-shape";

export type AttemptSource = "practice" | "mock" | "review";

export { toClientQuestion, asChoices } from "@/lib/question-shape";
export type { ClientQuestion } from "@/lib/question-shape";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─────────────────────────────────────────────
// 복습(SRS) 큐
// ─────────────────────────────────────────────

export interface StudyStats {
  dueCount: number;
  newAvailable: number;
  tracked: number;
  reviewedToday: number;
}

export async function getStudyStats(userId: string): Promise<StudyStats> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [dueCount, tracked, newAvailable, reviewedToday] = await Promise.all([
    prisma.reviewState.count({
      where: { userId, nextReviewAt: { lte: now } },
    }),
    prisma.reviewState.count({ where: { userId } }),
    prisma.question.count({
      where: { isPublished: true, reviewStates: { none: { userId } } },
    }),
    prisma.reviewState.count({
      where: { userId, lastReviewedAt: { gte: startOfDay } },
    }),
  ]);

  return { dueCount, tracked, newAvailable, reviewedToday };
}

export interface QueueParams {
  dueLimit?: number;
  newLimit?: number;
}

/** 복습 예정 + 신규 문제를 섞어 학습 큐를 만든다. */
export async function buildStudyQueue(
  userId: string,
  { dueLimit = 20, newLimit = 10 }: QueueParams = {},
): Promise<ClientQuestion[]> {
  const now = new Date();

  const dueStates = await prisma.reviewState.findMany({
    where: { userId, nextReviewAt: { lte: now } },
    orderBy: { nextReviewAt: "asc" },
    take: dueLimit,
    include: { question: true },
  });

  const due = dueStates
    .filter((s) => s.question.isPublished)
    .map((s) => toClientQuestion(s.question));

  let fresh: ClientQuestion[] = [];
  if (newLimit > 0) {
    const newQuestions = await prisma.question.findMany({
      where: { isPublished: true, reviewStates: { none: { userId } } },
      orderBy: [{ part: "asc" }, { createdAt: "asc" }],
      take: newLimit,
    });
    fresh = newQuestions.map(toClientQuestion);
  }

  return [...due, ...shuffle(fresh)];
}

// ─────────────────────────────────────────────
// 채점 + 기록
// ─────────────────────────────────────────────

export interface GradeResult {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string | null;
}

/**
 * 한 문항 응답을 채점하고 quiz_attempts에 기록한다.
 * SRS 반영은 하지 않음 (applyReview 별도 호출).
 */
export async function gradeAndRecord(params: {
  userId: string;
  questionId: string;
  selected: string;
  elapsedMs?: number | null;
  source: AttemptSource;
}): Promise<GradeResult> {
  const { userId, questionId, selected, elapsedMs, source } = params;

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { answer: true, explanation: true },
  });
  if (!question) throw new Error("존재하지 않는 문제예요.");

  const isCorrect =
    selected.trim().toUpperCase() === question.answer.trim().toUpperCase();

  await prisma.quizAttempt.create({
    data: {
      userId,
      questionId,
      selected: selected.trim().toUpperCase(),
      isCorrect,
      elapsedMs: elapsedMs ?? null,
      source,
    },
  });

  return {
    isCorrect,
    correctAnswer: question.answer.trim().toUpperCase(),
    explanation: question.explanation,
  };
}

/** SRS 상태를 quality(0~5)로 갱신(upsert)한다. */
export async function applyReview(params: {
  userId: string;
  questionId: string;
  quality: number;
}) {
  const { userId, questionId, quality } = params;

  const existing = await prisma.reviewState.findUnique({
    where: { userId_questionId: { userId, questionId } },
  });

  const base = existing
    ? {
        ease: existing.ease,
        intervalDays: existing.intervalDays,
        repetitions: existing.repetitions,
        lapses: existing.lapses,
      }
    : INITIAL_SRS;

  const next = schedule(base, quality);
  const now = new Date();

  await prisma.reviewState.upsert({
    where: { userId_questionId: { userId, questionId } },
    create: {
      userId,
      questionId,
      ease: next.ease,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      lapses: next.lapses,
      nextReviewAt: next.nextReviewAt,
      lastReviewedAt: now,
    },
    update: {
      ease: next.ease,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      lapses: next.lapses,
      nextReviewAt: next.nextReviewAt,
      lastReviewedAt: now,
    },
  });

  return next;
}
