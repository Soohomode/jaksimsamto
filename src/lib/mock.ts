import { prisma } from "@/lib/prisma";
import { toClientQuestion, type ClientQuestion } from "@/lib/question-shape";

/**
 * 모의고사: LC 100 + RC 100 시뮬레이션.
 * 환산 점수는 공식 점수가 아닌 "추정치"다. UI에 항상 명시할 것.
 */

export const MOCK_LC_TARGET = 100;
export const MOCK_RC_TARGET = 100;

/** 100문항 기준 정답 개수 → 환산 점수(5~495) 근사표. 표 사이 값은 선형 보간. */
const LC_TABLE: [number, number][] = [
  [0, 5], [5, 15], [10, 25], [15, 40], [20, 55], [25, 70], [30, 90],
  [35, 110], [40, 135], [45, 160], [50, 190], [55, 215], [60, 240],
  [65, 265], [70, 290], [75, 320], [80, 350], [85, 385], [90, 420],
  [95, 455], [100, 495],
];
const RC_TABLE: [number, number][] = [
  [0, 5], [5, 15], [10, 30], [15, 45], [20, 60], [25, 75], [30, 95],
  [35, 115], [40, 135], [45, 160], [50, 185], [55, 210], [60, 240],
  [65, 270], [70, 300], [75, 330], [80, 360], [85, 395], [90, 430],
  [95, 465], [100, 495],
];

function interpolate(table: [number, number][], x: number): number {
  const clamped = Math.max(0, Math.min(100, x));
  for (let i = 0; i < table.length - 1; i++) {
    const [x0, y0] = table[i];
    const [x1, y1] = table[i + 1];
    if (clamped >= x0 && clamped <= x1) {
      const t = x1 === x0 ? 0 : (clamped - x0) / (x1 - x0);
      return Math.round(y0 + t * (y1 - y0));
    }
  }
  return table[table.length - 1][1];
}

/** 정답 개수(raw) / 총문항(total) → 환산 점수 추정치. */
export function estimateScaled(
  section: "LC" | "RC",
  raw: number,
  total: number,
): number {
  if (total <= 0) return 5;
  const pct = (raw / total) * 100;
  const scaled = interpolate(section === "LC" ? LC_TABLE : RC_TABLE, pct);
  return Math.max(5, Math.min(495, Math.round(scaled / 5) * 5));
}

export interface MockQuestion extends ClientQuestion {
  section: "LC" | "RC";
  index: number; // 1부터
}

export interface MockPlan {
  questions: MockQuestion[];
  lcCount: number;
  rcCount: number;
  belowTarget: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 모의고사 문항 세트를 만든다.
 * 문제은행이 부족하면 있는 만큼만 (belowTarget=true).
 * 그룹(passageGroup) 문항은 세트를 붙여서 유지.
 */
export async function buildMockExam(): Promise<MockPlan> {
  const all = await prisma.question.findMany({
    where: { isPublished: true },
    orderBy: [{ passageGroup: "asc" }, { passageOrder: "asc" }],
  });

  const pickSection = (isLc: boolean, target: number): ClientQuestion[] => {
    const pool = all.filter((q) => (q.part <= 4) === isLc);
    const groups = new Map<string, typeof pool>();
    const singles: (typeof pool)[number][] = [];
    for (const q of pool) {
      if (q.passageGroup) {
        const g = groups.get(q.passageGroup) ?? [];
        g.push(q);
        groups.set(q.passageGroup, g);
      } else singles.push(q);
    }
    const units = shuffle<(typeof pool)[number][]>([
      ...singles.map((q) => [q]),
      ...[...groups.values()],
    ]);
    const out: ClientQuestion[] = [];
    for (const unit of units) {
      if (out.length >= target) break;
      for (const q of unit) out.push(toClientQuestion(q));
    }
    return out;
  };

  const lc = pickSection(true, MOCK_LC_TARGET);
  const rc = pickSection(false, MOCK_RC_TARGET);

  const questions: MockQuestion[] = [
    ...lc.map((q, i) => ({ ...q, section: "LC" as const, index: i + 1 })),
    ...rc.map((q, i) => ({
      ...q,
      section: "RC" as const,
      index: lc.length + i + 1,
    })),
  ];

  return {
    questions,
    lcCount: lc.length,
    rcCount: rc.length,
    belowTarget: lc.length < MOCK_LC_TARGET || rc.length < MOCK_RC_TARGET,
  };
}

export interface MockGradeInput {
  userId: string;
  /** questionId → 선택한 보기 키 (A/B/C/D). 미응답이면 없음. */
  answers: Record<string, string>;
  durationSec?: number;
}

export async function gradeMockExam(input: MockGradeInput) {
  const ids = Object.keys(input.answers);
  const questions = await prisma.question.findMany({
    where: { id: { in: ids } },
    select: { id: true, part: true, answer: true },
  });

  let lcRaw = 0;
  let rcRaw = 0;
  let lcTotal = 0;
  let rcTotal = 0;

  const attempts = questions.map((q) => {
    const selected = (input.answers[q.id] ?? "").trim().toUpperCase();
    const isCorrect = selected === q.answer.trim().toUpperCase();
    if (q.part <= 4) {
      lcTotal++;
      if (isCorrect) lcRaw++;
    } else {
      rcTotal++;
      if (isCorrect) rcRaw++;
    }
    return {
      userId: input.userId,
      questionId: q.id,
      selected: selected || "-",
      isCorrect,
      source: "mock" as const,
    };
  });

  const lcEstimated = estimateScaled("LC", lcRaw, lcTotal);
  const rcEstimated = estimateScaled("RC", rcRaw, rcTotal);
  const estimatedScore = lcEstimated + rcEstimated;

  const [result] = await prisma.$transaction([
    prisma.mockExamResult.create({
      data: {
        userId: input.userId,
        lcRawScore: lcRaw,
        rcRawScore: rcRaw,
        lcEstimated,
        rcEstimated,
        estimatedScore,
        durationSec: input.durationSec ?? null,
      },
    }),
    prisma.quizAttempt.createMany({ data: attempts }),
  ]);

  return result;
}

export function getMockResult(id: string, userId: string) {
  return prisma.mockExamResult.findFirst({ where: { id, userId } });
}

export function listMockResults(userId: string) {
  return prisma.mockExamResult.findMany({
    where: { userId },
    orderBy: { takenAt: "desc" },
    take: 20,
  });
}
