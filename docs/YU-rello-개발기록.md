# YU-rello 기획 및 구현 기록

**프로젝트:** YU-rello — Trello에서 영감을 받은 협업 도구
**배포 URL:** https://yu-rello.vercel.app
**GitHub:** https://github.com/ParkSanghyeok076/YU-rello
**개발 기간:** 2026-02-20 ~ 2026-02-21
**개발 방식:** Claude Code (AI 페어 프로그래밍)

---

## 기술 스택

| 분류 | 기술 |
|---|---|
| 프레임워크 | Next.js 16.1.6 (App Router) |
| 언어 | TypeScript |
| 스타일링 | Tailwind CSS v4 |
| 백엔드/DB | Supabase (PostgreSQL + RLS + Realtime) |
| 인증 | Supabase Auth (@supabase/ssr) |
| 드래그앤드롭 | @dnd-kit/core, @dnd-kit/sortable |
| 캘린더 | FullCalendar (@fullcalendar/react) |
| 애니메이션 | Framer Motion |
| 배포 | Vercel (GitHub 자동 배포) |
| 날짜 처리 | date-fns |

---

## 개발 워크플로우

모든 기능은 아래 흐름으로 구현했습니다:

```
기획 (brainstorming) → 설계 문서 작성 → 구현 계획 수립 (writing-plans)
→ 서브에이전트 구현 (subagent-driven-development)
→ Spec 리뷰 → 코드 품질 리뷰 → 배포 (Vercel 자동)
```

Claude Code의 **Superpowers 스킬** 활용:
- `superpowers:brainstorming` — 기능 설계 및 요구사항 정리
- `superpowers:writing-plans` — 태스크 단위 구현 계획 문서 작성
- `superpowers:subagent-driven-development` — 태스크별 독립 서브에이전트 구현 + 2단계 리뷰
- `superpowers:systematic-debugging` — 버그 발생 시 근본 원인 분석
- `superpowers:finishing-a-development-branch` — 완료 후 푸시/배포

---

## Phase 1: 기반 설정

### Task 1 — 프로젝트 초기 설정
**도구:** Next.js CLI, Tailwind CSS v4, TypeScript

- Next.js 16 App Router 프로젝트 생성
- Tailwind v4 설정 (`@theme` 문법)
- Orbitron 폰트 (Google Fonts CDN) 적용
- Navy blue 색상 테마 (`#1a2b4a`) 정의

### Task 2 — 데이터베이스 설계
**도구:** Supabase Dashboard (SQL Editor)

10개 테이블 설계 및 생성:

| 테이블 | 역할 |
|---|---|
| `profiles` | 유저 프로필 (이름, 이메일, avatar) |
| `boards` | 보드 |
| `lists` | 리스트 (보드 내 컬럼) |
| `cards` | 카드 |
| `checklist_items` | 체크리스트 항목 |
| `labels` | 레이블 (색상, 이름) |
| `card_labels` | 카드-레이블 연결 |
| `card_members` | 카드-멤버 연결 |
| `comments` | 댓글 |
| `notifications` | 알림 |

- Row Level Security (RLS) 정책 설정
- `profiles` 자동 생성 트리거 (회원가입 시 자동 등록)

### Task 3 — Supabase 클라이언트
**도구:** @supabase/ssr

- `lib/supabase/client.ts` — 브라우저 클라이언트
- `lib/supabase/server.ts` — 서버 컴포넌트용 클라이언트
- TypeScript 타입 정의 (`Database` 인터페이스)

### Task 4 — 인증 시스템
**도구:** Supabase Auth, Next.js App Router

- `/login` — 로그인 페이지
- `/signup` — 회원가입 페이지
- `/auth/callback` — OAuth 콜백 라우트
- 미인증 접근 시 `/login` 리다이렉트

---

## Phase 2: 대시보드 & 보드 관리

### Task 5 — 대시보드 레이아웃
**도구:** Next.js Server Components, Tailwind CSS

- `Header` — 로고, 로그아웃, 알림벨
- `Toolbar` — 뷰 전환(보드/캘린더), 유저 필터
- Dashboard 페이지 — 보드 목록 그리드

### Task 6 — 새 보드 생성
**도구:** Supabase JS Client

- `BoardForm` 컴포넌트 — 보드 이름 입력 폼
- `/board/new` 페이지
- Supabase `boards` 테이블에 INSERT

---

## Phase 3: 보드 & 카드 핵심 기능

### Task 7 — 보드 상세 페이지
**도구:** Next.js 동적 라우팅, Supabase nested join

- `app/board/[id]/page.tsx` — SSR로 보드+리스트+카드 한 번에 fetch
- `BoardView` — 클라이언트 상태 관리
- `List` — 리스트 컴포넌트
- `Card` — 레이블 색상, 체크리스트 진행도 바, 댓글 수 표시

### Task 8 — 리스트 생성
**도구:** Supabase JS Client

- `CreateListButton` — 클릭 시 인라인 입력 폼으로 전환
- position 값으로 순서 관리

### Task 9 — 카드 생성
**도구:** Supabase JS Client

- `CreateCardButton` — textarea 폼
- position 값으로 카드 순서 관리

### Task 10 — 카드 상세 모달
**도구:** Framer Motion, Supabase JS Client

- `CardModal` — 설명 편집, 카드 삭제
- Framer Motion fade+scale 애니메이션
- 배경 클릭 시 모달 닫기

### Task 11 — 카드 Drag & Drop
**도구:** @dnd-kit/core, @dnd-kit/sortable

- `useSortable` — 카드에 적용
- `PointerSensor` distance:8px — 클릭과 드래그 구분
- 같은 리스트 내 순서 변경, 다른 리스트로 이동
- 이동 후 Supabase에 position/list_id UPDATE

### Task 12 — 리스트 Drag & Drop
**도구:** @dnd-kit/core, @dnd-kit/sortable

- `useSortable` — 리스트 헤더에 적용
- `horizontalListSortingStrategy` — 가로 방향 정렬
- `DragOverlay` — 드래그 중 미리보기 표시

---

## Phase 4: 카드 상세 기능

### Task 13 — 체크리스트
**도구:** Supabase JS Client, date-fns

- `ChecklistItem` — 완료 토글, 인라인 편집, 삭제, 마감일 지정
- `ChecklistSection` — 진행률 바 (완료 수 / 전체 수)
- Enter 키로 즉시 항목 추가

### Task 14 — 레이블 시스템
**도구:** Supabase JS Client

- `LabelPicker` — 8가지 컬러 프리셋, 레이블 생성/토글
- `LabelsSection` — 카드 모달 내 레이블 관리
- `card_labels` 테이블로 카드-레이블 다대다 관계

### Task 15 — 댓글 시스템
**도구:** Supabase JS Client, date-fns

- `Comment` — 작성자만 수정/삭제 가능
- 상대적 시간 표시 (방금 전, N분 전 등)
- `CommentsSection` — 댓글 입력 폼

### Task 16 — 카드 멤버 할당
**도구:** Supabase JS Client

- `MemberPicker` — 전체 유저 목록에서 추가/제거
- `MembersSection` — 카드 모달 내 멤버 표시
- `card_members` 테이블로 카드-멤버 다대다 관계

### Task 17 — 캘린더 뷰
**도구:** @fullcalendar/react, @fullcalendar/daygrid

- `CalendarView` — 체크리스트 마감일 + 카드 마감일 이벤트 표시
- 이벤트 클릭 시 카드 모달 오픈
- Toolbar에서 보드뷰 ↔ 캘린더뷰 전환

---

## Phase 5: 실시간 & 알림

### Task 18 — 알림 시스템
**도구:** Supabase JS Client, Web Notifications API

- `lib/notifications.ts` — `createNotification()`, `sendBrowserNotification()`
- `NotificationBell` — 알림 수 배지, 드롭다운, 읽음 처리
- 멤버 추가 시 알림, 댓글 시 카드 멤버에게 알림

### Task 19 — 실시간 업데이트
**도구:** Supabase Realtime (WebSocket)

- `hooks/useRealtimeSubscription.ts` — 7개 테이블 동시 구독
- `BoardView`에 통합 — 다른 유저 변경사항 즉시 반영
- `router.refresh()` 제거 → 클라이언트 상태 직접 업데이트 (깜빡임 방지)

---

## Phase 6: UI 고도화

**도구:** Framer Motion, Tailwind CSS

- **다크 테마** — 배경 `#0d1117`, 리스트 `#161b22`
- **애니메이션** — 카드 hover 부상, 모달 fade+scale, 리스트 슬라이드 인
- **로그인 배경화면** — 커스텀 이미지(`/public/로그인 배경 2.png`)

---

## Phase 7: 리스트 멤버 시스템

**도구:** Supabase (새 테이블 + RLS), Superpowers 스킬

새 테이블: `list_members` (list_id, user_id)

- `ListMemberPicker` — 리스트 헤더의 + 버튼으로 멤버 추가/제거
- 리스트 헤더에 멤버 아바타 최대 3개 표시 (+N 배지)
- Toolbar 필터 연동 — 리스트 멤버이면 해당 리스트의 모든 카드 표시
- Supabase Realtime `list_members` 채널 추가

---

## Phase 8: 보드 접근 제어

**도구:** Supabase RLS, Next.js Server Components, Superpowers 스킬

새 테이블: `board_members` (board_id, user_id)

### 보안 구조 (이중 차단)
1. **Supabase RLS** — `board_members`에 없으면 boards 조회 자체 불가
2. **앱 레벨** — `page.tsx`에서 멤버십 재확인, 없으면 `/dashboard` 리다이렉트

### 구현 내용
- `BoardForm` — 보드 생성 시 creator를 `board_members`에 자동 등록
- `BoardMemberManager` — 멤버 목록 + 초대/제거 드롭다운 (owner만 접근)
- 보드 헤더에 멤버 아바타 최대 3개 표시
- 대시보드는 RLS가 자동 필터링 (코드 변경 없음)

---

## Phase 9: 어드민 계정

**도구:** Supabase (컬럼 추가 + RLS 수정), TypeScript, Superpowers 스킬

### 추가된 내용
- `profiles.is_admin: boolean` 컬럼
- `psh092929@gmail.com` → `is_admin = true` 설정

### Admin 권한
| 기능 | 일반 멤버 | 보드 Owner | Admin |
|---|---|---|---|
| 보드 목록 | 자신이 속한 보드만 | 자신이 속한 보드만 | 모든 보드 |
| 보드 삭제 | ✗ | ✓ | ✓ |
| 리스트 삭제 | ✗ | ✓ | ✓ |
| 카드 삭제 | ✗ | ✓ | ✓ |
| 멤버 관리 | ✗ | ✓ | ✓ |

### 구현 구조
```
Supabase profiles.is_admin (DB)
  → page.tsx (SSR에서 fetch)
  → BoardView (isAdmin prop)
  → BoardMemberManager (canToggle = isOwner || isAdmin)
```

---

## 주요 트러블슈팅

### 1. `@supabase/ssr` 마이그레이션
- **문제:** Next.js 16에서 기존 `@supabase/auth-helpers-nextjs` 미지원
- **해결:** `@supabase/ssr` 패키지로 교체, `cookies()` async 처리

### 2. Tailwind v4 커스텀 색상
- **문제:** v3 문법(`theme.extend.colors`) 미작동
- **해결:** `@theme` 블록 문법으로 교체

### 3. 실시간 업데이트 깜빡임
- **문제:** `router.refresh()` 호출 시 페이지 깜빡임
- **해결:** Supabase Realtime 구독 + 클라이언트 상태 직접 업데이트

### 4. Drag & Drop 클릭/드래그 충돌
- **문제:** 카드 클릭이 드래그로 인식됨
- **해결:** `PointerSensor` `distance: 8` 설정 (8px 이상 이동 시에만 드래그)

### 5. RLS 무한 재귀 (infinite recursion)
- **문제:** `board_members FOR ALL` 정책이 `boards` SELECT를 호출 → `boards` SELECT 정책이 `board_members`를 조회 → 순환
- **해결:** `FOR ALL`을 `FOR INSERT` + `FOR DELETE`로 분리 (SELECT 시에는 단순 `user_id = auth.uid()` 정책만 적용)

---

## 최종 파일 구조

```
app/
├── login/page.tsx          # 로그인 (배경화면 포함)
├── signup/page.tsx         # 회원가입
├── dashboard/page.tsx      # 보드 목록
├── board/
│   ├── new/page.tsx        # 새 보드 생성
│   └── [id]/page.tsx       # 보드 상세 (SSR)
└── auth/callback/route.ts  # Auth 콜백

components/
├── AuthForm.tsx            # 로그인/회원가입 폼
├── Header.tsx              # 헤더 (알림벨 포함)
├── Toolbar.tsx             # 뷰 전환, 유저 필터
├── BoardCard.tsx           # 대시보드 보드 카드
├── BoardForm.tsx           # 새 보드 생성 폼
├── BoardView.tsx           # 보드 뷰 (DnD 컨텍스트)
├── BoardMemberManager.tsx  # 보드 멤버 관리
├── List.tsx                # 리스트 (멤버 아바타 포함)
├── ListMemberPicker.tsx    # 리스트 멤버 피커
├── Card.tsx                # 카드 (레이블, 진행도)
├── CardModal.tsx           # 카드 상세 모달
├── CreateListButton.tsx    # 리스트 생성
├── CreateCardButton.tsx    # 카드 생성
├── ChecklistSection.tsx    # 체크리스트
├── ChecklistItem.tsx       # 체크리스트 항목
├── LabelsSection.tsx       # 레이블 섹션
├── LabelPicker.tsx         # 레이블 선택
├── MembersSection.tsx      # 멤버 섹션
├── MemberPicker.tsx        # 멤버 선택
├── CommentsSection.tsx     # 댓글 섹션
├── Comment.tsx             # 댓글
├── NotificationBell.tsx    # 알림 벨
└── CalendarView.tsx        # 캘린더 뷰

hooks/
└── useRealtimeSubscription.ts  # Supabase Realtime 구독

lib/
├── supabase/
│   ├── client.ts           # 브라우저 클라이언트 + DB 타입
│   └── server.ts           # 서버 클라이언트
└── notifications.ts        # 알림 유틸리티
```
