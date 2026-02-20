# YU-rello 디자인 문서

작성일: 2026-02-20

## 프로젝트 개요

YU-rello는 Trello를 모델로 한 협업 도구로, 2명의 사용자가 보드, 리스트, 카드를 통해 작업을 관리하고 협업할 수 있는 웹 애플리케이션입니다.

### 핵심 목표
- 2명이 사용하는 간단하고 직관적인 협업 도구
- 설치 없이 브라우저에서 바로 사용 가능
- 무료 클라우드 호스팅으로 유지보수 부담 최소화

## 요구사항

### 기능 요구사항

**핵심 구조:**
- Board → List → Card 3단계 위계 구조

**카드 기능:**
- 제목, 설명, 마감일
- 체크리스트 (각 항목마다 개별 마감일 지정 가능)
- 색상 라벨
- 드래그앤드롭으로 이동

**협업 기능:**
- 로그인/계정 시스템
- 댓글
- 멤버 할당
- 브라우저 푸시 알림

**뷰:**
1. 보드 뷰 - 리스트들이 가로로 나열, 카드 클릭 시 상세 정보 표시
2. 달력 뷰 - 모든 체크리스트 세부 task를 마감일 기준으로 달력에 표시
3. 뷰 전환 버튼 - 두 뷰를 쉽게 전환

**필터링 기능:**
- 사용자별 필터링: 특정 사용자를 선택하여 해당 사용자가 할당된 카드만 표시
- 필터 적용 시 할당되지 않은 카드는 숨김
- "모두 보기" 옵션으로 필터 해제 가능

**삭제 기능:**
- 보드, 리스트, 카드, 체크리스트 항목, 댓글, 라벨 삭제
- 상위 항목 삭제 시 하위 항목도 함께 삭제 (CASCADE)
- 삭제 전 확인 다이얼로그

**제외된 기능:**
- 파일 첨부
- 활동 내역 로그
- 키워드 검색 (MVP에서 제외, 추후 추가 가능)

### 비기능 요구사항

**사용자:**
- 웹 개발 초보자
- 회사 컴퓨터 사용 (설치 제약 많음)
- Docker 등 복잡한 설치 불가

**배포:**
- 무료 클라우드 호스팅 (Vercel + Supabase)
- 설치 불필요
- 브라우저만 있으면 접속 가능

## 기술 스택

### 전체 아키텍처

```
[사용자 브라우저]
       ↓
[Next.js 앱 (Vercel에 배포)]
  - 프론트엔드 (React 컴포넌트)
  - 페이지 라우팅
       ↓
[Supabase (무료 호스팅)]
  - PostgreSQL 데이터베이스
  - 인증 시스템
  - 실시간 구독 (Realtime)
  - Storage (향후 확장용)
```

### 프론트엔드
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- @dnd-kit/core (드래그앤드롭)
- FullCalendar (달력 뷰)
- React Hook Form (폼 관리)

### 백엔드
- Supabase
  - 자동 REST API
  - Row Level Security (데이터 보안)
  - 실시간 구독 (변경사항 자동 반영)

### 배포
- Vercel (프론트엔드)
- Supabase Cloud (백엔드)
- GitHub (코드 저장 + 자동 배포 트리거)

## 데이터베이스 구조

### 테이블 설계

#### 1. profiles (사용자 프로필)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. boards (보드)
```sql
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. lists (리스트)
```sql
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. cards (카드)
```sql
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. checklist_items (체크리스트 항목)
```sql
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  completed BOOLEAN DEFAULT FALSE,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. labels (색상 라벨)
```sql
CREATE TABLE labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);
```

#### 7. card_labels (카드-라벨 연결)
```sql
CREATE TABLE card_labels (
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  label_id UUID REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, label_id)
);
```

#### 8. card_members (카드 멤버 할당)
```sql
CREATE TABLE card_members (
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, user_id)
);
```

#### 9. comments (댓글)
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 10. notifications (알림)
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 주요 특징
- CASCADE 삭제로 상위 항목 삭제 시 하위 항목 자동 삭제
- position 필드로 드래그앤드롭 순서 관리
- 체크리스트 항목마다 개별 마감일 지정 가능
- 두 사용자가 모든 보드를 공유하므로 복잡한 권한 테이블 불필요

## UI 컴포넌트 구조

### 디자인 시스템

**색상 팔레트:**
- **주 배경색**: 남색 (Navy Blue) - `#1a2b4a` 또는 유사 톤
- **리스트 배경**: 흰색 (White) - `#ffffff`
- **카드 배경**: 흰색 (White) - `#ffffff`
- **강조색**: 밝은 파란색, 연한 회색 (텍스트/아이콘용)
- **텍스트**: 남색 계열 (리스트/카드), 흰색 (헤더/배경)

**타이포그래피:**
- **로고 (YU-rello)**: 미래지향적인 글씨체 (예: Orbitron, Exo 2, Space Grotesk)
  - 위치: 헤더 최상단 좌측
  - 스타일: 굵고 현대적인 느낌, 약간의 기울임 또는 기하학적 요소
  - 색상: 흰색 또는 밝은 파란색

**전체 느낌:**
- 깔끔하고 현대적인 디자인
- 남색 배경으로 전문적이고 차분한 느낌
- 흰색 리스트/카드로 콘텐츠 가독성 극대화
- 미니멀한 UI 요소

### 전체 레이아웃

```
┌─────────────────────────────────────────────┐
│  헤더 (남색 배경 #1a2b4a)                     │
│  [YU-rello 로고] [보드 선택] [알림🔔] [프로필]│
└─────────────────────────────────────────────┘
│  툴바 (남색 배경, 약간 밝은 톤)              │
│  [뷰 전환: 보드뷰 | 달력뷰]  [필터: 👤 사용자]│
└─────────────────────────────────────────────┘
│                                             │
│  메인 영역 (남색 배경 #1a2b4a)               │
│  ┌───────────────────────────────────────┐ │
│  │                                       │ │
│  │    현재 뷰 (보드 뷰 또는 달력 뷰)      │ │
│  │    - 리스트/카드는 흰색 배경          │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

### 1. 보드 뷰

**색상 구성:**
- 배경: 남색 (#1a2b4a)
- 리스트: 흰색 배경, 약간의 그림자
- 카드: 흰색 배경

**구조:**
```
남색 배경
┌──────────┬──────────┬──────────┐
│ List 1   │ List 2   │ List 3   │ ← 가로 스크롤
│(흰색 배경)│(흰색 배경)│(흰색 배경)│
├──────────┼──────────┼──────────┤
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │
│ │Card 1│ │ │Card 4│ │ │Card 7│ │
│ │(흰색)│ │ │(흰색)│ │ │(흰색)│ │
│ └──────┘ │ └──────┘ │ └──────┘ │
│ ┌──────┐ │ ┌──────┐ │          │
│ │Card 2│ │ │Card 5│ │          │
│ └──────┘ │ └──────┘ │          │
│ ┌──────┐ │ ┌──────┐ │          │
│ │Card 3│ │ │Card 6│ │          │
│ └──────┘ │ └──────┘ │          │
│ [+ 카드] │ [+ 카드] │ [+ 카드] │
└──────────┴──────────┴──────────┘
[+ 리스트 추가] (흰색 버튼)
```

**카드 미리보기 요소:**
- 제목
- 색상 라벨 (상단에 작은 컬러 바)
- 마감일 (있으면 표시)
- 할당된 멤버 아바타
- 체크리스트 진행률 (예: ✓ 3/5)
- 댓글 수 (있으면 💬 아이콘)

### 2. 카드 상세 모달

카드 클릭 시 표시:

```
┌────────────────────────────────────────┐
│  [색상라벨] 카드 제목            [X]   │
├────────────────────────────────────────┤
│  📝 설명                               │
│  ┌──────────────────────────────────┐ │
│  │ 설명 내용...                     │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ✓ 체크리스트                          │
│  ☐ Task 1  📅 2026-02-25              │
│  ☑ Task 2  📅 2026-02-23              │
│  ☐ Task 3  (마감일 없음)               │
│  [+ 항목 추가]                         │
│                                        │
│  👥 멤버                               │
│  [아바타1] [아바타2]                   │
│                                        │
│  💬 댓글                               │
│  [사용자1] 댓글 내용... (1시간 전)     │
│  [댓글 작성...]                        │
└────────────────────────────────────────┘
```

### 3. 달력 뷰

```
┌─────────────────────────────────────────┐
│         2026년 2월                      │
├───┬───┬───┬───┬───┬───┬───┐
│일 │월 │화 │수 │목 │금 │토 │
├───┼───┼───┼───┼───┼───┼───┤
│   │   │   │   │   │   │ 1 │
├───┼───┼───┼───┼───┼───┼───┤
│ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │
│   │   │   │   │   │   │   │
│   │   │   │✓Task1│   │   │   │ ← 체크리스트 항목
├───┼───┼───┼───┼───┼───┼───┤
│   │   │   │   │   │   │   │
└───┴───┴───┴───┴───┴───┴───┘
```

**달력 이벤트:**
- 각 체크리스트 항목이 이벤트로 표시
- 클릭하면 해당 카드 상세 모달 열림
- 완료된 항목은 체크 표시 (☑)
- 미완료 항목은 빈 체크 (☐)

### 4. 뷰 전환 및 필터 툴바

**위치:** 헤더 바로 아래, 남색 배경 (약간 밝은 톤)

**좌측: 뷰 전환 버튼**
```
[ 📋 보드 뷰 ] [ 📅 달력 뷰 ]
   (활성)        (비활성)
```

**우측: 사용자 필터**
```
👤 필터: [모두 보기 ▼]
        ├─ 모두 보기
        ├─ 사용자 1
        └─ 사용자 2
```

**필터 동작:**
- 기본값: "모두 보기" (모든 카드 표시)
- 특정 사용자 선택 시: 해당 사용자가 할당된 카드만 표시
- 할당되지 않은 카드는 숨김
- 보드 뷰와 달력 뷰 모두에 적용

## 핵심 기능 동작 방식

### 1. 드래그앤드롭

**라이브러리:** @dnd-kit/core

**동작:**
- 카드를 드래그해서 같은 리스트 내에서 순서 변경
- 카드를 다른 리스트로 이동
- 리스트 자체도 좌우로 순서 변경 가능

**구현 방식:**
- 드래그 종료 시 `position` 값을 재계산해서 데이터베이스 업데이트
- Supabase의 자동 실시간 구독으로 다른 사용자 화면에도 즉시 반영

### 2. 실시간 협업

**Supabase Realtime 활용:**

```javascript
// 예시: 카드 변경사항 실시간 구독
supabase
  .channel('cards')
  .on('postgres_changes',
      { event: '*', schema: 'public', table: 'cards' },
      (payload) => {
        // 카드 생성/수정/삭제 시 화면 자동 업데이트
      })
  .subscribe()
```

**동작:**
- 한 명이 카드를 추가/수정/삭제하면
- 다른 사람 화면에 새로고침 없이 즉시 반영
- 댓글, 체크리스트 변경도 마찬가지

### 3. 삭제 기능

**삭제 가능한 항목:**
- 보드 삭제 → 그 안의 모든 리스트, 카드도 함께 삭제
- 리스트 삭제 → 그 안의 모든 카드도 함께 삭제
- 카드 삭제 → 체크리스트, 댓글도 함께 삭제
- 체크리스트 항목 삭제
- 댓글 삭제
- 라벨 삭제

**안전장치:**
- 삭제 전 확인 다이얼로그 표시
  - "정말 이 보드를 삭제하시겠습니까? 모든 리스트와 카드가 삭제됩니다."
- 중요한 삭제(보드, 리스트)는 이름 재입력 요구 가능

**데이터베이스 설정:**
- CASCADE 설정으로 상위 항목 삭제 시 하위 항목 자동 삭제
- 예: `boards` 삭제 → `lists` → `cards` → `checklist_items` 모두 자동 삭제

**UI:**
- 각 항목에 🗑️ (휴지통) 아이콘 또는 `...` 메뉴에서 삭제 옵션

### 4. 알림 시스템

**알림이 발생하는 경우:**
- 카드에 멤버로 할당되었을 때
- 할당된 카드에 새 댓글이 달렸을 때
- 할당된 카드의 마감일이 임박했을 때 (하루 전)

**브라우저 푸시 알림:**

```javascript
// 사용자가 알림 권한 허용 시
Notification.requestPermission()

// 새 알림 발생 시
new Notification('YU-rello', {
  body: '새 댓글이 달렸습니다.',
  icon: '/logo.png'
})
```

**알림 센터:**
- 헤더의 🔔 아이콘 클릭 시 드롭다운
- 읽지 않은 알림 개수 표시
- 알림 클릭 시 해당 카드로 이동

### 5. 사용자 인증

**Supabase Auth 활용:**

**회원가입/로그인:**
- 이메일 + 비밀번호 방식
- Supabase가 자동으로 이메일 인증 메일 발송
- 로그인 후 JWT 토큰으로 세션 관리

**보안:**
- Row Level Security (RLS) 정책 설정
  - 로그인한 사용자만 데이터 접근 가능
  - 두 명 모두 모든 보드/카드 읽기/쓰기 가능

### 6. 사용자 필터링

**기능:**
- 헤더 아래 툴바에서 사용자 선택 드롭다운 제공
- "모두 보기", "사용자 1", "사용자 2" 옵션

**동작:**
- **모두 보기**: 모든 카드 표시 (기본값)
- **특정 사용자 선택**:
  - card_members 테이블에서 해당 사용자가 할당된 카드만 필터링
  - 보드 뷰: 필터링된 카드만 표시, 빈 리스트도 그대로 표시
  - 달력 뷰: 필터링된 카드의 체크리스트 항목만 표시

**구현:**
```javascript
// 예시: 필터링 쿼리
const { data } = await supabase
  .from('cards')
  .select('*, card_members(*)')
  .eq('card_members.user_id', selectedUserId)
```

### 7. 키워드 검색 (향후 추가)

**1단계 (MVP):** 사용자 필터링만
**2단계 (추가):** 키워드 검색
**3단계 (추가):** 라벨별 필터

## 개발 전략

### 단계별 구현 계획

초보자이므로 한 번에 모든 기능을 만들지 말고, 단계별로 나눠서 진행:

**1단계: 기본 구조 (MVP)**
- Next.js 프로젝트 생성
- Supabase 연결
- 로그인/회원가입 기능
- 보드 생성/조회/삭제
- 리스트 생성/조회/삭제
- 카드 생성/조회/삭제

**2단계: 드래그앤드롭**
- 카드 드래그앤드롭
- 리스트 순서 변경
- position 값 업데이트

**3단계: 카드 상세 기능**
- 카드 설명 (description)
- 체크리스트 항목 추가/수정/삭제
- 체크리스트 항목별 마감일

**4단계: 협업 기능**
- 댓글 시스템
- 멤버 할당
- 색상 라벨

**5단계: 달력 뷰**
- FullCalendar 통합
- 체크리스트 항목을 달력에 표시
- 뷰 전환 버튼

**6단계: 알림 시스템**
- 알림 데이터베이스 구조
- 브라우저 푸시 알림
- 알림 센터

**7단계: 실시간 협업**
- Supabase Realtime 구독
- 변경사항 자동 반영

**8단계: 사용자 필터링**
- 툴바에 사용자 선택 드롭다운 추가
- 선택된 사용자에 따라 카드 필터링
- 보드 뷰 및 달력 뷰에 적용

**9단계: UI 디자인 적용**
- 남색 배경 (#1a2b4a)
- 흰색 리스트/카드
- YU-rello 로고 (미래지향적 글씨체)
- 전체 색상 팔레트 적용

**10단계: 추가 기능 (선택)**
- 키워드 검색
- 라벨별 필터
- 카드 아카이브

## 배포 전략

### 초기 설정 (한 번만)

**1. GitHub 리포지토리 생성**
- github.com에서 새 리포지토리 생성
- 코드 푸시

**2. Supabase 프로젝트 생성**
- supabase.com 무료 계정 생성
- 새 프로젝트 생성
- 데이터베이스 테이블 생성 (SQL 에디터 사용)

**3. Vercel 배포**
- vercel.com 무료 계정 생성 (GitHub 계정으로 로그인)
- "Import Project" 클릭
- GitHub 리포지토리 선택
- 환경 변수 설정 (Supabase URL, API Key)
- Deploy 클릭 → 자동 배포 완료!

### 이후 업데이트

```
1. 코드 수정
2. GitHub에 푸시
3. Vercel이 자동으로 감지해서 재배포
4. 1-2분 후 새 버전 배포 완료
```

### 환경 변수

**필요한 설정:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

이것만 Vercel에 입력하면 됩니다!

### 예상 비용

**완전 무료:**
- Vercel 무료 플랜: 개인 프로젝트로 충분
- Supabase 무료 플랜: 500MB 데이터베이스, 2명 사용에 충분
- GitHub: 무료

### 성능 고려사항

**2명 사용 기준:**
- 데이터베이스 쿼리 최적화는 나중에
- 무료 플랜으로 충분히 빠름
- 이미지 최적화는 Next.js가 자동으로 처리

## 다음 단계

이 디자인이 승인되면:

1. 디자인 문서를 git에 커밋
2. `/superpowers:writing-plans` 스킬을 호출하여 상세한 구현 계획 작성
3. 단계별로 개발 시작

## 참고 사항

- 초보자를 위한 프로젝트이므로 복잡한 최적화보다는 동작하는 코드 우선
- 각 단계마다 테스트하고 다음 단계로 진행
- 막히면 언제든 질문하고 도움 요청
- 완벽함보다는 작동하는 MVP를 먼저 만드는 것이 목표
