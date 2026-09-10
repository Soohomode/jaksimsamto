/** KST(UTC+9) 기준 날짜 유틸. 서버 타임존과 무관하게 한국 사용자 기준으로 하루를 자른다. */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** Date → "YYYY-MM-DD" (KST 기준). */
export function kstDateKey(d: Date): string {
  return new Date(d.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** 오늘 자정(KST)에 해당하는 UTC Date. */
export function kstStartOfToday(now: Date = new Date()): Date {
  const key = kstDateKey(now);
  return new Date(new Date(`${key}T00:00:00.000Z`).getTime() - KST_OFFSET_MS);
}

/** n일 전 KST 자정의 UTC Date. */
export function kstStartOfDaysAgo(n: number, now: Date = new Date()): Date {
  const start = kstStartOfToday(now);
  return new Date(start.getTime() - n * 24 * 60 * 60 * 1000);
}

/** 최근 n일의 날짜 키 배열 (과거→오늘). */
export function recentDateKeys(n: number, now: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(kstDateKey(new Date(now.getTime() - i * 24 * 60 * 60 * 1000)));
  }
  return keys;
}
