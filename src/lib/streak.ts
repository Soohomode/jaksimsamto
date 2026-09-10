import { prisma } from "@/lib/prisma";
import { kstDateKey } from "@/lib/date-kst";

export interface StreakInfo {
  current: number;
  longest: number;
  lastCompletedDate: string | null; // YYYY-MM-DD (KST)
  activeToday: boolean;
}

/** date(@db.Date)를 KST 날짜 키 문자열로. Prisma는 UTC 자정 Date로 준다. */
function dateColToKey(d: Date | null): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

export async function getStreak(userId: string): Promise<StreakInfo> {
  const row = await prisma.userStreak.findUnique({ where: { userId } });
  const todayKey = kstDateKey(new Date());

  if (!row) {
    return { current: 0, longest: 0, lastCompletedDate: null, activeToday: false };
  }

  const lastKey = dateColToKey(row.lastCompletedDate);
  // 마지막 활동일이 어제도 오늘도 아니면 스트릭은 이미 끊긴 상태 (표시상 0)
  const yesterdayKey = kstDateKey(new Date(Date.now() - 86400000));
  const stillAlive = lastKey === todayKey || lastKey === yesterdayKey;

  return {
    current: stillAlive ? row.currentStreak : 0,
    longest: row.longestStreak,
    lastCompletedDate: lastKey,
    activeToday: lastKey === todayKey,
  };
}

/**
 * 학습 활동이 있을 때 호출. 하루 1회만 스트릭을 갱신한다.
 * - 오늘 이미 기록됨 → 그대로
 * - 어제 기록됨 → current + 1
 * - 그 이전이거나 최초 → current = 1
 */
export async function touchStreak(userId: string): Promise<void> {
  const now = new Date();
  const todayKey = kstDateKey(now);
  const yesterdayKey = kstDateKey(new Date(now.getTime() - 86400000));
  // @db.Date 컬럼에는 UTC 자정 Date를 넣는다.
  const todayDate = new Date(`${todayKey}T00:00:00.000Z`);

  const row = await prisma.userStreak.findUnique({ where: { userId } });

  if (!row) {
    await prisma.userStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastCompletedDate: todayDate,
      },
    });
    return;
  }

  const lastKey = dateColToKey(row.lastCompletedDate);
  if (lastKey === todayKey) return; // 오늘 이미 반영됨

  const next = lastKey === yesterdayKey ? row.currentStreak + 1 : 1;

  await prisma.$transaction([
    prisma.userStreak.update({
      where: { userId },
      data: {
        currentStreak: next,
        longestStreak: Math.max(next, row.longestStreak),
        lastCompletedDate: todayDate,
      },
    }),
    // 오늘 활동했으니 리마인더 단계 초기화
    prisma.pushSubscription.updateMany({
      where: { userId, notifyStage: { gt: 0 } },
      data: { notifyStage: 0 },
    }),
  ]);
}
