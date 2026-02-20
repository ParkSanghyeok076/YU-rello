# YU-rello 개발 진행 상황

**마지막 업데이트:** 2026-02-20

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

## 🚧 다음 작업 (Task 7부터)

### Task 7: 보드 상세 페이지 (진행 예정)
**파일:**
- `app/board/[id]/page.tsx` - 동적 라우트
- `components/BoardView.tsx` - 보드 뷰 컴포넌트
- `components/List.tsx` - 리스트 컴포넌트
- `components/Card.tsx` - 카드 컴포넌트

**기능:**
- 보드 내 리스트 목록 표시
- 각 리스트의 카드 표시
- 레이블, 체크리스트 진행도, 댓글 수 표시
- 사용자 필터링

**구현 계획:** `docs/plans/2026-02-20-yu-rello-implementation.md` 라인 1306-1589 참고

---

### Task 8: 리스트 생성 기능
**파일:**
- `components/CreateListButton.tsx`
- `components/BoardView.tsx` (수정)

---

### Task 9: 카드 CRUD 기능
**파일:**
- `components/CreateCardButton.tsx`
- `components/CardModal.tsx`
- 카드 생성/수정/삭제 기능

---

### Task 10: Drag & Drop
**파일:**
- BoardView, List, Card 컴포넌트 수정
- @dnd-kit 라이브러리 사용

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

## 📝 중요 사항

### Supabase 설정
- **프로젝트 URL:** https://mennynwvgkzmohoclrxs.supabase.co
- **환경 변수:** `.env.local` 파일에 설정됨
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
