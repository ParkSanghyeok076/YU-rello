# YU-rello New Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add board deletion, checklist Enter key, list ⋯ menu (rename + delete), and smooth real-time updates.

**Architecture:** 4 independent tasks. Start with real-time fix (Task 1) since it touches BoardView and useRealtimeSubscription — foundations used by other features. Remaining tasks are isolated component changes.

**Tech Stack:** Next.js 16 App Router, Supabase client, Tailwind v4, framer-motion (already installed)

---

## Task 1: Fix real-time updates — pass handleRefresh into hook

**Files:**
- Modify: `hooks/useRealtimeSubscription.ts`
- Modify: `components/BoardView.tsx`

**Context:** The hook currently calls `router.refresh()` when DB changes arrive from Supabase Realtime. This causes a white flash for the partner's changes. We replace it with the same `handleRefresh` used for own actions (client-side supabase query + setLists).

**Step 1: Rewrite hooks/useRealtimeSubscription.ts**

Replace entire file content with:

```typescript
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeSubscription(boardId: string, onRefresh: () => void) {
  const supabase = createClient()
  const onRefreshRef = useRef(onRefresh)

  useEffect(() => {
    onRefreshRef.current = onRefresh
  })

  useEffect(() => {
    const refresh = () => onRefreshRef.current()

    const listsChannel = supabase
      .channel(`board-${boardId}-lists`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists', filter: `board_id=eq.${boardId}` }, refresh)
      .subscribe()

    const cardsChannel = supabase
      .channel(`board-${boardId}-cards`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, refresh)
      .subscribe()

    const checklistChannel = supabase
      .channel(`board-${boardId}-checklist`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_items' }, refresh)
      .subscribe()

    const commentsChannel = supabase
      .channel(`board-${boardId}-comments`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, refresh)
      .subscribe()

    const labelsChannel = supabase
      .channel(`board-${boardId}-labels`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'labels', filter: `board_id=eq.${boardId}` }, refresh)
      .subscribe()

    const cardLabelsChannel = supabase
      .channel(`board-${boardId}-card-labels`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'card_labels' }, refresh)
      .subscribe()

    const cardMembersChannel = supabase
      .channel(`board-${boardId}-card-members`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'card_members' }, refresh)
      .subscribe()

    return () => {
      supabase.removeChannel(listsChannel)
      supabase.removeChannel(cardsChannel)
      supabase.removeChannel(checklistChannel)
      supabase.removeChannel(commentsChannel)
      supabase.removeChannel(labelsChannel)
      supabase.removeChannel(cardLabelsChannel)
      supabase.removeChannel(cardMembersChannel)
    }
  }, [boardId])
}
```

**Step 2: Update BoardView.tsx — pass handleRefresh to hook**

In `components/BoardView.tsx`, find:
```typescript
useRealtimeSubscription(board.id)
```

Replace with:
```typescript
useRealtimeSubscription(board.id, handleRefresh)
```

**Step 3: Verify — no TypeScript errors**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 4: Commit**

```bash
git add hooks/useRealtimeSubscription.ts components/BoardView.tsx
git commit -m "fix: pass handleRefresh to realtime hook — eliminate partner-change flicker"
```

---

## Task 2: Checklist Enter key to submit

**Files:**
- Modify: `components/ChecklistSection.tsx`

**Context:** The checklist "항목 추가" form has a text input and a date input. Pressing Enter in the title input should submit (same as clicking "추가" button).

**Step 1: Add onKeyDown to title input in ChecklistSection.tsx**

Find the title input (around line 85):
```tsx
<input
  type="text"
  value={newItemTitle}
  onChange={(e) => setNewItemTitle(e.target.value)}
  placeholder="항목 제목..."
  autoFocus
  className="px-2 py-1 border border-gray-300 rounded text-navy focus:outline-none focus:ring-2 focus:ring-navy"
/>
```

Replace with:
```tsx
<input
  type="text"
  value={newItemTitle}
  onChange={(e) => setNewItemTitle(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
  }}
  placeholder="항목 제목..."
  autoFocus
  className="px-2 py-1 border border-gray-300 rounded text-navy focus:outline-none focus:ring-2 focus:ring-navy"
/>
```

**Step 2: Verify**

Open a card modal, open the checklist section, type a title, press Enter. The item should be added immediately.

**Step 3: Commit**

```bash
git add components/ChecklistSection.tsx
git commit -m "feat: submit checklist item on Enter key"
```

---

## Task 3: List ⋯ menu — rename + delete

**Files:**
- Modify: `components/List.tsx`

**Context:** The `⋯` button currently exists but does nothing. We add a dropdown menu with "이름 변경" and "리스트 삭제" options. Rename replaces the title with an inline input. Delete removes the list and all cards from Supabase.

**Step 1: Replace entire components/List.tsx content**

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDroppable } from '@dnd-kit/core'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { Card } from './Card'
import { CreateCardButton } from './CreateCardButton'

type ListProps = {
  list: any
  onUpdate: () => void
  currentUserId?: string
  currentUserName?: string
}

export function List({ list, onUpdate, currentUserId, currentUserName }: ListProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [listTitle, setListTitle] = useState(list.title)
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const { setNodeRef: setDroppableRef } = useDroppable({ id: list.id })

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `list-${list.id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const cardIds = list.cards
    .sort((a: any, b: any) => a.position - b.position)
    .map((card: any) => card.id)

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  const handleRename = async () => {
    const trimmed = listTitle.trim()
    if (!trimmed || trimmed === list.title) {
      setListTitle(list.title)
      setIsRenaming(false)
      return
    }
    const { error } = await supabase
      .from('lists')
      .update({ title: trimmed })
      .eq('id', list.id)
    if (!error) {
      setIsRenaming(false)
      onUpdate()
    }
  }

  const handleDelete = async () => {
    if (!confirm(`"${list.title}" 리스트와 모든 카드를 삭제하시겠습니까?`)) return
    const { error } = await supabase.from('lists').delete().eq('id', list.id)
    if (!error) onUpdate()
  }

  return (
    <motion.div
      ref={setSortableRef}
      style={style}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex-shrink-0 w-72 bg-dark-list rounded-xl p-3 max-h-[calc(100vh-160px)] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        {/* Title or rename input — drag handle only when not renaming */}
        <div
          {...(isRenaming ? {} : { ...attributes, ...listeners })}
          className={`flex-1 ${isRenaming ? '' : 'cursor-grab active:cursor-grabbing'}`}
        >
          {isRenaming ? (
            <input
              type="text"
              value={listTitle}
              onChange={(e) => setListTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') { setListTitle(list.title); setIsRenaming(false) }
              }}
              onBlur={handleRename}
              autoFocus
              className="w-full bg-transparent border-b border-blue-400 text-white font-semibold focus:outline-none"
            />
          ) : (
            <h3 className="font-semibold text-white">{listTitle}</h3>
          )}
        </div>

        {/* ⋯ dropdown menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="text-gray-400 hover:text-gray-200 transition-colors px-1 ml-2"
          >
            ⋯
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-[#2d333b] border border-gray-600 rounded-lg shadow-xl z-20 overflow-hidden">
              <button
                onClick={() => { setIsRenaming(true); setIsMenuOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#3d444e] transition-colors"
              >
                ✏️ 이름 변경
              </button>
              <button
                onClick={() => { setIsMenuOpen(false); handleDelete() }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#3d444e] transition-colors"
              >
                🗑️ 리스트 삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div ref={setDroppableRef} className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1">
          {list.cards
            .sort((a: any, b: any) => a.position - b.position)
            .map((card: any) => (
              <Card
                key={card.id}
                card={card}
                onUpdate={onUpdate}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
              />
            ))}
        </div>
      </SortableContext>

      <CreateCardButton
        listId={list.id}
        currentPosition={list.cards.length}
        onCardCreated={onUpdate}
      />
    </motion.div>
  )
}
```

**Step 2: Verify**

- Click `⋯` → menu appears with two items
- Click "이름 변경" → title becomes input, type new name, press Enter → title updates
- Click `⋯` → "리스트 삭제" → confirm → list disappears
- Drag-and-drop still works (drag the list header when not renaming)

**Step 3: Commit**

```bash
git add components/List.tsx
git commit -m "feat: list menu with rename and delete"
```

---

## Task 4: Board deletion — BoardCard component

**Files:**
- Create: `components/BoardCard.tsx`
- Modify: `app/dashboard/page.tsx`

**Context:** Dashboard is a server component. We extract the board card UI into a new client component `BoardCard` which adds a `⋯` hover menu with a "보드 삭제" option.

**Step 1: Create components/BoardCard.tsx**

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type BoardCardProps = {
  board: {
    id: string
    title: string
    created_at: string
  }
}

export function BoardCard({ board }: BoardCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMenuOpen(false)
    if (!confirm(`"${board.title}" 보드를 삭제하시겠습니까?\n모든 리스트와 카드가 삭제됩니다.`)) return
    const { error } = await supabase.from('boards').delete().eq('id', board.id)
    if (!error) router.refresh()
  }

  return (
    <div className="relative group">
      <a
        href={`/board/${board.id}`}
        className="block p-6 bg-white text-navy rounded-lg hover:shadow-lg transition-shadow"
      >
        <h3 className="text-lg font-semibold">{board.title}</h3>
        <p className="text-sm text-gray-600 mt-2">
          생성일: {new Date(board.created_at).toLocaleDateString('ko-KR')}
        </p>
      </a>

      {/* ⋯ hover menu */}
      <div className="absolute top-3 right-3" ref={menuRef}>
        <button
          onClick={(e) => { e.preventDefault(); setIsMenuOpen((prev) => !prev) }}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center text-gray-600 text-sm"
        >
          ⋯
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              🗑️ 보드 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Update app/dashboard/page.tsx**

Replace entire file content with:

```tsx
import { createServerClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/client'
import { BoardCard } from '@/components/BoardCard'

type Board = Database['public']['Tables']['boards']['Row']

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false }) as { data: Board[] | null; error: unknown }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">내 보드</h2>

        {boards && boards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400">아직 보드가 없습니다. 새 보드를 만들어보세요!</p>
        )}
      </div>

      <a
        href="/board/new"
        className="inline-block px-6 py-3 bg-white text-navy rounded-lg hover:bg-gray-100 transition-colors font-medium"
      >
        + 새 보드 만들기
      </a>
    </div>
  )
}
```

**Step 3: Verify**

- Go to `/dashboard` — boards appear as before
- Hover a board — `⋯` button appears in top-right
- Click `⋯` → "보드 삭제" option appears
- Click delete, confirm → board disappears from list

**Step 4: Build check**

```bash
npx tsc --noEmit
```

Expected: No TypeScript errors.

**Step 5: Commit**

```bash
git add components/BoardCard.tsx app/dashboard/page.tsx
git commit -m "feat: board deletion from dashboard"
```

---

## Task 5: Final build + push

**Step 1: Full build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Push**

```bash
git push origin master
```
