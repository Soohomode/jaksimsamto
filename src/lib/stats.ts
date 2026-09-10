import { prisma } from "@/lib/prisma";
import { getPartMeta } from "@/lib/parts";
import { getStreak } from "@/lib/streak";
import {
  kstDateKey,
  kstStartOfDaysAgo,
  kstStartOfToday,
  recentDateKeys,
} from "@/lib/date-kst";

export interface DayActivity {
  date: string; // YYYY-MM-DD
  attempts: number;
  correct: number;
}

export interface PartAccuracy {
  part: number;
  label: string;
  section: "LC" | "RC";
  attempts: number;
  correct: number;
  accuracy: number; // 0~1
}

export interface MasteryBuckets {
  new: number; // interval 0 / repetitions 0
  learning: number; // interval 1~6
  young: number; // interval 7~20
  mature: number; // interval >= 21
}

export interface MockPoint {
  date: string;
  estimatedScore: number;
  lcEstimated: number;
  rcEstimated: number;
}

export interface OverviewStats {
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number; // 0~1
  reviewedToday: number;
  dueToday: number;
  trackedCards: number;
  streak: number; // 연속 학습일 (임시 계산: quiz_attempts 활동일 기준)
  activity: DayActivity[]; // 최근 14일
  byPart: PartAccuracy[];
  mastery: MasteryBuckets;
  mockTrend: MockPoint[];
  weakestPart?: PartAccuracy;
}

export async function getOverviewStats(userId: string): Promise<OverviewStats> {
  const now = new Date();
  const since14 = kstStartOfDaysAgo(13, now);
  const startToday = kstStartOfToday(now);

  const [
    totalAttempts,
    totalCorrect,
    recentAttempts,
    reviewStates,
    reviewedToday,
    dueToday,
    trackedCards,
    perQuestion,
    mocks,
    streakInfo,
  ] = await Promise.all([
    prisma.quizAttempt.count({ where: { userId } }),
    prisma.quizAttempt.count({ where: { userId, isCorrect: true } }),
    prisma.quizAttempt.findMany({
      where: { userId, attemptedAt: { gte: since14 } },
      select: { attemptedAt: true, isCorrect: true },
    }),
    prisma.reviewState.findMany({
      where: { userId },
      select: { intervalDays: true, repetitions: true },
    }),
    prisma.reviewState.count({
      where: { userId, lastReviewedAt: { gte: startToday } },
    }),
    prisma.reviewState.count({
      where: { userId, nextReviewAt: { lte: now } },
    }),
    prisma.reviewState.count({ where: { userId } }),
    prisma.quizAttempt.groupBy({
      by: ["questionId", "isCorrect"],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.mockExamResult.findMany({
      where: { userId },
      orderBy: { takenAt: "asc" },
      take: 12,
    }),
    getStreak(userId),
  ]);

  // 최근 14일 활동
  const dayMap = new Map<string, DayActivity>();
  for (const key of recentDateKeys(14, now)) {
    dayMap.set(key, { date: key, attempts: 0, correct: 0 });
  }
  for (const a of recentAttempts) {
    const key = kstDateKey(a.attemptedAt);
    const d = dayMap.get(key);
    if (d) {
      d.attempts++;
      if (a.isCorrect) d.correct++;
    }
  }
  const activity = [...dayMap.values()];

  // 파트별 정확도
  const partAgg = new Map<number, { attempts: number; correct: number }>();
  const qIds = [...new Set(perQuestion.map((r) => r.questionId))];
  const qParts = await prisma.question.findMany({
    where: { id: { in: qIds } },
    select: { id: true, part: true },
  });
  const partOf = new Map(qParts.map((q) => [q.id, q.part]));
  for (const row of perQuestion) {
    const part = partOf.get(row.questionId);
    if (!part) continue;
    const cur = partAgg.get(part) ?? { attempts: 0, correct: 0 };
    cur.attempts += row._count._all;
    if (row.isCorrect) cur.correct += row._count._all;
    partAgg.set(part, cur);
  }
  const byPart: PartAccuracy[] = [...partAgg.entries()]
    .map(([part, v]) => ({
      part,
      label: getPartMeta(part)?.label ?? `Part ${part}`,
      section: (part <= 4 ? "LC" : "RC") as "LC" | "RC",
      attempts: v.attempts,
      correct: v.correct,
      accuracy: v.attempts ? v.correct / v.attempts : 0,
    }))
    .sort((a, b) => a.part - b.part);

  // 숙련도 버킷
  const mastery: MasteryBuckets = { new: 0, learning: 0, young: 0, mature: 0 };
  for (const rs of reviewStates) {
    if (rs.repetitions === 0 || rs.intervalDays === 0) mastery.new++;
    else if (rs.intervalDays < 7) mastery.learning++;
    else if (rs.intervalDays < 21) mastery.young++;
    else mastery.mature++;
  }

  const mockTrend: MockPoint[] = mocks.map((m) => ({
    date: m.takenAt.toISOString().slice(0, 10),
    estimatedScore: m.estimatedScore,
    lcEstimated: m.lcEstimated,
    rcEstimated: m.rcEstimated,
  }));

  const weakestPart = [...byPart]
    .filter((p) => p.attempts >= 3)
    .sort((a, b) => a.accuracy - b.accuracy)[0];

  return {
    totalAttempts,
    totalCorrect,
    accuracy: totalAttempts ? totalCorrect / totalAttempts : 0,
    reviewedToday,
    dueToday,
    trackedCards,
    streak: streakInfo.current,
    activity,
    byPart,
    mastery,
    mockTrend,
    weakestPart,
  };
}
