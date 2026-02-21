# List Members Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 리스트(칸반 컬럼)에 담당 멤버를 지정하고 표시하며, 툴바 필터에 반영한다.

**Architecture:** `card_members`와 동일한 패턴으로 새 `list_members` 테이블을 사용한다. `ListMemberPicker` 컴포넌트를 신규 생성하고, `List.tsx` 헤더에 아바타를 표시한다. `BoardView.tsx`의 Supabase 쿼리와 필터 로직을 확장한다.

**Tech Stack:** Next.js 16, React 19, Supabase (supabase-js), Tailwind v4, TypeScript

---

## 사전 작업 (수동)

### Task 0: Supabase SQL 실행

이 작업은 **자동화 불가**. Supabase Dashboard에서 직접 실행해야 한다.

**Step 1: SQL Editor 접속**

1. https://supabase.com/dashboard 접속
2. 프로젝트 `mennynwvgkzmohoclrxs` 선택
3. 좌측 메뉴 **SQL Editor** 클릭

**Step 2: 아래 SQL 실행**

```sql
CREATE TABLE list_members (
  list_id uuid REFERENCES lists(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (list_id, user_id)
);

ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "list_members are viewable by everyone"
  ON list_members FOR SELECT USING (true);

CREATE POLICY "list_members can be managed by authenticated users"
  ON list_members FOR ALL USING (auth.uid() IS NOT NULL);
```

**Step 3: 확인**

SQL Editor 결과에 "Success" 표시 확인.
Table Editor → `list_members` 테이블 생성 확인.

---

## Task 1: ListMemberPicker 컴포넌트 생성

**Files:**
- Create: `components/ListMemberPicker.tsx`

이 컴포넌트는 `MemberPicker.tsx`와 구조가 동일하되, `list_members` 테이블을 사용한다.
알림(notification)은 리스트 멤버 지정 시 불필요하므로 포함하지 않는다.

**Step 1: 파일 생성**

`components/ListMemberPicker.tsx` 를 아래 내용으로 생성한다:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type ListMemberPickerProps = {
  listId: string
  currentMembers: any[]
  onUpdate: () => void
  onClose: () => void
}

export function ListMemberPicker({ listId, currentMembers, onUpdate, onClose }: ListMemberPickerProps) {
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email')
    setAllUsers(data || [])
  }

  const handleToggleMember = async (userId: string) => {
    const isAssigned = currentMembers.some(m => m.user_id === userId)
    setLoading(true)
    try {
      if (isAssigned) {
        const { error } = await supabase
          .from('list_members')
          .delete()
          .eq('list_id', listId)
          .eq('user_id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('list_members')
          .insert({ list_id: listId, user_id: userId })
        if (error) throw error
      }
      onUpdate()
    } catch (error) {
      console.error('Error toggling list member:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64 z-30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-navy">리스트 멤버</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
      </div>

      <div className="space-y-2">
        {allUsers.map((user) => {
          const isAssigned = currentMembers.some(m => m.user_id === user.id)
          return (
            <button
              key={user.id}
              onClick={() => handleToggleMember(user.id)}
              disabled={loading}
              className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <div className="w-8 h-8 rounded-full bg-navy text-white text-xs flex items-center justify-center flex-shrink-0">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <p className="text-navy font-medium">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              {isAssigned && <span className="text-navy font-bold">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 2: TypeScript 빌드 확인**

```bash
npx tsc --noEmit
```

오류 없으면 통과.

**Step 3: 커밋**

```bash
git add components/ListMemberPicker.tsx
git commit -m "feat: add ListMemberPicker component"
```

---

## Task 2: BoardView.tsx — 쿼리 및 필터 로직 수정

**Files:**
- Modify: `components/BoardView.tsx`

두 곳을 수정한다:
1. `handleRefresh` 안의 Supabase 쿼리에 `list_members` join 추가
2. `filteredLists` 필터 로직을 리스트 멤버 기준으로 확장

**Step 1: handleRefresh 쿼리 수정**

`components/BoardView.tsx` 의 `handleRefresh` 함수 안 쿼리를 찾는다 (현재 약 47-60번 라인):

```ts
// 현재
const { data } = await supabase
  .from('lists')
  .select(`
    *,
    cards (
      *,
      card_labels (label_id, labels (*)),
      card_members (user_id, profiles (*)),
      checklist_items (*),
      comments (*)
    )
  `)
  .eq('board_id', board.id)
  .order('position', { ascending: true })
```

아래로 교체:

```ts
// 변경 후
const { data } = await supabase
  .from('lists')
  .select(`
    *,
    list_members (user_id, profiles (*)),
    cards (
      *,
      card_labels (label_id, labels (*)),
      card_members (user_id, profiles (*)),
      checklist_items (*),
      comments (*)
    )
  `)
  .eq('board_id', board.id)
  .order('position', { ascending: true })
```

**Step 2: filteredLists 필터 로직 수정**

현재 약 155-162번 라인:

```ts
// 현재
const filteredLists = userFilter
  ? lists.map(list => ({
      ...list,
      cards: list.cards.filter((card: any) =>
        card.card_members.some((m: any) => m.user_id === userFilter)
      ),
    }))
  : lists
```

아래로 교체:

```ts
// 변경 후
const filteredLists = userFilter
  ? lists
      .filter((list: any) =>
        list.list_members?.some((m: any) => m.user_id === userFilter) ||
        list.cards.some((card: any) =>
          card.card_members.some((m: any) => m.user_id === userFilter)
        )
      )
      .map((list: any) => {
        const isListMember = list.list_members?.some((m: any) => m.user_id === userFilter)
        return {
          ...list,
          cards: isListMember
            ? list.cards
            : list.cards.filter((card: any) =>
                card.card_members.some((m: any) => m.user_id === userFilter)
              ),
        }
      })
  : lists
```

**Step 3: TypeScript 빌드 확인**

```bash
npx tsc --noEmit
```

**Step 4: 커밋**

```bash
git add components/BoardView.tsx
git commit -m "feat: add list_members to board query and filter logic"
```

---

## Task 3: List.tsx — 헤더에 멤버 아바타 표시

**Files:**
- Modify: `components/List.tsx`

리스트 헤더에 멤버 아바타를 추가하고, 클릭 시 `ListMemberPicker`를 오픈한다.

**Step 1: import 및 props 추가**

파일 상단에 import 추가:

```tsx
import { ListMemberPicker } from './ListMemberPicker'
```

`ListProps` 타입에 `listMembers` prop 추가:

```tsx
// 현재
type ListProps = {
  list: any
  onUpdate: () => void
  currentUserId?: string
  currentUserName?: string
}
```

```tsx
// 변경 후 — listMembers prop 추가됨
type ListProps = {
  list: any
  onUpdate: () => void
  currentUserId?: string
  currentUserName?: string
}
```

> 참고: `list.list_members`를 직접 사용하므로 별도 prop 추가 불필요. `list` 객체 안에 이미 포함됨.

**Step 2: 상태 추가**

`isMenuOpen` 등 기존 useState 선언부 아래에 추가:

```tsx
const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false)
```

**Step 3: 헤더 UI 수정**

현재 헤더 영역 (제목 div와 ⋯ 버튼 사이)에 멤버 아바타와 피커를 추가한다.

헤더 `<div className="flex items-center justify-between mb-3 px-1">` 안,
제목 div와 `<div className="relative" ref={menuRef}>` 사이에 아래 코드를 삽입:

```tsx
{/* 멤버 아바타 + 피커 */}
<div className="relative flex items-center gap-1 mx-2">
  {(list.list_members || []).slice(0, 3).map((m: any) => (
    <div
      key={m.user_id}
      title={m.profiles?.name}
      className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center -ml-1 first:ml-0 border border-[#161b22]"
    >
      {m.profiles?.name?.[0]?.toUpperCase()}
    </div>
  ))}
  {(list.list_members || []).length > 3 && (
    <div className="w-6 h-6 rounded-full bg-gray-500 text-white text-xs flex items-center justify-center -ml-1 border border-[#161b22]">
      +{list.list_members.length - 3}
    </div>
  )}
  <button
    onClick={() => setIsMemberPickerOpen(prev => !prev)}
    className="w-5 h-5 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center hover:bg-gray-500 transition-colors ml-1"
    title="멤버 관리"
  >
    +
  </button>

  {isMemberPickerOpen && (
    <ListMemberPicker
      listId={list.id}
      currentMembers={list.list_members || []}
      onUpdate={() => { setIsMemberPickerOpen(false); onUpdate() }}
      onClose={() => setIsMemberPickerOpen(false)}
    />
  )}
</div>
```

**Step 4: TypeScript 빌드 확인**

```bash
npx tsc --noEmit
```

**Step 5: 커밋**

```bash
git add components/List.tsx
git commit -m "feat: show list member avatars in header with picker"
```

---

## Task 4: useRealtimeSubscription.ts — list_members 구독 추가

**Files:**
- Modify: `hooks/useRealtimeSubscription.ts`

`cardMembersChannel` 선언 아래에 새 채널 추가.

**Step 1: 채널 추가**

`cardMembersChannel` 선언 아래, `return () => {` 라인 위에 삽입:

```ts
const listMembersChannel = supabase
  .channel(`board-${boardId}-list-members`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'list_members' }, refresh)
  .subscribe()
```

**Step 2: cleanup에 추가**

`return () => {` 블록 안 `supabase.removeChannel(cardMembersChannel)` 아래에 추가:

```ts
supabase.removeChannel(listMembersChannel)
```

**Step 3: TypeScript 빌드 확인**

```bash
npx tsc --noEmit
```

**Step 4: 커밋**

```bash
git add hooks/useRealtimeSubscription.ts
git commit -m "feat: subscribe to list_members realtime changes"
```

---

## Task 5: 통합 확인 및 최종 커밋

**Step 1: 개발 서버 실행**

```bash
npm run dev
```

**Step 2: 브라우저에서 확인**

1. http://localhost:3000 접속 → 로그인
2. 보드 진입
3. 리스트 헤더에 `+` 버튼 확인
4. `+` 클릭 → 유저 목록 드롭다운 열림
5. 유저 선택 → 아바타 표시 확인
6. 툴바에서 해당 유저로 필터 → 해당 리스트만 표시 확인
7. 다른 탭/창에서 멤버 추가 → 실시간 반영 확인

**Step 3: PROGRESS.md 업데이트**

`PROGRESS.md` 상단 "UI 개선 & 추가 기능" 섹션에 추가:

```
- ✅ **리스트 멤버 지정** — 리스트 헤더 아바타, 피커로 추가/제거, 툴바 필터 연동
```

**Step 4: 최종 커밋 및 푸시**

```bash
git add PROGRESS.md
git commit -m "docs: update PROGRESS.md with list members feature"
git push origin master
```
