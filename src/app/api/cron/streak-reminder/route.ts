import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

const HOUR = 60 * 60 * 1000;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * 스트릭이 끊기기 직전인 유저에게 리마인드.
 * - 마지막 활동 후 44~56시간: 1차
 * - 56~70시간: 2차 ("곧 끊긴다")
 * Vercel Cron 등에서 주기적으로 호출 (Authorization: Bearer CRON_SECRET).
 */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = Date.now();

  // 푸시 구독이 있는 유저만 대상
  const subs = await prisma.pushSubscription.findMany({
    select: { userId: true, notifyStage: true },
  });
  const userIds = [...new Set(subs.map((s) => s.userId))];
  if (userIds.length === 0) return NextResponse.json({ checked: 0, sent: 0 });

  const stageByUser = new Map<string, number>();
  for (const s of subs) {
    stageByUser.set(
      s.userId,
      Math.max(stageByUser.get(s.userId) ?? 0, s.notifyStage),
    );
  }

  let sent = 0;

  for (const userId of userIds) {
    const streak = await prisma.userStreak.findUnique({ where: { userId } });
    if (!streak || streak.currentStreak < 1) continue;

    const [lastAttempt, lastMock] = await Promise.all([
      prisma.quizAttempt.findFirst({
        where: { userId },
        orderBy: { attemptedAt: "desc" },
        select: { attemptedAt: true },
      }),
      prisma.mockExamResult.findFirst({
        where: { userId },
        orderBy: { takenAt: "desc" },
        select: { takenAt: true },
      }),
    ]);

    const lastActivity = Math.max(
      lastAttempt?.attemptedAt.getTime() ?? 0,
      lastMock?.takenAt.getTime() ?? 0,
    );
    if (!lastActivity) continue;

    const hours = (now - lastActivity) / HOUR;
    const stage = stageByUser.get(userId) ?? 0;

    let targetStage = 0;
    let payload: { title: string; body: string } | null = null;

    if (hours >= 44 && hours < 56 && stage < 1) {
      targetStage = 1;
      payload = {
        title: `🔥 ${streak.currentStreak}일 스트릭, 아직 살아있어요`,
        body: "오늘 3문항만 풀어도 이어져요. 작심삼일로 끝내지 말기로 했잖아요.",
      };
    } else if (hours >= 56 && hours < 70 && stage < 2) {
      targetStage = 2;
      payload = {
        title: "스트릭이 오늘 끊겨요",
        body: `${streak.currentStreak}일 연속 기록이 몇 시간 뒤 리셋돼요. 지금 딱 한 세트만!`,
      };
    }

    if (payload) {
      const n = await sendPushToUser(
        userId,
        { ...payload, url: "/challenge", tag: "streak" },
        targetStage,
      );
      sent += n;
    }
  }

  return NextResponse.json({ checked: userIds.length, sent });
}
