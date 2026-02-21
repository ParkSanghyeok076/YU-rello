# 보드 멤버 접근 제어 설계

**날짜:** 2026-02-21
**상태:** 승인됨

---

## 개요

보드를 만든 사람만 기본적으로 볼 수 있고, 초대받은 멤버만 접근 가능하도록 변경한다.
초대받지 않은 유저는 대시보드에서도, URL 직접 접근 시에도 완전히 차단된다.

---

## 권한 모델

- **단순 (멤버/비멤버):** board_members에 있으면 접근 가능, 없으면 완전 차단
- 삭제/멤버 관리: `boards.created_by === currentUserId` 로 구분 (별도 role 컬럼 없음)

---

## 데이터베이스

### 새 테이블: `board_members`

```sql
CREATE TABLE board_members (
  board_id uuid REFERENCES boards(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (board_id, user_id)
);

ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

-- 자신이 속한 board_members 행만 조회 가능
CREATE POLICY "board_members viewable by members"
  ON board_members FOR SELECT
  USING (user_id = auth.uid());

-- 보드를 만든 사람만 멤버 추가/제거 가능
CREATE POLICY "board_members manageable by board creator"
  ON board_members FOR ALL
  USING (
    EXISTS (SELECT 1 FROM boards WHERE id = board_id AND created_by = auth.uid())
  );
```

### boards RLS 정책 변경

기존 SELECT 정책(모든 유저에게 허용) 제거 후 교체:

```sql
-- 기존 정책 제거 (정책 이름은 Supabase Dashboard에서 확인)
DROP POLICY IF EXISTS "boards are viewable by everyone" ON boards;
DROP POLICY IF EXISTS "Enable read access for all users" ON boards;

-- 새 정책: board_members에 있는 보드만 조회 가능
CREATE POLICY "boards visible to members only"
  ON boards FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM board_members WHERE board_id = id AND user_id = auth.uid())
  );
```

### 기존 데이터 마이그레이션

```sql
-- 기존 보드의 created_by를 board_members에 owner로 등록
INSERT INTO board_members (board_id, user_id)
SELECT id, created_by FROM boards
ON CONFLICT DO NOTHING;
```

> **반드시 마이그레이션을 먼저 실행해야** 기존 보드들이 안 보이는 상황을 방지할 수 있음.

---

## 코드 변경

### 신규

| 파일 | 역할 |
|---|---|
| `components/BoardMemberManager.tsx` | 현재 멤버 목록 표시 + 유저 초대/제거 드롭다운 |

### 수정

| 파일 | 변경 내용 |
|---|---|
| `lib/supabase/client.ts` | `board_members` 타입 추가 |
| `components/BoardForm.tsx` | 보드 생성 후 자동으로 본인을 `board_members`에 추가 |
| `app/board/[id]/page.tsx` | board_members fetch, `isOwner` prop 전달 |
| `components/BoardView.tsx` | 헤더에 멤버 아바타 + BoardMemberManager 연결, `isOwner` prop 수신 |

---

## UI 설계

### 보드 헤더

```
[ 프로젝트 보드 ]    ●홍  ●박  ●김  + 멤버 초대    [캘린더] [필터]
```

- 멤버 아바타 최대 3개, 초과 시 +N 배지
- `+ 멤버 초대` 버튼: **만든 사람(isOwner)에게만 표시**
- 클릭 시 `BoardMemberManager` 드롭다운 오픈
  - 현재 멤버 목록 (제거 버튼 포함)
  - 전체 유저 목록에서 추가 가능
  - 자기 자신(owner)은 제거 불가

---

## 데이터 흐름

1. 보드 생성 → `boards` insert → `board_members` insert (본인)
2. 대시보드 → `SELECT * FROM boards` → RLS가 자동 필터링 (코드 변경 없음)
3. 보드 접근 → RLS가 `board_members` 체크, 없으면 null 반환 → `/dashboard` 리다이렉트
4. 멤버 초대 → `board_members` insert → 상대방 대시보드에 보드 즉시 노출

---

## 구현 순서

1. Supabase SQL 실행 (수동): 테이블 생성 → RLS 정책 → 마이그레이션
2. `board_members` 타입 추가 (`client.ts`)
3. `BoardForm.tsx` 수정 (보드 생성 시 자동 멤버 등록)
4. `BoardMemberManager.tsx` 신규 생성
5. `app/board/[id]/page.tsx` 수정 (board_members fetch + isOwner)
6. `BoardView.tsx` 수정 (헤더 UI)
