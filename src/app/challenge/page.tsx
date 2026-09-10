import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getSprintView, listCompletedSprints, MISSION_LABEL } from "@/lib/sprint";
import { getStreak } from "@/lib/streak";
import { SprintPanel } from "@/components/sprint-panel";
import { PushToggle } from "@/components/push-toggle";

export const metadata: Metadata = { title: "3일 스프린트 · 작심삼토" };

export default async function ChallengePage() {
  const user = await requireUser();
  const [{ current, next, completedCount }, streak, completed] =
    await Promise.all([
      getSprintView(user.id),
      getStreak(user.id),
      listCompletedSprints(user.id),
    ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          3일 스프린트 챌린지
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          작심삼일도 10번이면 한 달. 3일씩 끊어서 미션을 완주해요.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {streak.current}
          </p>
          <p className="text-xs text-zinc-400">연속 학습일</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {streak.longest}
          </p>
          <p className="text-xs text-zinc-400">최장 기록</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {completedCount}
          </p>
          <p className="text-xs text-zinc-400">완주한 스프린트</p>
        </div>
      </div>

      <SprintPanel current={current} next={next} streak={streak.current} />

      <PushToggle />

      {completed.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            완주 기록
          </h2>
          <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {completed.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="text-zinc-700 dark:text-zinc-300">
                  {c.challenge.title}
                  <span className="ml-2 text-xs text-zinc-400">
                    {MISSION_LABEL[c.challenge.missionType] ??
                      c.challenge.missionType}
                  </span>
                </span>
                <span className="text-xs text-zinc-400">
                  {c.completedAt?.toLocaleDateString("ko-KR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
