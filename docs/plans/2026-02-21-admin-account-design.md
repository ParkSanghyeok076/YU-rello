# 어드민 계정 설계

**날짜:** 2026-02-21
**상태:** 승인됨

---

## 개요

psh092929@gmail.com 계정을 관리자(admin)로 지정하여 모든 보드 조회, 모든 보드/리스트/카드 삭제, 모든 보드 멤버 관리 권한을 부여한다. 유저 관리는 Supabase Dashboard에서 직접 수행 — 앱 내 구현 불필요.

---

## 권한 모델

- **방식:** `profiles.is_admin` boolean 컬럼
- **admin 계정:** psh092929@gmail.com (수동 SQL로 설정)
- **일반 유저는 영향 없음** — is_admin 기본값 false

---

## 데이터베이스 변경

### 1. profiles 테이블에 is_admin 컬럼 추가

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
```

### 2. admin 계정 설정

```sql
UPDATE profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'psh092929@gmail.com'
);
```

### 3. boards SELECT RLS 수정 (admin은 모든 보드 조회)

```sql
DROP POLICY IF EXISTS "boards visible to members only" ON boards;

CREATE POLICY "boards visible to members only"
  ON boards FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM board_members WHERE board_id = id AND user_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

### 4. boards DELETE RLS 수정

```sql
DROP POLICY IF EXISTS "boards deletable by creator" ON boards;
CREATE POLICY "boards deletable by creator or admin"
  ON boards FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

### 5. lists DELETE RLS 수정

```sql
DROP POLICY IF EXISTS "lists deletable by board creator" ON lists;
CREATE POLICY "lists deletable by board creator or admin"
  ON lists FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM boards WHERE id = board_id AND created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

### 6. cards DELETE RLS 수정

```sql
DROP POLICY IF EXISTS "cards deletable by board creator" ON cards;
CREATE POLICY "cards deletable by board creator or admin"
  ON cards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lists l
      JOIN boards b ON b.id = l.board_id
      WHERE l.id = list_id AND b.created_by = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

### 7. board_members ALL RLS 수정 (admin은 모든 보드 멤버 관리)

```sql
DROP POLICY IF EXISTS "board_members manageable by board creator" ON board_members;
CREATE POLICY "board_members manageable by creator or admin"
  ON board_members FOR ALL
  USING (
    EXISTS (SELECT 1 FROM boards WHERE id = board_id AND created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

---

## 코드 변경

### 수정 파일

| 파일 | 변경 내용 |
|---|---|
| `lib/supabase/client.ts` | profiles 타입에 is_admin: boolean 추가 |
| `app/board/[id]/page.tsx` | isAdmin fetch → isOwner \|\| isAdmin prop 전달 |
| `components/BoardView.tsx` | isOwner → isOwner \|\| isAdmin 조건 적용 |
| `components/List.tsx` | 리스트 삭제 조건에 isAdmin 추가 |
| `components/CardModal.tsx` | 카드 삭제 조건에 isAdmin 추가 |

### isAdmin prop 흐름

```
page.tsx
  → profiles에서 is_admin 조회
  → isAdmin = profile?.is_admin ?? false
  → BoardView: isOwner prop을 (isOwner || isAdmin)으로 전달
  → List, CardModal: 기존 isOwner/created_by 조건에 isAdmin OR 추가
```

대시보드는 RLS가 자동 필터링 — 코드 변경 없음.

---

## UI 동작

| 기능 | 일반 멤버 | 보드 owner | admin |
|---|---|---|---|
| 보드 목록 | 자신이 속한 보드만 | 자신이 속한 보드만 | 모든 보드 |
| 보드 삭제 | ✗ | ✓ | ✓ |
| 리스트 삭제 | ✗ | ✓ | ✓ |
| 카드 삭제 | 자신의 카드만 | ✓ | ✓ |
| 멤버 초대/제거 | ✗ | ✓ | ✓ |

---

## 구현 순서

1. Supabase SQL 실행 (수동): is_admin 컬럼 추가 → admin 설정 → RLS 정책 수정
2. `lib/supabase/client.ts` — is_admin 타입 추가
3. `app/board/[id]/page.tsx` — isAdmin fetch + prop 전달
4. `components/BoardView.tsx` — isAdmin 조건 적용
5. `components/List.tsx` — isAdmin 조건 적용
6. `components/CardModal.tsx` — isAdmin 조건 적용
