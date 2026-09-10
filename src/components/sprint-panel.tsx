import Link from "next/link";
import type { SprintChallenge } from "@prisma/client";
import { MISSION_LABEL, type SprintView } from "@/lib/sprint";
import { startSprint } from "@/app/challenge/actions";

function missionHref(mission: string): string {
  if (mission === "mock") return "/mock";
  if (mission === "review" || mission === "vocab") return "/study";
  return "/practice";
}

export function SprintPanel({
  current,
  next,
  streak,
  compact = false,
}: {
  current: SprintView | null;
  next: SprintChallenge | null;
  streak: number;
  compact?: boolean;
}) {
  if (!current) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          3일 스프린트
        </h2>
        {next ? (
          <>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              다음 미션: <strong>{next.title}</strong>
              {next.description ? ` — ${next.description}` : ""}
            </p>
            <form action={startSprint} className="mt-4">
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                이번 3일 시작하기
              </button>
            </form>
          </>
        ) : (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            등록된 챌린지가 없어요.
          </p>
        )}
      </section>
    );
  }

  const { challenge, progress, target, ratio, completed, expired, daysLeft } =
    current;
  const pctText = `${Math.round(ratio * 100)}%`;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
            3일 스프린트 · {MISSION_LABEL[challenge.missionType] ?? challenge.missionType}
          </p>
          <h2 className="mt-0.5 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {challenge.title}
          </h2>
        </div>
        {streak > 0 && (
          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
            🔥 {streak}일 연속
          </span>
        )}
      </div>

      {challenge.description && !compact && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {challenge.description}
        </p>
      )}

      <div className="mt-4">
        <div className="mb-1 flex items-baseline justify-between text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {progress} / {target}
          </span>
          <span className="text-xs text-zinc-400">
            {completed
              ? "완료!"
              : expired
                ? "이번 3일은 놓쳤어요"
                : daysLeft <= 1
                  ? "오늘까지"
                  : `${daysLeft}일 남음`}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full ${
              completed ? "bg-emerald-500" : expired ? "bg-zinc-400" : "bg-indigo-600"
            }`}
            style={{ width: pctText }}
          />
        </div>
      </div>

      <div className="mt-4">
        {completed ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            이번 스프린트 완주! 작심삼일이 아니라 작심삼토였네요. 다음 미션은 곧
            시작돼요.
          </p>
        ) : expired ? (
          <form action={startSprint}>
            <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
              3일마다 새로 시작해도 괜찮아요. 그게 쌓이면 완주니까요.
            </p>
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              새 스프린트 시작
            </button>
          </form>
        ) : (
          <Link
            href={missionHref(challenge.missionType)}
            className="inline-flex h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            미션 이어가기 →
          </Link>
        )}
      </div>
    </section>
  );
}
