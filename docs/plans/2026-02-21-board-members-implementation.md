# Board Members Access Control Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 보드를 만든 사람만 기본으로 볼 수 있고, 초대받은 멤버만 접근 가능하도록 RLS + UI를 구현한다.

**Architecture:** `board_members` 테이블과 Supabase RLS로 DB 레벨 접근 제어. `BoardMemberManager` 컴포넌트로 초대/제거 UI 제공. `list_members`와 동일한 패턴 사용.

**Tech Stack:** Next.js 16, React 19, Supabase (supabase-js + RLS), TypeScript, Tailwind v4

---

## 사전 작업 (수동 — Task 0)

Supabase Dashboard → SQL Editor에서 아래 SQL을 **순서대로** 실행한다.

### Step 1: board_members 테이블 생성

```sql
CREATE TABLE board_members (
  board_id uuid REFERENCES boards(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (board_id, user_id)
);

ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_members viewable by members"
  ON board_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "board_members manageable by board creator"
  ON board_members FOR ALL
  USING (
    EXISTS (SELECT 1 FROM boards WHERE id = board_id AND created_by = auth.uid())
  );
```

### Step 2: 기존 boards RLS 정책 교체

Supabase Dashboard → Authentication → Policies → boards 테이블에서 기존 SELECT 정책 이름을 확인 후:

```sql
-- 기존 정책 제거 (이름이 다를 수 있으므로 Dashboard에서 확인 후 실행)
DROP POLICY IF EXISTS "boards are viewable by everyone" ON boards;
DROP POLICY IF EXISTS "Enable read access for all users" ON boards;

-- 새 정책: board_members에 있는 보드만 조회
CREATE POLICY "boards visible to members only"
  ON boards FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM board_members WHERE board_id = id AND user_id = auth.uid())
  );
```

### Step 3: 기존 보드 마이그레이션 (중요!)

```sql
INSERT INTO board_members (board_id, user_id)
SELECT id, created_by FROM boards
ON CONFLICT DO NOTHING;
```

**확인:** Table Editor → board_members에 기존 보드 수만큼 행이 생성됐는지 확인.

---

## Task 1: board_members 타입 추가 (client.ts)

**Files:**
- Modify: `lib/supabase/client.ts`

**Step 1: Database 타입에 board_members 추가**

`lib/supabase/client.ts`를 읽어 `public.Tables` 섹션에서 `list_members` 바로 아래에 추가:

```ts
board_members: {
  Row: {
    board_id: string
    user_id: string
  }
  Insert: {
    board_id: string
    user_id: string
  }
  Update: {
    board_id?: string
    user_id?: string
  }
  Relationships: []
}
```

**Step 2: TypeScript 확인**

```bash
npx tsc --noEmit
```

Expected: 오류 없음.

**Step 3: 커밋**

```bash
git add lib/supabase/client.ts
git commit -m "feat: add board_members to Database type"
```

---

## Task 2: BoardForm.tsx — 보드 생성 시 자동 멤버 등록

**Files:**
- Modify: `components/BoardForm.tsx`

현재 보드를 생성한 후 아무것도 하지 않는다. 생성 직후 `board_members`에 본인을 추가해야 한다.

**Step 1: 보드 insert 직후 board_members insert 추가**

`handleSubmit` 함수 안, 보드 생성 후 `router.push` 이전에 삽입:

```ts
// 기존 코드
const { data, error } = await supabase
  .from('boards')
  .insert({ title, created_by: user.id })
  .select()
  .single() as { data: Board | null; error: unknown }

if (error) throw error

// 추가할 코드 — 본인을 board_members에 등록
const { error: memberError } = await supabase
  .from('board_members')
  .insert({ board_id: (data as Board).id, user_id: user.id })

if (memberError) throw memberError

router.push(`/board/${(data as Board).id}`)
```

**Step 2: TypeScript 확인**

```bash
npx tsc --noEmit
```

**Step 3: 커밋**

```bash
git add components/BoardForm.tsx
git commit -m "feat: auto-register board creator as board member"
```

---

## Task 3: BoardMemberManager 컴포넌트 생성

**Files:**
- Create: `components/BoardMemberManager.tsx`

`ListMemberPicker`와 동일한 구조. 차이점:
- `board_members` 테이블 사용
- `isOwner` prop: false면 읽기 전용(멤버 목록만 표시)
- 현재 로그인 유저(owner)는 제거 불가

**Step 1: 파일 생성**

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type BoardMemberManagerProps = {
  boardId: string
  currentMembers: Array<{ user_id: string; profiles?: any }>
  users: Array<{ id: string; name: string; email: string }>
  isOwner: boolean
  currentUserId: string
  onUpdate: () => void
  onClose: () => void
}

export function BoardMemberManager({
  boardId,
  currentMembers,
  users,
  isOwner,
  currentUserId,
  onUpdate,
  onClose,
}: BoardMemberManagerProps) {
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const handleToggleMember = async (userId: string) => {
    const isAssigned = currentMembers.some(m => m.user_id === userId)
    setLoadingUsers(prev => new Set(prev).add(userId))
    try {
      if (isAssigned) {
        const { error } = await supabase
          .from('board_members')
          .delete()
          .eq('board_id', boardId)
          .eq('user_id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('board_members')
          .insert({ board_id: boardId, user_id: userId })
        if (error) throw error
      }
      onUpdate()
    } catch (error) {
      console.error('Error toggling board member:', error)
    } finally {
      setLoadingUsers(prev => { const s = new Set(prev); s.delete(userId); return s })
    }
  }

  return (
    <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 z-30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-navy">보드 멤버</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
      </div>

      <div className="space-y-2">
        {users.map((user) => {
          const isAssigned = currentMembers.some(m => m.user_id === user.id)
          const isCurrentUser = user.id === currentUserId
          const canToggle = isOwner && !isCurrentUser

          return (
            <div
              key={user.id}
              className="flex items-center gap-3 px-3 py-2 rounded"
            >
              <div className="w-8 h-8 rounded-full bg-navy text-white text-xs flex items-center justify-center flex-shrink-0">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-navy font-medium text-sm">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              {canToggle ? (
                <button
                  onClick={() => handleToggleMember(user.id)}
                  disabled={loadingUsers.has(user.id)}
                  className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-50 ${
                    isAssigned
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-navy text-white hover:bg-navy-light'
                  }`}
                >
                  {loadingUsers.has(user.id) ? '...' : isAssigned ? '제거' : '추가'}
                </button>
              ) : (
                isAssigned && (
                  <span className="text-xs text-gray-400">
                    {isCurrentUser ? '나 (관리자)' : '멤버'}
                  </span>
                )
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 2: TypeScript 확인**

```bash
npx tsc --noEmit
```

**Step 3: 커밋**

```bash
git add components/BoardMemberManager.tsx
git commit -m "feat: add BoardMemberManager component"
```

---

## Task 4: app/board/[id]/page.tsx — board_members fetch 및 isOwner 전달

**Files:**
- Modify: `app/board/[id]/page.tsx`

**Step 1: board_members fetch 추가**

`users` fetch 아래에 추가:

```ts
// board_members fetch (멤버 목록 + 프로필)
const { data: boardMembers } = await supabase
  .from('board_members')
  .select('user_id, profiles(*)')
  .eq('board_id', id) as { data: any[] | null; error: unknown }

// 현재 유저가 보드 owner인지 확인
const isOwner = board.created_by === session.user.id
```

**Step 2: BoardView에 props 전달**

`<BoardView>` 컴포넌트에 두 prop 추가:

```tsx
<BoardView
  board={board}
  initialLists={lists || []}
  users={users || []}
  currentUserId={session.user.id}
  boardMembers={boardMembers || []}
  isOwner={isOwner}
/>
```

**Step 3: TypeScript 확인**

```bash
npx tsc --noEmit
```

(BoardView props 타입 불일치 에러가 나올 수 있음 — Task 5에서 해결)

**Step 4: 커밋**

```bash
git add app/board/[id]/page.tsx
git commit -m "feat: fetch board_members and pass isOwner to BoardView"
```

---

## Task 5: BoardView.tsx — 헤더에 멤버 UI 추가

**Files:**
- Modify: `components/BoardView.tsx`

**Step 1: props 타입에 boardMembers, isOwner 추가**

```ts
// 현재
type BoardViewProps = {
  board: any
  initialLists: any[]
  users: Array<{ id: string; name: string; email: string }>
  currentUserId: string
}

// 변경 후
type BoardViewProps = {
  board: any
  initialLists: any[]
  users: Array<{ id: string; name: string; email: string }>
  currentUserId: string
  boardMembers: Array<{ user_id: string; profiles?: any }>
  isOwner: boolean
}
```

**Step 2: import 추가**

파일 상단 import 목록에 추가:

```ts
import { BoardMemberManager } from './BoardMemberManager'
```

**Step 3: state 추가**

기존 `useState` 선언부 아래에:

```ts
const [isMemberManagerOpen, setIsMemberManagerOpen] = useState(false)
const [boardMembers, setBoardMembers] = useState(initialBoardMembers)
```

그리고 props destructuring을 수정:

```ts
export function BoardView({ board, initialLists, users, currentUserId, boardMembers: initialBoardMembers, isOwner }: BoardViewProps) {
```

**Step 4: handleRefresh에 board_members 갱신 추가**

`handleRefresh` 함수 안, `setLists(data)` 아래에 추가:

```ts
// board_members 갱신
const { data: members } = await supabase
  .from('board_members')
  .select('user_id, profiles(*)')
  .eq('board_id', board.id)
if (members) setBoardMembers(members)
```

**Step 5: 보드 제목 아래 멤버 UI 추가**

board 뷰와 calendar 뷰 양쪽에서 `<h1 className="text-3xl font-bold text-white mb-6">{board.title}</h1>` 을 찾아 아래 코드로 교체:

```tsx
<div className="flex items-center gap-4 mb-6">
  <h1 className="text-3xl font-bold text-white">{board.title}</h1>

  {/* 멤버 아바타 */}
  <div className="flex items-center gap-1">
    {boardMembers.slice(0, 3).map((m: any) => (
      <div
        key={m.user_id}
        title={m.profiles?.name}
        className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm flex items-center justify-center -ml-1 first:ml-0 border-2 border-[#0d1117]"
      >
        {m.profiles?.name?.[0]?.toUpperCase()}
      </div>
    ))}
    {boardMembers.length > 3 && (
      <div className="w-8 h-8 rounded-full bg-gray-500 text-white text-xs flex items-center justify-center -ml-1 border-2 border-[#0d1117]">
        +{boardMembers.length - 3}
      </div>
    )}
  </div>

  {/* 멤버 관리 버튼 (owner만) */}
  {isOwner && (
    <div className="relative">
      <button
        onClick={() => setIsMemberManagerOpen(prev => !prev)}
        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
      >
        + 멤버 초대
      </button>
      {isMemberManagerOpen && (
        <BoardMemberManager
          boardId={board.id}
          currentMembers={boardMembers}
          users={users}
          isOwner={isOwner}
          currentUserId={currentUserId}
          onUpdate={() => { setIsMemberManagerOpen(false); handleRefresh() }}
          onClose={() => setIsMemberManagerOpen(false)}
        />
      )}
    </div>
  )}
</div>
```

> 보드 뷰와 캘린더 뷰 **두 곳** 모두 `<h1>` 교체 필요.

**Step 6: TypeScript 확인**

```bash
npx tsc --noEmit
```

오류 수정 후:

**Step 7: 커밋**

```bash
git add components/BoardView.tsx
git commit -m "feat: add board member avatars and manager to board header"
```

---

## Task 6: useRealtimeSubscription — board_members 구독 추가

**Files:**
- Modify: `hooks/useRealtimeSubscription.ts`

`listMembersChannel` 아래에 추가:

```ts
const boardMembersChannel = supabase
  .channel(`board-${boardId}-board-members`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'board_members' }, refresh)
  .subscribe()
```

cleanup에도 추가:

```ts
supabase.removeChannel(boardMembersChannel)
```

**TypeScript 확인 + 커밋:**

```bash
npx tsc --noEmit
git add hooks/useRealtimeSubscription.ts
git commit -m "feat: subscribe to board_members realtime changes"
```

---

## Task 7: 통합 확인 및 마무리

**Step 1: 개발 서버 실행**

```bash
npm run dev
```

**Step 2: 브라우저에서 확인**

1. 로그인 → 대시보드에서 본인 보드만 표시되는지 확인
2. 보드 접속 → 헤더에 본인 아바타 + "멤버 초대" 버튼 확인
3. "멤버 초대" 클릭 → 다른 유저 추가 → 해당 유저로 로그인 시 보드 보이는지 확인
4. 멤버 제거 → 해당 유저 대시보드에서 보드 사라지는지 확인
5. 다른 멤버로 로그인 시 "멤버 초대" 버튼 미표시 확인

**Step 3: PROGRESS.md 업데이트**

```
- ✅ **보드 멤버 접근 제어** — 초대받은 멤버만 보드 접근, 보드 헤더에서 멤버 초대/제거 (owner만)
```

**Step 4: 최종 커밋 및 푸시**

```bash
git add PROGRESS.md
git commit -m "docs: update PROGRESS.md with board members access control"
git push origin master
```
