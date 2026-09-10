import type { SprintChallenge } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

export type MissionType = "vocab" | "quiz" | "mock" | "review";

export const MISSION_LABEL: Record<string, string> = {
  vocab: "단어 복습",
  review: "복습",
  quiz: "문제 풀이",
  mock: "모의고사",
};

export interface SprintView {
  challenge: SprintChallenge;
  progress: number;
  target: number;
  ratio: number; // 0~1
  completed: boolean;
  completedAt: Date | null;
  startedAt: Date;
  endsAt: Date;
  daysLeft: number;
  expired: boolean; // 기한 지났는데 미완료
}

async function activeChallenges(): Promise<SprintChallenge[]> {
  return prisma.sprintChallenge.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: "asc" },
  });
}

/** 한 미션의 진행량을 startedAt 이후 활동으로 센다. */
async function countProgress(
  userId: string,
  mission: string,
  startedAt: Date,
): Promise<number> {
  if (mission === "mock") {
    return prisma.mockExamResult.count({
      where: { userId, takenAt: { gte: startedAt } },
    });
  }
  if (mission === "review" || mission === "vocab") {
    return prisma.quizAttempt.count({
      where: { userId, source: "review", attemptedAt: { gte: startedAt } },
    });
  }
  // quiz: 연습·복습 문제 풀이 전부
  return prisma.quizAttempt.count({
    where: {
      userId,
      source: { in: ["practice", "review"] },
      attemptedAt: { gte: startedAt },
    },
  });
}

function toView(
  challenge: SprintChallenge,
  startedAt: Date,
  completedAt: Date | null,
  progress: number,
): SprintView {
  const endsAt = new Date(startedAt.getTime() + challenge.dayRange * DAY_MS);
  const now = Date.now();
  const target = challenge.targetCount;
  const completed = completedAt != null || progress >= target;
  const expired = !completed && now > endsAt.getTime();
  const daysLeft = Math.max(
    0,
    Math.ceil((endsAt.getTime() - now) / DAY_MS),
  );
  return {
    challenge,
    progress: Math.min(progress, target),
    target,
    ratio: target > 0 ? Math.min(1, progress / target) : 0,
    completed,
    completedAt,
    startedAt,
    endsAt,
    daysLeft,
    expired,
  };
}

/**
 * 활동 직후 호출. 활성 스프린트를 보장하고 진행/완료를 갱신한다.
 * 반환: 현재 스프린트 뷰 (없으면 null).
 */
export async function advanceSprint(userId: string): Promise<SprintView | null> {
  const challenges = await activeChallenges();
  if (challenges.length === 0) return null;

  const progresses = await prisma.userSprintProgress.findMany({
    where: { userId },
  });
  const byChallenge = new Map(progresses.map((p) => [p.challengeId, p]));

  // 활성 = 미완료 + 기한 내
  const now = Date.now();
  let active = progresses.find((p) => {
    const ch = challenges.find((c) => c.id === p.challengeId);
    if (!ch || p.completedAt) return false;
    return now <= p.startedAt.getTime() + ch.dayRange * DAY_MS;
  });

  if (!active) {
    // 다음 챌린지: 완료 개수를 기준으로 순환
    const completedCount = progresses.filter((p) => p.completedAt).length;
    const nextChallenge = challenges[completedCount % challenges.length];
    const existing = byChallenge.get(nextChallenge.id);
    active = existing
      ? await prisma.userSprintProgress.update({
          where: { id: existing.id },
          data: { startedAt: new Date(), progress: 0, completedAt: null },
        })
      : await prisma.userSprintProgress.create({
          data: { userId, challengeId: nextChallenge.id },
        });
  }

  const challenge = challenges.find((c) => c.id === active.challengeId)!;
  const progress = await countProgress(
    userId,
    challenge.missionType,
    active.startedAt,
  );

  let completedAt = active.completedAt;
  if (!completedAt && progress >= challenge.targetCount) {
    completedAt = new Date();
    await prisma.userSprintProgress.update({
      where: { id: active.id },
      data: { completedAt, progress: challenge.targetCount },
    });
  } else if (progress !== active.progress) {
    await prisma.userSprintProgress.update({
      where: { id: active.id },
      data: { progress: Math.min(progress, challenge.targetCount) },
    });
  }

  return toView(challenge, active.startedAt, completedAt, progress);
}

/** 읽기 전용. 활성 스프린트가 없으면 다음 챌린지 미리보기를 반환. */
export async function getSprintView(userId: string): Promise<{
  current: SprintView | null;
  next: SprintChallenge | null;
  completedCount: number;
}> {
  const challenges = await activeChallenges();
  if (challenges.length === 0)
    return { current: null, next: null, completedCount: 0 };

  const progresses = await prisma.userSprintProgress.findMany({
    where: { userId },
  });
  const completedCount = progresses.filter((p) => p.completedAt).length;
  const now = Date.now();

  const activeRow = progresses.find((p) => {
    const ch = challenges.find((c) => c.id === p.challengeId);
    if (!ch || p.completedAt) return false;
    return now <= p.startedAt.getTime() + ch.dayRange * DAY_MS;
  });

  if (!activeRow) {
    const next = challenges[completedCount % challenges.length];
    return { current: null, next, completedCount };
  }

  const challenge = challenges.find((c) => c.id === activeRow.challengeId)!;
  const progress = await countProgress(
    userId,
    challenge.missionType,
    activeRow.startedAt,
  );
  return {
    current: toView(
      challenge,
      activeRow.startedAt,
      activeRow.completedAt,
      progress,
    ),
    next: null,
    completedCount,
  };
}

/** 최근 완료한 스프린트 목록. */
export function listCompletedSprints(userId: string) {
  return prisma.userSprintProgress.findMany({
    where: { userId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take: 10,
    include: { challenge: true },
  });
}
