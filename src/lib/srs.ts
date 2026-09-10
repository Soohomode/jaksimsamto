/**
 * SM-2 계열 간격 반복(Spaced Repetition) 알고리즘.
 * SuperMemo-2를 일(day) 단위로 구현하고, 4버튼 UI에 맞춰 quality를 매핑한다.
 *
 * 참고: https://super-memory.com/english/ol/sm2.htm
 */

export type ReviewGrade = "again" | "hard" | "good" | "easy";

/** 4버튼 → SM-2 quality(0~5). q < 3 이면 실패로 간주. */
export const GRADE_QUALITY: Record<ReviewGrade, number> = {
  again: 2,
  hard: 3,
  good: 4,
  easy: 5,
};

export const GRADE_LABEL: Record<ReviewGrade, string> = {
  again: "다시",
  hard: "어려움",
  good: "보통",
  easy: "쉬움",
};

export interface SrsState {
  ease: number; // easiness factor, 최소 1.3
  intervalDays: number;
  repetitions: number; // 연속 정답 횟수
  lapses: number; // 실패 누적
}

export interface SrsResult extends SrsState {
  nextReviewAt: Date;
}

export const INITIAL_SRS: SrsState = {
  ease: 2.5,
  intervalDays: 0,
  repetitions: 0,
  lapses: 0,
};

const MIN_EASE = 1.3;

/** 정답 품질을 boolean 정오답에서 근사(퀴즈 자동 채점용). */
export function qualityFromCorrectness(isCorrect: boolean): number {
  return isCorrect ? GRADE_QUALITY.good : GRADE_QUALITY.again;
}

/**
 * 현재 상태와 이번 응답 quality(0~5)로 다음 복습 상태를 계산한다.
 * @param now 기준 시각 (테스트 편의를 위해 주입 가능)
 */
export function schedule(
  state: SrsState,
  quality: number,
  now: Date = new Date(),
): SrsResult {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  const passed = q >= 3;

  let { ease, intervalDays, repetitions, lapses } = state;

  // easiness factor 갱신 (SM-2 공식)
  ease = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ease < MIN_EASE) ease = MIN_EASE;

  if (passed) {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = q === 5 ? 6 : 4; // easy면 좀 더 길게
    } else {
      const factor = q === 3 ? Math.max(1.2, ease - 0.15) : ease;
      intervalDays = Math.round(intervalDays * factor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    lapses += 1;
    intervalDays = 1; // 실패하면 내일 다시
  }

  // 상한 (지나치게 긴 간격 방지)
  intervalDays = Math.min(intervalDays, 365);

  const nextReviewAt = new Date(now.getTime());
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

  return {
    ease: Number(ease.toFixed(4)),
    intervalDays,
    repetitions,
    lapses,
    nextReviewAt,
  };
}

/** "다시 보기까지" 사람이 읽는 문구. */
export function humanInterval(days: number): string {
  if (days <= 0) return "오늘";
  if (days === 1) return "내일";
  if (days < 30) return `${days}일 후`;
  if (days < 365) return `${Math.round(days / 30)}개월 후`;
  return `${Math.round(days / 365)}년 후`;
}
