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

## 진행 상황

- [x] 1. Next.js 스캐폴딩 (TS + Tailwind + App Router)
- [ ] 2. Supabase 프로젝트 + `.env.local`
- [ ] 3. Prisma 스키마 + 마이그레이션
- [ ] 4. 인증
- [ ] 5. 문제은행 CRUD + 시드
- [ ] 6. SRS 복습 + 퀴즈 엔진
- [ ] 7. 브라우저 TTS 리스닝 재생
- [ ] 8. 모의고사 모드 + 환산 점수(추정치)
- [ ] 9. 진행도 대시보드
- [ ] 10. 3일 스프린트 챌린지 + 스트릭
- [ ] 11. Web Push 알림
- [ ] 12. CI + Vercel 배포

자세한 브리프는 [CLAUDE.md](./CLAUDE.md) 참고.
