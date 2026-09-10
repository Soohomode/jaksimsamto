# 작심삼토 (JAKSIMSAMTO)

> "작심삼일도 10번이면 한 달!" — 3일 단위 스프린트로 짧고 강하게 끝내는 챌린지형 토익(TOEIC) 학습 웹앱

## 컨셉

'작심삼일(作心三日)' + 토익(토). 의지 부족·중도 포기가 고민인 수험생을 위해,
3일 단위 챌린지 + SRS 복습 + LC/RC 문제풀이 + 모의고사를 제공한다.
"3일마다 새로 시작해도 괜찮다, 그게 쌓이면 완주다"라는 톤을 UI 전반에 유지한다.

## 기술 스택

- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **DB / Auth**: Supabase (Postgres + Auth)
- **ORM**: Prisma (예정)
- **배포**: Vercel / **CI**: GitHub Actions
- **리스닝 음성**: 브라우저 내장 Web Speech API (`SpeechSynthesis`) — 서버 오디오 저장 없음
- **알림**: Web Push API + Service Worker (VAPID, 유료 서비스 없음)

> AI API(외부 LLM) 의존성 없음. LC/RC는 전부 객관식이라 AI 채점이 불필요하다.

## 개발

```bash
npm install
npm run dev
```

http://localhost:3000 접속.

## Supabase 연동 (사용자가 직접)

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. `cp .env.local.example .env.local` 후 값 채우기
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project Settings → API
   - `DATABASE_URL`(포트 6543, pgbouncer), `DIRECT_URL`(포트 5432): Project Settings → Database → Connection string
3. 스키마 반영:
   ```bash
   npm run db:generate   # Prisma Client 생성
   npm run db:migrate     # 첫 마이그레이션 (dev)
   npm run db:seed        # 스프린트 챌린지 시드
   ```
4. (권장) 각 테이블에 RLS 정책 추가 — `user_id = auth.uid()` 기준
5. Auth 설정 (Supabase 대시보드 → Authentication)
   - URL Configuration → Redirect URLs 에 `http://localhost:3000/**`, 배포 도메인 추가
   - Email Templates → "Confirm signup" 링크를
     `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` 로 수정
   - 로컬에서 확인 메일 없이 테스트하려면 "Confirm email" 옵션을 잠시 꺼도 됨
6. 관리자 접근: `.env.local`의 `ADMIN_EMAILS`에 본인 가입 이메일을 넣으면
   로그인 후 대시보드에 "관리자" 버튼이 뜨고 `/admin/questions`에서 문제를 관리할 수 있음
7. Web Push: `npx web-push generate-vapid-keys --json`으로 키 생성 →
   `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` 채우기.
   `CRON_SECRET`도 아무 값이나 설정. `/challenge`에서 "알림 켜기"로 구독.
   스트릭 리마인더는 `GET /api/cron/streak-reminder` (헤더 `Authorization: Bearer $CRON_SECRET`),
   Vercel Cron이 `vercel.json` 스케줄대로 매시 호출.
   ※ iOS Safari는 홈 화면에 추가한 PWA 상태에서만 웹 푸시가 동작함.

### DB 스크립트

| 스크립트 | 설명 |
|---|---|
| `npm run db:generate` | Prisma Client 재생성 |
| `npm run db:migrate` | 마이그레이션 생성·적용 (개발) |
| `npm run db:deploy` | 마이그레이션 적용 (배포) |
| `npm run db:push` | 마이그레이션 없이 스키마 강제 반영 (프로토타이핑) |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | 시드 실행 |

## CI / 배포

- **CI**: `.github/workflows/ci.yml` — push(main)·PR마다 `lint → build → tsc`.
- **배포 (Vercel)**:
  1. Vercel에 이 repo import (Framework: Next.js 자동 감지)
  2. **Environment Variables**에 아래를 모두 등록:

     | 변수 | 비고 |
     |---|---|
     | `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase API |
     | `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 |
     | `DATABASE_URL` (pooler 6543) / `DIRECT_URL` (5432) | Prisma |
     | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | Web Push |
     | `ADMIN_EMAILS` | 관리자 이메일(쉼표 구분) |
     | `CRON_SECRET` | Cron 인증 (Vercel Cron이 자동으로 Bearer 헤더에 사용) |

  3. 첫 배포 후 마이그레이션 적용: 로컬에서 `DATABASE_URL`을 프로덕션 값으로 두고
     `npm run db:deploy` (또는 CI/CD 단계에 추가). `npm run db:seed`로 챌린지·샘플 문제 시드.
  4. Supabase Auth → Redirect URLs에 배포 도메인(`https://<앱>.vercel.app/**`) 추가.
  5. `vercel.json`의 Cron(`/api/cron/streak-reminder`, 매시)이 자동 등록됨.

> `build` 스크립트가 `prisma generate`를 먼저 실행하므로 Vercel 빌드에서 별도 설정 불필요.

## 진행 상황

- [x] 1. Next.js 스캐폴딩 (TS + Tailwind + App Router)
- [x] 2. Supabase 클라이언트 코드 (`src/lib/supabase/*`, `src/proxy.ts`) + 실제 프로젝트 연동
- [x] 3. Prisma 스키마 + `init` 마이그레이션 적용 + 시드
- [x] 4. 인증 (이메일/비밀번호, 로그인·가입·로그아웃, 보호 라우트)
- [x] 5. 문제은행 CRUD (`/admin/questions`) + 샘플 문제 19개 시드
- [x] 6. SRS 복습(SM-2) + 퀴즈 엔진 (`/study`, `/practice`, 채점·오답 기록)
- [x] 7. 브라우저 TTS 리스닝 재생 (화자 구분, 음성 선택, 속도 0.75~1.0)
- [x] 8. 모의고사 모드 (`/mock`) + 근사 환산 점수(추정치 명시)
- [x] 9. 진행도 대시보드 (정답률·활동·파트별·복습 숙련도·모의고사 추이)
- [x] 10. 3일 스프린트 챌린지 (`/challenge`) + `user_streaks` 연속 기록
- [x] 11. Web Push 알림 (Service Worker + VAPID, 스트릭 리마인더 크론)
- [x] 12. GitHub Actions CI (`lint`/`build`/`tsc`) + Vercel 배포 설정(`vercel.json`, 문서)

자세한 브리프는 [CLAUDE.md](./CLAUDE.md) 참고.
