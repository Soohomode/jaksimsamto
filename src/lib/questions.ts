import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CHOICE_KEYS, choiceKeyToIndex, getPartMeta } from "@/lib/parts";

export interface QuestionInput {
  part: number;
  type: string;
  content: string;
  choices: string[];
  answer: string; // "A" | "B" | "C" | "D"
  audioScript?: string | null;
  explanation?: string | null;
  difficulty?: number;
  tags?: string[];
  isPublished?: boolean;
  passageGroup?: string | null;
  passageOrder?: number | null;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/** 문항 입력값 검증. 관리자 폼 / 시드 양쪽에서 사용. */
export function validateQuestion(input: QuestionInput): ValidationResult {
  const errors: string[] = [];
  const meta = getPartMeta(input.part);

  if (!meta) {
    errors.push(`알 수 없는 파트: ${input.part}`);
    return { ok: false, errors };
  }

  if (!input.content.trim()) errors.push("문제 본문을 입력해주세요.");

  const choices = input.choices.map((c) => c.trim()).filter(Boolean);
  if (choices.length !== meta.choiceCount) {
    errors.push(`Part ${input.part}는 보기가 ${meta.choiceCount}개여야 해요.`);
  }

  const answerIdx = choiceKeyToIndex(input.answer);
  if (answerIdx < 0 || answerIdx >= meta.choiceCount) {
    errors.push("정답 보기를 선택해주세요.");
  }

  if (meta.hasAudio && !input.audioScript?.trim()) {
    errors.push(`Part ${input.part}는 음성 대본(audioScript)이 필요해요.`);
  }
  if (!meta.hasAudio && input.audioScript?.trim()) {
    errors.push(`Part ${input.part}는 음성 대본을 넣지 않아요.`);
  }

  if (
    input.difficulty !== undefined &&
    (input.difficulty < 1 || input.difficulty > 5)
  ) {
    errors.push("난이도는 1~5 사이여야 해요.");
  }

  return { ok: errors.length === 0, errors };
}

function toCreateData(input: QuestionInput): Prisma.QuestionCreateInput {
  const meta = getPartMeta(input.part)!;
  return {
    part: input.part,
    type: input.type || meta.defaultType,
    content: input.content.trim(),
    choices: input.choices.map((c) => c.trim()).filter(Boolean),
    answer: input.answer.trim().toUpperCase(),
    audioScript: meta.hasAudio ? (input.audioScript?.trim() ?? null) : null,
    explanation: input.explanation?.trim() || null,
    difficulty: input.difficulty ?? 3,
    tags: input.tags ?? [],
    isPublished: input.isPublished ?? true,
    passageGroup: input.passageGroup?.trim() || null,
    passageOrder: input.passageOrder ?? null,
  };
}

export interface ListParams {
  part?: number;
  search?: string;
  publishedOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listQuestions(params: ListParams = {}) {
  const { part, search, publishedOnly, page = 1, pageSize = 20 } = params;

  const where: Prisma.QuestionWhereInput = {
    ...(part ? { part } : {}),
    ...(publishedOnly ? { isPublished: true } : {}),
    ...(search
      ? {
          OR: [
            { content: { contains: search, mode: "insensitive" } },
            { audioScript: { contains: search, mode: "insensitive" } },
            { tags: { has: search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy: [{ part: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.question.count({ where }),
  ]);

  return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
}

export function getQuestion(id: string) {
  return prisma.question.findUnique({ where: { id } });
}

export async function createQuestion(input: QuestionInput) {
  const v = validateQuestion(input);
  if (!v.ok) throw new Error(v.errors.join(" "));
  return prisma.question.create({ data: toCreateData(input) });
}

export async function updateQuestion(id: string, input: QuestionInput) {
  const v = validateQuestion(input);
  if (!v.ok) throw new Error(v.errors.join(" "));
  return prisma.question.update({ where: { id }, data: toCreateData(input) });
}

export function deleteQuestion(id: string) {
  return prisma.question.delete({ where: { id } });
}

export async function questionCountsByPart() {
  const rows = await prisma.question.groupBy({
    by: ["part"],
    _count: { _all: true },
  });
  const map = new Map<number, number>();
  for (const r of rows) map.set(r.part, r._count._all);
  return map;
}

/** 시드/업서트용: 같은 (part, content)면 갱신. */
export async function upsertQuestionByContent(input: QuestionInput) {
  const existing = await prisma.question.findFirst({
    where: { part: input.part, content: input.content.trim() },
    select: { id: true },
  });
  if (existing) return updateQuestion(existing.id, input);
  return createQuestion(input);
}

export { CHOICE_KEYS };
