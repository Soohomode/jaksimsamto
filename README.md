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

### DB 스크립트

| 스크립트 | 설명 |
|---|---|
| `npm run db:generate` | Prisma Client 재생성 |
| `npm run db:migrate` | 마이그레이션 생성·적용 (개발) |
| `npm run db:deploy` | 마이그레이션 적용 (배포) |
| `npm run db:push` | 마이그레이션 없이 스키마 강제 반영 (프로토타이핑) |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | 시드 실행 |

## 진행 상황

- [x] 1. Next.js 스캐폴딩 (TS + Tailwind + App Router)
- [x] 2. Supabase 클라이언트 코드 (`src/lib/supabase/*`, `src/proxy.ts`) + 실제 프로젝트 연동
- [x] 3. Prisma 스키마 + `init` 마이그레이션 적용 + 시드
- [x] 4. 인증 (이메일/비밀번호, 로그인·가입·로그아웃, 보호 라우트)
- [x] 5. 문제은행 CRUD (`/admin/questions`) + 샘플 문제 19개 시드
- [x] 6. SRS 복습(SM-2) + 퀴즈 엔진 (`/study`, `/practice`, 채점·오답 기록)
- [x] 7. 브라우저 TTS 리스닝 재생 (화자 구분, 속도 0.75~1.0, 스크립트 토글)
- [ ] 8. 모의고사 모드 + 환산 점수(추정치)
- [ ] 9. 진행도 대시보드
- [ ] 10. 3일 스프린트 챌린지 + 스트릭
- [ ] 11. Web Push 알림
- [ ] 12. CI + Vercel 배포

자세한 브리프는 [CLAUDE.md](./CLAUDE.md) 참고.
