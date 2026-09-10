import { prisma } from "@/lib/prisma";
import { getPartMeta } from "@/lib/parts";
import { toClientQuestion, type ClientQuestion } from "@/lib/study";

export interface QuizParams {
  part?: number;
  count?: number;
  onlyWrong?: boolean; // 오답 위주로
  userId?: string;
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
 * 연습 퀴즈용 문제를 뽑는다.
 * 그룹(passageGroup) 문항은 세트를 함께, 순서대로 유지한다.
 */
export async function pickQuizQuestions({
  part,
  count = 10,
  onlyWrong = false,
  userId,
}: QuizParams): Promise<ClientQuestion[]> {
  let wrongIds: string[] | undefined;
  if (onlyWrong && userId) {
    const wrong = await prisma.quizAttempt.findMany({
      where: { userId, isCorrect: false },
      select: { questionId: true },
      distinct: ["questionId"],
      orderBy: { attemptedAt: "desc" },
      take: 200,
    });
    wrongIds = wrong.map((w) => w.questionId);
    if (wrongIds.length === 0) return [];
  }

  const pool = await prisma.question.findMany({
    where: {
      isPublished: true,
      ...(part ? { part } : {}),
      ...(wrongIds ? { id: { in: wrongIds } } : {}),
    },
    orderBy: [{ passageGroup: "asc" }, { passageOrder: "asc" }],
  });

  // 그룹 단위로 묶기
  const groups = new Map<string, typeof pool>();
  const singles: typeof pool = [];
  for (const q of pool) {
    if (q.passageGroup) {
      const g = groups.get(q.passageGroup) ?? [];
      g.push(q);
      groups.set(q.passageGroup, g);
    } else {
      singles.push(q);
    }
  }

  const units = shuffle<Array<(typeof pool)[number]>>([
    ...singles.map((q) => [q]),
    ...[...groups.values()],
  ]);

  const picked: ClientQuestion[] = [];
  for (const unit of units) {
    if (picked.length >= count) break;
    for (const q of unit) picked.push(toClientQuestion(q));
  }

  return picked;
}

export function quizTitle(part?: number, onlyWrong?: boolean): string {
  if (onlyWrong) return "오답 다시 풀기";
  if (!part) return "전체 파트 연습";
  return getPartMeta(part)?.label ?? `Part ${part}`;
}
