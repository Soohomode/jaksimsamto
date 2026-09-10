import type { Question } from "@prisma/client";

/**
 * 클라이언트로 보내도 되는 문제 형태 (정답·해설 제외).
 * 이 파일은 prisma 런타임을 import 하지 않으므로 클라이언트 컴포넌트에서 안전하게 쓸 수 있다.
 */
export interface ClientQuestion {
  id: string;
  part: number;
  type: string;
  content: string;
  choices: string[];
  audioScript: string | null;
  passageGroup: string | null;
  passageOrder: number | null;
}

/** JsonValue인 choices를 문자열 배열로 안전 변환. */
export function asChoices(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : [];
}

export function toClientQuestion(q: Question): ClientQuestion {
  return {
    id: q.id,
    part: q.part,
    type: q.type,
    content: q.content,
    choices: asChoices(q.choices),
    audioScript: q.audioScript,
    passageGroup: q.passageGroup,
    passageOrder: q.passageOrder,
  };
}
