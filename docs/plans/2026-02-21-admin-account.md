# Admin Account Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** psh092929@gmail.com 계정을 admin으로 지정하여 모든 보드 조회, 모든 보드/리스트/카드 삭제, 모든 보드 멤버 관리 권한을 부여한다.

**Architecture:** profiles.is_admin boolean 컬럼으로 admin 여부를 관리한다. RLS 정책을 수정하여 admin이 모든 데이터에 접근/수정할 수 있도록 하고, 앱 레벨에서는 isAdmin prop을 page.tsx → BoardView까지 전달하여 "멤버 초대" 버튼을 admin에게도 노출한다. 리스트/카드 삭제 버튼은 이미 모든 유저에게 표시되므로 RLS 수정만으로 충분하다.

**Tech Stack:** Next.js 16, Supabase (RLS, SSR), TypeScript

---

## Task 0: Supabase SQL 실행 (수동 작업)

> ⚠️ 이 Task는 코드 변경 없이 Supabase Dashboard → SQL Editor에서 실행한다.

**Step 1: is_admin 컬럼 추가**

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
```

**Step 2: admin 계정 설정**

```sql
UPDATE profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'psh092929@gmail.com'
);
```

확인 방법: `SELECT email, is_admin FROM auth.users JOIN profiles ON profiles.id = auth.users.id WHERE email = 'psh092929@gmail.com';` → is_admin = true 확인

**Step 3: boards SELECT RLS 수정**

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

**Step 4: boards DELETE RLS 수정**

```sql
DROP POLICY IF EXISTS "boards deletable by creator" ON boards;
DROP POLICY IF EXISTS "boards deletable by creator or admin" ON boards;

CREATE POLICY "boards deletable by creator or admin"
  ON boards FOR DELETE
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

**Step 5: lists DELETE RLS 수정**

```sql
DROP POLICY IF EXISTS "lists deletable by board creator" ON lists;
DROP POLICY IF EXISTS "lists deletable by board creator or admin" ON lists;

CREATE POLICY "lists deletable by board creator or admin"
  ON lists FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM boards WHERE id = board_id AND created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

**Step 6: cards DELETE RLS 수정**

```sql
DROP POLICY IF EXISTS "cards deletable by board creator" ON cards;
DROP POLICY IF EXISTS "cards deletable by board creator or admin" ON cards;

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

**Step 7: board_members ALL RLS 수정**

```sql
DROP POLICY IF EXISTS "board_members manageable by board creator" ON board_members;
DROP POLICY IF EXISTS "board_members manageable by creator or admin" ON board_members;

CREATE POLICY "board_members manageable by creator or admin"
  ON board_members FOR ALL
  USING (
    EXISTS (SELECT 1 FROM boards WHERE id = board_id AND created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

완료 후 코드 작업으로 넘어간다.

---

## Task 1: profiles 타입에 is_admin 추가

**Files:**
- Modify: `lib/supabase/client.ts` (profiles Row/Insert/Update 섹션)

**현재 코드 (lib/supabase/client.ts:6-29):**

```typescript
profiles: {
  Row: {
    id: string
    email: string
    name: string
    avatar_url: string | null
    created_at: string
  }
  Insert: {
    id: string
    email: string
    name: string
    avatar_url?: string | null
    created_at?: string
  }
  Update: {
    id?: string
    email?: string
    name?: string
    avatar_url?: string | null
    created_at?: string
  }
  Relationships: []
}
```

**Step 1: profiles Row에 is_admin 추가**

`lib/supabase/client.ts` 파일에서 profiles.Row의 `created_at: string` 다음 줄에 `is_admin: boolean` 추가:

```typescript
profiles: {
  Row: {
    id: string
    email: string
    name: string
    avatar_url: string | null
    created_at: string
    is_admin: boolean
  }
  Insert: {
    id: string
    email: string
    name: string
    avatar_url?: string | null
    created_at?: string
    is_admin?: boolean
  }
  Update: {
    id?: string
    email?: string
    name?: string
    avatar_url?: string | null
    created_at?: string
    is_admin?: boolean
  }
  Relationships: []
}
```

**Step 2: TypeScript 오류 없음 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음 (또는 기존 any 관련 경고만)

**Step 3: Commit**

```bash
git add lib/supabase/client.ts
git commit -m "feat: add is_admin field to profiles type"
```

---

## Task 2: board/[id]/page.tsx — isAdmin fetch 및 prop 전달

**Files:**
- Modify: `app/board/[id]/page.tsx`

**목표:** 현재 유저의 is_admin 값을 profiles 테이블에서 조회하고, `isAdmin` prop으로 BoardView에 전달한다.

**현재 코드 (app/board/[id]/page.tsx:67-89):**

```typescript
  // Fetch all users for filter
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, email') as { data: Pick<Profile, 'id' | 'name' | 'email'>[] | null; error: unknown }

  // board_members fetch (멤버 목록 + 프로필)
  const { data: boardMembers } = await supabase
    .from('board_members')
    .select('user_id, profiles(*)')
    .eq('board_id', id) as { data: any[] | null; error: unknown }

  // 현재 유저가 보드 owner인지 확인
  const isOwner = board.created_by === session.user.id

  return (
    <BoardView
      board={board}
      initialLists={lists || []}
      users={users || []}
      currentUserId={session.user.id}
      boardMembers={boardMembers || []}
      isOwner={isOwner}
    />
  )
```

**Step 1: isAdmin fetch 추가**

`board_members fetch` 바로 아래, `isOwner` 줄 위에 다음 코드를 추가한다:

```typescript
  // 현재 유저의 admin 여부 조회
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single() as { data: { is_admin: boolean } | null; error: unknown }

  const isAdmin = currentProfile?.is_admin ?? false
```

**Step 2: BoardView에 isAdmin prop 전달**

return 문의 `<BoardView ... />` 에 `isAdmin={isAdmin}` 추가:

```typescript
  return (
    <BoardView
      board={board}
      initialLists={lists || []}
      users={users || []}
      currentUserId={session.user.id}
      boardMembers={boardMembers || []}
      isOwner={isOwner}
      isAdmin={isAdmin}
    />
  )
```

**Step 3: TypeScript 오류 확인**

```bash
npx tsc --noEmit
```

Expected: BoardView가 isAdmin prop을 아직 정의하지 않아서 타입 오류 발생 → Task 3에서 수정

**Step 4: Commit (Task 3 완료 후 함께)**

Task 3 완료 후 두 파일을 같이 커밋한다.

---

## Task 3: BoardView.tsx — isAdmin prop 수신 및 버튼 조건 수정

**Files:**
- Modify: `components/BoardView.tsx`

**목표:** `isAdmin` prop을 받아서 `isOwner || isAdmin` 으로 "멤버 초대" 버튼 노출 조건을 수정한다.

**현재 코드 (components/BoardView.tsx:28-37):**

```typescript
type BoardViewProps = {
  board: any
  initialLists: any[]
  users: Array<{ id: string; name: string; email: string }>
  currentUserId: string
  boardMembers: Array<{ user_id: string; profiles?: any }>
  isOwner: boolean
}

export function BoardView({ board, initialLists, users, currentUserId, boardMembers: initialBoardMembers, isOwner }: BoardViewProps) {
```

**Step 1: isAdmin prop을 타입과 구조분해에 추가**

타입 정의에 `isAdmin: boolean` 추가:

```typescript
type BoardViewProps = {
  board: any
  initialLists: any[]
  users: Array<{ id: string; name: string; email: string }>
  currentUserId: string
  boardMembers: Array<{ user_id: string; profiles?: any }>
  isOwner: boolean
  isAdmin: boolean
}

export function BoardView({ board, initialLists, users, currentUserId, boardMembers: initialBoardMembers, isOwner, isAdmin }: BoardViewProps) {
```

**Step 2: 멤버 초대 버튼 조건 수정**

현재 코드 (BoardView.tsx:229):
```typescript
      {isOwner && (
```

변경 후:
```typescript
      {(isOwner || isAdmin) && (
```

**Step 3: TypeScript 오류 없음 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음

**Step 4: 두 파일 함께 커밋**

```bash
git add app/board/[id]/page.tsx components/BoardView.tsx
git commit -m "feat: add isAdmin support for board member management"
```

---

## Task 4: 검증

**Step 1: 개발 서버 실행**

```bash
npm run dev
```

**Step 2: psh092929@gmail.com 계정으로 로그인 후 확인**

- [ ] 대시보드에서 **모든 보드** 가 보이는지 확인 (다른 유저의 보드 포함)
- [ ] 다른 유저 보드에 접속 → "**+ 멤버 초대**" 버튼이 표시되는지 확인
- [ ] 다른 유저 보드에서 **리스트 삭제** 성공 확인 (⋯ → 리스트 삭제)
- [ ] 다른 유저 보드에서 **카드 삭제** 성공 확인 (카드 모달 → 카드 삭제)
- [ ] 다른 유저 보드에서 **보드 삭제** 성공 확인 (대시보드 ⋯ → 보드 삭제)
- [ ] 다른 유저 보드에서 **멤버 추가/제거** 성공 확인

**Step 3: 일반 유저 계정으로 로그인 후 확인**

- [ ] 대시보드에서 자신이 멤버인 보드만 보이는지 확인
- [ ] 다른 유저 보드에 접근 불가 확인 (URL 직접 입력 시 대시보드로 리다이렉트)
- [ ] 자신이 owner인 보드에서만 "**+ 멤버 초대**" 표시 확인

**Step 4: 최종 커밋 및 푸시**

```bash
git push origin master
```
