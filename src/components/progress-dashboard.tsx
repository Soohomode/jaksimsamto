import Link from "next/link";
import type { OverviewStats } from "@/lib/stats";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 ${className}`}
    >
      {children}
    </div>
  );
}

function ActivityChart({ activity }: { activity: OverviewStats["activity"] }) {
  const max = Math.max(1, ...activity.map((d) => d.attempts));
  return (
    <div className="flex items-end gap-1" style={{ height: 72 }}>
      {activity.map((d) => {
        const h = (d.attempts / max) * 100;
        const correctH = d.attempts ? (d.correct / d.attempts) * h : 0;
        return (
          <div
            key={d.date}
            title={`${d.date} · ${d.attempts}문항 (정답 ${d.correct})`}
            className="flex flex-1 flex-col justify-end"
            style={{ height: "100%" }}
          >
            <div
              className="w-full rounded-sm bg-zinc-200 dark:bg-zinc-800"
              style={{ height: `${h}%`, minHeight: d.attempts ? 3 : 0 }}
            >
              <div
                className="w-full rounded-sm bg-indigo-500"
                style={{ height: `${h ? (correctH / h) * 100 : 0}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const MASTERY_META = [
  { key: "new", label: "새 문제", color: "bg-zinc-300 dark:bg-zinc-700" },
  { key: "learning", label: "학습 중", color: "bg-amber-400" },
  { key: "young", label: "익숙", color: "bg-sky-400" },
  { key: "mature", label: "숙달", color: "bg-emerald-500" },
] as const;

function MasteryBar({ mastery }: { mastery: OverviewStats["mastery"] }) {
  const total =
    mastery.new + mastery.learning + mastery.young + mastery.mature || 1;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full">
        {MASTERY_META.map((m) => {
          const v = mastery[m.key];
          if (!v) return null;
          return (
            <div
              key={m.key}
              className={m.color}
              style={{ width: `${(v / total) * 100}%` }}
            />
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
        {MASTERY_META.map((m) => (
          <span key={m.key} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${m.color}`} />
            {m.label} {mastery[m.key]}
          </span>
        ))}
      </div>
    </div>
  );
}

function MockTrend({ points }: { points: OverviewStats["mockTrend"] }) {
  if (points.length === 0) return null;
  const latest = points[points.length - 1];

  if (points.length === 1) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        최근 모의고사 예상 점수{" "}
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          약 {latest.estimatedScore}점
        </span>{" "}
        (추정) · 한 번 더 보면 추이가 그려져요.
      </p>
    );
  }

  const w = 280;
  const h = 60;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const scores = points.map((p) => p.estimatedScore);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const span = max - min || 1;
  const ys = scores.map((s) => h - ((s - min) / span) * (h - 10) - 5);
  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height: 60 }}
      >
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="text-indigo-500"
        />
        {xs.map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={ys[i]}
            r={2.5}
            className="fill-indigo-500"
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-zinc-400">
        <span>{points[0].estimatedScore}점</span>
        <span className="font-semibold text-zinc-700 dark:text-zinc-200">
          최근 {latest.estimatedScore}점 (추정)
        </span>
      </div>
    </div>
  );
}

export function ProgressDashboard({ stats }: { stats: OverviewStats }) {
  return (
    <div className="flex flex-col gap-4">
      {/* 요약 3개 */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <p className="text-xs text-zinc-400">전체 정답률</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {stats.totalAttempts ? pct(stats.accuracy) : "—"}
          </p>
          <p className="text-xs text-zinc-400">
            {stats.totalCorrect}/{stats.totalAttempts}문항
          </p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-400">연속 학습</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {stats.streak}일
          </p>
          <p className="text-xs text-zinc-400">3일마다 한 스프린트</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-400">오늘 복습</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {stats.reviewedToday}
          </p>
          <p className="text-xs text-zinc-400">예정 {stats.dueToday}개</p>
        </Card>
      </div>

      {/* 활동 */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            최근 2주 활동
          </h3>
          <span className="text-xs text-zinc-400">막대 = 푼 문항, 채움 = 정답</span>
        </div>
        <ActivityChart activity={stats.activity} />
      </Card>

      {/* 파트별 정답률 */}
      {stats.byPart.length > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            파트별 정답률
          </h3>
          <div className="flex flex-col gap-2.5">
            {stats.byPart.map((p) => (
              <div key={p.part}>
                <div className="mb-1 flex items-baseline justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {p.label}
                  </span>
                  <span className="text-zinc-400">
                    {pct(p.accuracy)} · {p.attempts}문항
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className={
                      p.section === "LC" ? "h-full bg-sky-500" : "h-full bg-violet-500"
                    }
                    style={{ width: pct(p.accuracy) }}
                  />
                </div>
              </div>
            ))}
          </div>
          {stats.weakestPart && (
            <Link
              href={`/practice/session?part=${stats.weakestPart.part}`}
              className="mt-3 inline-block text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              가장 약한 {stats.weakestPart.label} 집중 연습하기 →
            </Link>
          )}
        </Card>
      )}

      {/* 복습 숙련도 */}
      {stats.trackedCards > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            복습 숙련도{" "}
            <span className="text-xs font-normal text-zinc-400">
              {stats.trackedCards}문항 추적 중
            </span>
          </h3>
          <MasteryBar mastery={stats.mastery} />
        </Card>
      )}

      {/* 모의고사 추이 */}
      {stats.mockTrend.length > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            모의고사 예상 점수 추이{" "}
            <span className="text-xs font-normal text-zinc-400">(추정치)</span>
          </h3>
          <MockTrend points={stats.mockTrend} />
        </Card>
      )}
    </div>
  );
}
