# 작심삼토 — 토익(TOEIC) 학습 앱 프로젝트 브리프

> Claude Code Desktop(또는 CLI)에 프로젝트 시작 지시로 그대로 전달하기 위한 문서입니다.
> 이 파일을 프로젝트 루트에 `CLAUDE.md` 또는 `PROJECT_BRIEF.md`로 저장한 뒤,
> "이 문서 기준으로 1번부터 순서대로 구현해줘. 각 단계 끝나면 git commit까지 해줘"
> 라고 시작하면 됩니다.

## 0. 서비스 브랜딩

- **서비스명**: 작심삼토
- **유래**: '작심삼일(作心三日)' 패러디 + 토익(토) — "작심삼일로 끝나는 토익 공부를 끝내자"
- **컨셉**: 3일 단위 스프린트로 짧고 강하게 끝내는 챌린지형 토익 학습
- **슬로건 (후보)**
  - "작심삼일도 10번이면 한 달! 작심삼토에서 끝내는 토익"
  - "포기도 습관, 완주도 습관. 작심삼일 수험생을 위한 작심삼토"
- **주의점**: '작심삼일'은 원래 "의지가 오래 못 간다"는 부정적 어감이 있음.
  UI 문구/온보딩에서 "3일마다 새로 시작해도 괜찮다, 그게 쌓이면 완주다"라는 식으로
  긍정적으로 리프레임할 것 — 카피 톤 전반에 이 원칙을 유지.

## 1. 프로젝트 개요

- **대상**: 한국인 토익(TOEIC) 응시자, 특히 '의지 부족/중도 포기'가 고민인 수험생
- **형태**: 웹앱 — 3일 단위 챌린지 + SRS 기반 단어·문법 학습 + LC/RC 문제풀이 + 모의고사
- **AI API는 MVP 범위에 포함하지 않음.** LC/RC는 전부 객관식이라 AI 채점이 필요 없고,
  스피킹/라이팅 AI 첨삭은 별도 모듈로 나중에 검토한다.

## 2. 기술 스택

| 영역 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router) + TypeScript |
| 스타일링 | Tailwind CSS |
| DB / 인증 | Supabase (Postgres + Auth) |
| ORM | Prisma 또는 Drizzle |
| 배포 | Vercel |
| CI | GitHub Actions |
| 리스닝 음성 | 브라우저 내장 Web Speech API (`SpeechSynthesis`) — 서버 오디오 저장/스트리밍 없음 |
| 알림 | Web Push API + Service Worker (무료, 서버 비용 없음) |

## 3. 핵심 기능 (구현 우선순위)

1. 인증 (이메일 기본, 소셜 로그인은 선택)
2. 문제은행 CRUD — LC Part 1~4, RC Part 5~7
3. 단어 / 문법 SRS 복습 (SM-2 계열 알고리즘)
4. 퀴즈 엔진 — 문제 풀이 + 채점 + 오답 기록
5. 모의고사 모드 — LC 100문항 + RC 100문항 시뮬레이션, 근사 환산표로 예상 점수 표시
   (※ 실제 공식 점수와 다를 수 있음을 UI에 항상 명시)
6. 진행도 / 통계 대시보드
7. **3일 스프린트 챌린지** — 3일 단위로 단어 암기/모의고사 미션을 부여하고,
   완료하면 스트릭(연속 기록)이 올라가는 챌린지형 기능
8. **작심삼일 방지 알림** — 스트릭이 끊기기 직전(예: 3일차 미접속)일 때
   웹 푸시로 리마인드 발송

**이번 스코프 제외**: 스피킹/라이팅 AI 첨삭, 결제/구독, 서버사이드 오디오 녹음·저장.

## 4. 데이터 모델 (요약 스키마)

```
users              (Supabase Auth 연동)
questions          (id, part, type, content, choices, answer, audio_script)
review_states      (user_id, question_id, ease, interval, next_review_at)
quiz_attempts      (user_id, question_id, selected, is_correct, attempted_at)
mock_exam_results  (user_id, lc_raw_score, rc_raw_score, estimated_score, taken_at)
sprint_challenges  (id, day_range, mission_type, target_count)
user_streaks       (user_id, current_streak, longest_streak, last_completed_date)
push_subscriptions (user_id, endpoint, keys, created_at)
```

## 5. 리스닝 음성 구현 가이드

- `window.speechSynthesis` + `SpeechSynthesisUtterance`로 클라이언트에서 즉시 합성·재생.
  서버 API나 오디오 파일 저장이 필요 없음.
- 음성 목록(`getVoices()`)은 비동기 로드 — 처음엔 빈 배열일 수 있으므로
  `voiceschanged` 이벤트를 한 번 기다린 뒤 사용.
- Part 3/4처럼 화자가 여러 명인 대화문은 발화 단위로 `SpeechSynthesisUtterance`를 만들어
  순서대로 `speak()` 호출 — 자동으로 큐에 쌓여 순서대로 재생됨.
- `utterance.rate`를 0.75~1.0 사이에서 슬라이더로 조절 가능하게 — 학습 난이도 조절용.
- 브라우저/OS마다 탑재 음성이 달라 소리가 다르게 들림 (Chrome/Windows vs Safari/Mac).
  완전히 동일한 경험은 보장되지 않으므로 안내 문구 권장.
- `'speechSynthesis' in window` 체크로 미지원 환경 대비 fallback 안내 필요.
- 재생되는 음성은 파일로 저장·캐싱할 수 없음 (매번 그 자리에서 합성됨) —
  서버 TTS/사전녹음 대비 트레이드오프로 인지하고 시작.

## 6. 스트릭/알림 구현 가이드

- 스트릭은 `user_streaks` 테이블 하나로 관리 — 미션 완료 시마다 `last_completed_date`
  갱신, 하루라도 비면 `current_streak`을 0으로 리셋하는 로직 필요.
- 알림은 **Web Push API + Service Worker** 조합으로 무료 구현 (VAPID 키 발급만 필요,
  별도 유료 서비스 불필요).
- iOS Safari는 웹 푸시 지원이 제한적이라, 홈 화면에 추가한 PWA 상태에서만 동작하는
  경우가 있음 — 실제 배포 전 최신 iOS 버전 기준으로 다시 확인 필요.
- 알림 타이밍 예: 마지막 활동 후 48시간 경과 시점에 1차 알림, 60~66시간 경과 시점에
  "스트릭이 곧 끊긴다"는 2차 알림.

## 7. 개발 진행 순서

1. GitHub repo 생성 → `create-next-app` (TypeScript + Tailwind + App Router)
2. Claude Code 설치, 이 문서를 `CLAUDE.md`로 저장
3. Supabase 프로젝트 생성 (로컬 개발은 Supabase CLI) → `.env.local` 분리 저장
4. Prisma/Drizzle로 4번 스키마 작성 → 마이그레이션
5. 인증 구현
6. 문제은행 CRUD + 시드 데이터
7. SRS 복습 로직 + 퀴즈 엔진
8. 브라우저 TTS 기반 리스닝 재생 기능
9. 모의고사 모드 + 환산 점수 표시
10. 진행도 대시보드
11. 3일 스프린트 챌린지 + 스트릭 로직
12. Web Push 알림 (Service Worker + VAPID)
13. GitHub Actions CI → Vercel 배포

## 8. Claude Code에게 주는 참고 노트

- 서비스명은 "작심삼토"이며, 브랜드 톤은 '작심삼일'의 부정적 어감을 유쾌하게
  뒤집는 방향 — 카피/에러 메시지/알림 문구 작성 시 이 톤을 반영할 것.
- 이 리포는 외부 LLM(AI API) 의존성이 없음 — 관련 SDK나 API 키 설정을 임의로 추가하지 말 것.
- 오디오 파일을 서버나 스토리지에 저장하지 않음 — 클라이언트 TTS로만 처리.
- 모의고사 환산 점수는 항상 "추정치"라는 문구를 UI에 표시할 것.
- 알림 발송은 유료 서드파티 서비스 없이 Web Push API로 구현할 것.


---

@AGENTS.md
