# YU-rello 개발 진행 상황

**마지막 업데이트:** 2026-02-21

---

## 🚀 배포 정보

- **프로덕션 URL:** https://yu-rello.vercel.app
- **플랫폼:** Vercel (GitHub 자동 배포)
- **배포 브랜치:** master
- **배포일:** 2026-02-21

---

## ✅ UI 개선 & 추가 기능 (2026-02-21)

- ✅ **다크 테마** — 검정 배경 (`#0d1117`), 어두운 리스트 (`#161b22`)
- ✅ **framer-motion 애니메이션** — 카드 hover 부상, 모달 fade+scale, 리스트 슬라이드 인
- ✅ **페이지 깜빡임 제거** — `router.refresh()` → 클라이언트 상태 업데이트
- ✅ **실시간 업데이트 수정** — 상대방 변경사항도 깜빡임 없이 반영
- ✅ **체크리스트 Enter 등록** — Enter 키로 즉시 추가
- ✅ **리스트 ⋯ 메뉴** — 이름 변경 (인라인), 리스트 삭제
- ✅ **보드 삭제** — 대시보드 hover 시 ⋯ 메뉴
- ✅ **리스트 멤버 지정** — 리스트 헤더 아바타 표시, 피커로 추가/제거, 툴바 필터 연동 (리스트 멤버면 모든 카드 표시)

---

## ✅ 완료된 작업 (Task 1-6)

### Phase 1: 설정 & 인증
- ✅ **Task 1:** Next.js 프로젝트 설정
  - Next.js 16.1.6, Tailwind v4, TypeScript
  - Orbitron 폰트 (Google Fonts CDN)
  - Navy blue 테마 (#1a2b4a)

- ✅ **Task 2:** Supabase 데이터베이스 설정
  - 프로젝트 URL: `https://mennynwvgkzmohoclrxs.supabase.co`
  - 10개 테이블 생성 (profiles, boards, lists, cards, checklist_items, labels, card_labels, card_members, comments, notifications)
  - Row Level Security (RLS) 정책 설정
  - Profile 자동 생성 트리거

- ✅ **Task 3:** Supabase 클라이언트 유틸리티
  - `@supabase/ssr` 패키지 사용 (Next.js 16 호환)
  - `lib/supabase/client.ts` - 클라이언트 사이드
  - `lib/supabase/server.ts` - 서버 사이드
  - Database 타입 정의

- ✅ **Task 4:** 인증 페이지
  - 로그인 페이지 (`/login`)
  - 회원가입 페이지 (`/signup`)
  - Auth callback route
  - 홈페이지 리다이렉트 로직

### Phase 2: 대시보드 & 보드 관리
- ✅ **Task 5:** 대시보드 레이아웃
  - Header 컴포넌트 (로고, 로그아웃)
  - Toolbar 컴포넌트 (뷰 전환, 사용자 필터)
  - Dashboard 페이지 (보드 목록)

- ✅ **Task 6:** 새 보드 생성
  - BoardForm 컴포넌트
  - `/board/new` 페이지
  - Supabase에 보드 저장

---

### Phase 3: 보드 & 카드 기능
- ✅ **Task 7:** 보드 상세 페이지
  - `app/board/[id]/page.tsx` - 동적 라우트 (인증 포함)
  - `components/BoardView.tsx` - 보드 뷰 (툴바, 유저 필터)
  - `components/List.tsx` - 리스트 컴포넌트
  - `components/Card.tsx` - 카드 (레이블, 체크리스트 진행도, 댓글 수)

- ✅ **Task 8:** 리스트 생성 기능
  - `components/CreateListButton.tsx` - 인라인 폼으로 리스트 추가
  - Supabase에 리스트 저장, router.refresh()로 자동 갱신

- ✅ **Task 9:** 카드 생성 기능
  - `components/CreateCardButton.tsx` - textarea 폼으로 카드 추가
  - Supabase에 카드 저장, position 순서 관리

---

- ✅ **Task 10:** 카드 상세 모달
  - `components/CardModal.tsx` - 설명 편집, 카드 삭제
  - 레이블·멤버 표시 (읽기 전용), 체크리스트·댓글 플레이스홀더

- ✅ **Task 11:** 카드 Drag & Drop
  - `useSortable` 적용 (Card 컴포넌트)
  - 같은 리스트 내 재정렬, 다른 리스트로 이동
  - `PointerSensor` distance:8px 설정 (클릭/드래그 구분)

- ✅ **Task 12:** 리스트 Drag & Drop
  - `useSortable` 적용 (List 컴포넌트 헤더)
  - 가로 방향 리스트 순서 변경
  - BoardView에 DndContext + DragOverlay 통합

---

- ✅ **Task 13:** 체크리스트 아이템
  - `ChecklistItem` - 토글/편집/삭제, 마감일 지정
  - `ChecklistSection` - 진행률 바 포함

- ✅ **Task 14:** 레이블 시스템
  - `LabelPicker` - 8가지 컬러 프리셋, 보드 레이블 생성/토글
  - `LabelsSection` - 카드 모달 내 레이블 섹션

- ✅ **Task 15:** 댓글 시스템
  - `Comment` - 작성자만 수정/삭제, 상대적 시간 표시
  - `CommentsSection` - 댓글 추가 폼

- ✅ **Task 16:** 멤버 할당
  - `MemberPicker` - 전체 유저 목록에서 카드 멤버 추가/제거
  - `MembersSection` - 카드 모달 내 멤버 섹션

- ✅ **Task 17:** 달력 뷰
  - `CalendarView` - FullCalendar로 체크리스트/카드 마감일 표시
  - 달력 이벤트 클릭 시 카드 모달 오픈

---

- ✅ **Task 18:** 알림 시스템
  - `lib/notifications.ts` - `createNotification()`, `sendBrowserNotification()` 유틸
  - `components/NotificationBell.tsx` - 알림 벨 (뱃지, 드롭다운, 읽음 처리)
  - `components/Header.tsx` - NotificationBell 통합 (`userId` prop 추가)
  - 멤버 추가 시 알림, 댓글 추가 시 카드 멤버에게 알림

- ✅ **Task 19:** 실시간 업데이트
  - `hooks/useRealtimeSubscription.ts` - 7개 테이블 Supabase Realtime 구독
  - BoardView에 통합 (`useRealtimeSubscription(board.id)`)

- ✅ **Task 20:** 최종 마무리
  - PROGRESS.md 업데이트 완료

---

## ✅ 모든 작업 완료!

---

## 🚀 개발 서버 실행 방법

### 1. 프로젝트 폴더로 이동
```bash
cd "C:\Users\ADMIN\AppData\Local\WEMEETS\yulink\yulink files\■■■Claude House■■■\yu-rello"
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. 브라우저에서 확인
```
http://localhost:3000
```

### 4. 개발 서버 종료
터미널에서 `Ctrl + C`

---

## 👤 Git 계정 정보

- **이름:** ParkSanghyeok076
- **이메일:** psh092929@gmail.com
- **GitHub:** https://github.com/ParkSanghyeok076/YU-rello

새 PC에서 처음 커밋 시 아래 명령어 실행:
```bash
git config user.email "psh092929@gmail.com"
git config user.name "ParkSanghyeok076"
```

---

## ⚠️ 새 PC 시작 전 필수 작업

### `.env.local` 파일 생성 (매 PC마다 직접 생성 필요 - Git에 저장 안 됨)

프로젝트 루트에 `.env.local` 파일을 만들고 아래 내용 입력:
```
NEXT_PUBLIC_SUPABASE_URL=https://mennynwvgkzmohoclrxs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=(Supabase Dashboard → Settings → API → anon public 키)
```

**API 키 찾는 방법:**
1. https://supabase.com/dashboard 접속
2. 프로젝트 `mennynwvgkzmohoclrxs` 선택
3. Settings → API → Project API keys → `anon public` 키 복사

> 이 파일이 없으면 로컬호스트 실행 시 서버 에러 발생!

---

## 📝 중요 사항

### Supabase 설정
- **프로젝트 URL:** https://mennynwvgkzmohoclrxs.supabase.co
- **환경 변수:** `.env.local` 파일에 설정됨 (Git 미포함 - 매 PC마다 생성 필요)
- **인증:** 이메일 확인 필요 (회원가입 후 Supabase Dashboard에서 수동 확인 가능)

### 테스트 계정 만들기
1. 개발 서버 실행 후 `/signup` 접속
2. 이메일, 비밀번호, 이름 입력
3. Supabase Dashboard → Authentication → Users에서 이메일 확인 처리
4. `/login`에서 로그인

### Git 작업
```bash
# 변경사항 확인
git status

# 커밋
git add .
git commit -m "커밋 메시지"

# 푸시
git push origin master

# 최신 코드 받기
git pull origin master
```

---

## 🎨 디자인 스펙

### 색상
- **배경:** Navy blue (`#1a2b4a`)
- **밝은 Navy:** `#2a3b5a`
- **어두운 Navy:** `#0a1b3a`
- **카드/리스트:** White (`#ffffff`)
- **텍스트:** White (배경), Navy (카드)

### 폰트
- **로고:** Orbitron (Google Fonts)
- **본문:** 시스템 기본 폰트

---

## 📚 참고 문서

- **디자인 문서:** `docs/plans/2026-02-20-yu-rello-design.md`
- **구현 계획:** `docs/plans/2026-02-20-yu-rello-implementation.md`
- **GitHub:** https://github.com/ParkSanghyeok076/YU-rello

---

## 🐛 알려진 이슈

### 해결됨
- ✅ Supabase auth-helpers 버전 문제 → `@supabase/ssr`로 마이그레이션
- ✅ Tailwind v4 커스텀 색상 문제 → `@theme` 문법 수정
- ✅ Next.js 16 cookies() async 문제 → await 추가

### 주의사항
- Next.js 16에서 `cookies()`는 async 함수입니다
- Tailwind v4는 기존 v3와 문법이 다릅니다 (`@theme` 사용)
- Supabase는 `@supabase/ssr` 패키지를 사용합니다

---

## 📦 설치된 패키지

### Dependencies
- next: 16.1.6
- react: 19.2.3
- @supabase/ssr: latest
- @supabase/supabase-js: 2.97.0
- @dnd-kit/core: 6.3.1
- @dnd-kit/sortable: 10.0.0
- @fullcalendar/react: 6.1.20
- date-fns: 4.1.0

### DevDependencies
- typescript: 5
- tailwindcss: 4
- @tailwindcss/postcss: 4

---

## 🏠 집에서 처음 시작하기 (프로젝트 폴더가 없는 경우)

### 1단계: 작업할 폴더 생성
원하는 위치에 폴더를 만듭니다. 예:
- `C:\Projects\YU-rello`
- `D:\dev\YU-rello`

### 2단계: CMD(명령 프롬프트) 열기
**방법 1:** 폴더에서 직접 열기
1. 생성한 폴더를 파일 탐색기로 엽니다
2. 주소창에 `cmd` 입력 후 Enter

**방법 2:** 시작 메뉴에서 열기
1. Windows 키 누름
2. "cmd" 입력
3. 명령 프롬프트 실행 후 폴더로 이동:
   ```bash
   cd C:\Projects\YU-rello
   ```

### 3단계: Git Clone
```bash
git clone https://github.com/ParkSanghyeok076/YU-rello.git .
```
**주의:** 마지막에 `.` (점)을 꼭 입력하세요! (현재 폴더에 클론)

### 4단계: 패키지 설치
```bash
npm install
```
(2-3분 소요)

### 5단계: Claude Code 실행
같은 CMD 창에서:
```bash
claude
```

### 6단계: Claude에게 작업 요청
Claude가 실행되면 다음과 같이 입력:
```
Task 7부터 계속 진행해줘. PROGRESS.md 파일을 참고해.
```

또는

```
보드 상세 페이지(Task 7)부터 구현해줘
```

---

## 🎯 다음 세션 시작 방법 (이미 프로젝트가 있는 경우)

### 1단계: 프로젝트 폴더 열기
```bash
cd C:\Projects\YU-rello
```
(본인의 프로젝트 경로로 변경)

### 2단계: 최신 코드 받기
```bash
git pull origin master
```

### 3단계: Claude Code 실행
```bash
claude
```

### 4단계: Claude에게 작업 요청
```
Task 7부터 계속 진행해줘
```

---

## 💡 개발 서버 실행 (선택사항)

작업하면서 실시간으로 화면을 보려면:

**별도의 CMD 창을 열어서:**
```bash
cd C:\Projects\YU-rello
npm run dev
```

그 다음 브라우저에서:
```
http://localhost:3000
```

---

**🏠 집에서 화이팅! 다음 세션에서 Task 7부터 시작하면 됩니다!**
