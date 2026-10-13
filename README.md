# Hallyoswim · 여수한려초 수영부 관리

여수한려초등학교 수영부의 선수, 기록, 일정, 활동 자료를 한곳에서 관리하는 웹앱(PWA)입니다.

- 운영 주소: https://hallyo.vercel.app
- 배포: `main` 브랜치에 병합되면 Vercel이 자동으로 운영 배포합니다. PR마다 미리보기 배포가 만들어집니다.
  - 자동 배포가 안 되면 Vercel 프로젝트 **Settings → Git** 에서 저장소 연결 상태(오류 표시)를 먼저 확인하고, 오류가 있으면 **Reconnect** 합니다.

## 주요 기능

| 분류 | 메뉴 |
|---|---|
| 선수·기록 | 선수 명단, 선수 기록(지역·전국), 기록 분석, 라이벌 비교, 순위 시뮬레이터 |
| 일정 | 대회 일정(지도·숙소·식당·참가자), 훈련 일정 |
| 자료 | 수영 관련 영상, 대회 영상, 활동 사진, 수영부 연혁, 보도 기사, 명예의 전당 |
| 운영 | 공지사항, 상담 일지(관리 권한), 개발 일지, 마이 페이지, 환경 설정(개발자) |

## 기술 스택

- **Next.js 16** (App Router, Server Actions) · React 19 · TypeScript
- **Supabase**: 로그인(Auth), Postgres DB, Storage(`photos` 버킷)
- Tailwind CSS v4, TanStack Query, react-hook-form + zod, recharts, Leaflet
- Vercel (배포)

> ⚠️ 이 프로젝트의 Next.js는 예전 버전과 다른 부분이 있습니다. 예를 들어 미들웨어 대신 `src/proxy.ts`를 씁니다.
> 코드를 고치기 전에 `node_modules/next/dist/docs/`의 문서를 확인하세요. (`AGENTS.md` 참고)

## 로컬에서 실행하기

1. Node.js 20 이상을 준비합니다.
2. 의존성을 설치합니다.
   ```bash
   npm ci
   ```
3. `.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다.
   값은 Supabase 대시보드 → Project Settings → API 에서 확인할 수 있습니다.
   ```bash
   cp .env.example .env.local
   ```
4. 개발 서버를 실행하고 http://localhost:3000 에 접속합니다.
   ```bash
   npm run dev
   ```

### 환경변수

| 이름 | 필수 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase 공개(anon) 키 |

운영 환경의 값은 Vercel 프로젝트 설정 → Environment Variables 에 들어 있습니다.

## 자주 쓰는 명령

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 운영용 빌드 |
| `npm run start` | 빌드한 앱 실행 |
| `npm run lint` | 코드 검사 (ESLint) |
| `npx tsc --noEmit` | 타입 검사 |
| `npm test` | 단위 테스트 (Vitest, `src/**/*.test.ts`) |

## 로그인과 권한

- **이름 + 비밀번호**로 가입·로그인합니다. 내부적으로는 이름을 hex로 바꾼 `…@hallyoswim.com` 주소로 Supabase Auth에 등록합니다.
- 가입하면 `pending`(승인 대기) 상태가 되고, 관리자가 승인해야 대시보드에 들어갈 수 있습니다. 이 흐름은 `src/proxy.ts`에서 처리합니다. 승인 확인 결과는 10분 동안 쿠키에 기억해 페이지마다 DB를 조회하지 않습니다(자료 접근은 DB 권한 규칙이 따로 막음).
- 역할: `admin`(관리자), `developer`(개발자), `coach`(지도자), `athlete`(선수), `parents`(학부모), `guest`(일반인)
  - 회원 관리(가입 승인·역할 변경·삭제·비밀번호 초기화): 개발자
  - 선수 정보 추가·수정, 선수 연락처(학생 전화·학부모 이름·전화) 조회: 관리자·개발자
  - 상담 일지: 관리자·개발자·코치
  - 일정·공지 등록: 관리자·개발자·코치
  - 대회 기록 입력: 관리자·개발자·코치. 대회 화면의 **한꺼번에 입력**으로 종목별 표 입력이나 엑셀 업로드(이름·종목·기록·순위·경기구분·기록일)를 할 수 있습니다.
  - 사진·영상: 누구나 올릴 수 있고, 일반 회원이 올린 것은 승인 후 공개됩니다.
  - 새 학년도 진급(선수 명단 → 새 학년도 진급): 관리자·개발자. 6학년은 졸업생으로 옮겨지고 1~5학년은 한 학년씩 올라갑니다. 학년도마다 한 번만 됩니다.
  - 기록 분석 문구(집중 훈련 영역·코칭 어드바이스): 관리자·개발자가 화면에서 수정 (비워 두면 기록으로 만든 자동 문구)
- **비회원 둘러보기**: 로그인 화면의 "로그인 없이 둘러보기" → `/dashboard/explore`. 선수 기록(우리 선수·전국), 기록 분석, 라이벌 비교, 순위 시뮬레이터, 대회 일정(이름·날짜·장소만), 수영 관련 영상, 연혁, 보도 기사, 명예의 전당, 전체 공개 공지, 개발 일지만 볼 수 있습니다. 비회원에게 보이는 선수 정보는 이름·성별·학년뿐이고, 지도자가 고친 분석 문구는 회원 전용입니다. 공개 화면 목록은 `src/lib/guest.ts`, DB 권한은 `schema.sql` 11·12번에 있습니다.
- 그 밖의 자료(선수 명단·활동 사진·대회 영상·훈련 일정·대회 참가자·상담 일지 등)는 승인된 로그인 사용자만 볼 수 있습니다. 사진 저장소는 비공개이고, 화면에는 `/storage/photos/...` 경로(로그인 확인 후 전달)로 보여 줍니다.

## 폴더 구조

```
src/
  app/
    actions/      Server Actions (DB 쓰기와 권한 확인)
    dashboard/    로그인 후 화면 (메뉴별 폴더)
    login/ signup/ pending/
  components/     공용 컴포넌트
  data/           퀴즈·에세이·편지·시 등 고정 콘텐츠
  utils/supabase/ Supabase 클라이언트 (서버용 / 브라우저용)
  proxy.ts        로그인·승인 여부에 따른 페이지 이동
supabase/
  schema.sql          DB 스키마 (운영 DB 에서 뽑은 실제 구조)
  inspect_schema.sql  운영 DB 실제 구조 확인용 쿼리
  manual/             SQL Editor 에서 직접 실행해야 하는 변경
scripts/              데이터 일괄 등록 등 일회성 스크립트 (앱 빌드와 무관)
public/               로고, 글꼴, 공유 이미지, 서비스워커
```

## 데이터베이스

- `supabase/schema.sql`은 운영 DB에서 직접 뽑아 정리한 실제 구조입니다(테이블 18개, 권한 규칙, 함수). 운영 DB에 그대로 실행하지 마세요. DB를 바꾸면 이 파일도 함께 고쳐 주세요.
- 선수 연락처 3개 컬럼은 컬럼 권한으로 일반 조회에서 막혀 있습니다. `athletes`에 컬럼을 추가하면 `schema.sql` 7번의 `grant`와 `src/lib/athletes.ts`의 `ATHLETE_COLUMNS`에도 넣어야 합니다.
- 운영 DB의 실제 구조는 Supabase SQL Editor에서 `supabase/inspect_schema.sql`을 실행해 확인할 수 있습니다.
- 대부분의 테이블은 실제로 지우지 않고 `is_deleted = true`로 표시만 합니다(soft delete). 단, 글에 붙은 사진 파일은 글을 지울 때 저장소에서도 지웁니다. 남은 파일은 **환경 설정 → 사진 저장소 정리**로 지울 수 있습니다.
- 변경 이력은 `audit_logs` 테이블에 남습니다.

## 만든 사람

© 2026 엽쌤 · 달디단
