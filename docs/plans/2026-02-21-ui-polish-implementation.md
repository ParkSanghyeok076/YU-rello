# YU-rello UI Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform YU-rello's stiff UI into a smooth, polished experience — dark theme, no page flicker, and framer-motion animations.

**Architecture:** Client-side state refresh (replace `router.refresh()` with direct supabase client queries + `setLists()`), dark color tokens via Tailwind v4 `@theme`, framer-motion for entrance/hover animations on cards and modal.

**Tech Stack:** Next.js 16 App Router, Tailwind v4 (`@theme` in globals.css, no tailwind.config.ts), framer-motion, @dnd-kit

---

## Task 1: Install framer-motion

**Files:**
- Modify: `package.json` (auto-updated by npm)

**Step 1: Install the package**

Run:
```bash
npm install framer-motion
```

Expected: `package.json` now includes `"framer-motion": "^..."` in dependencies.

**Step 2: Verify install**

Run:
```bash
node -e "require('framer-motion'); console.log('ok')"
```

Expected: prints `ok` without errors.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install framer-motion"
```

---

## Task 2: Add dark theme color tokens

**Files:**
- Modify: `app/globals.css`

**Step 1: Replace globals.css content**

Replace the entire file with:

```css
@import "tailwindcss";

@theme {
  --font-logo: 'Orbitron', sans-serif;

  /* Navy blue (kept for button compatibility) */
  --color-navy: #1a2b4a;
  --color-navy-light: #2a3b5a;
  --color-navy-dark: #0a1b3a;

  /* Dark theme */
  --color-dark-bg: #0d1117;
  --color-dark-list: #161b22;
  --color-dark-list-hover: #1c2128;
}

body {
  background-color: #0d1117;
  color: white;
}
```

**Step 2: Start dev server and verify**

Run:
```bash
npm run dev
```

Open `http://localhost:3000`. The page background should now be near-black (`#0d1117`) instead of navy blue.

**Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: add dark theme color tokens, switch body bg to near-black"
```

---

## Task 3: Update Header to black

**Files:**
- Modify: `components/Header.tsx`

**Step 1: Change header background**

In `components/Header.tsx`, find:
```tsx
<header className="bg-navy border-b border-navy-light px-6 py-4">
```

Replace with:
```tsx
<header className="bg-black border-b border-gray-800 px-6 py-4">
```

**Step 2: Verify visually**

Dev server should be running. Refresh `http://localhost:3000/dashboard`. Header should now be pure black.

**Step 3: Commit**

```bash
git add components/Header.tsx
git commit -m "style: update header to black background"
```

---

## Task 4: Fix page flicker — replace router.refresh() with client-side state update

**Files:**
- Modify: `components/BoardView.tsx`

**Context:** Currently every card/list action calls `router.refresh()`, which triggers a full server component re-render and causes a white flash. We replace this with a supabase client query that updates local state directly.

**Step 1: Replace handleRefresh in BoardView.tsx**

Find this function:
```typescript
const handleRefresh = () => {
  router.refresh()
}
```

Replace with:
```typescript
const handleRefresh = async () => {
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
  if (data) setLists(data)
}
```

**Step 2: Remove useRouter import if no longer needed**

Check if `router` is used anywhere else in `BoardView.tsx`. If the only usage was `router.refresh()` in `handleRefresh`, remove:
```typescript
const router = useRouter()
```
And remove `useRouter` from the import:
```typescript
import { useRouter } from 'next/navigation'  // remove this line
```

**Step 3: Update background color**

Find:
```tsx
<div className="min-h-screen bg-navy">
```

Replace with:
```tsx
<div className="min-h-screen bg-dark-bg">
```

**Step 4: Verify — no more flicker**

In the browser, add a card to a list. The card should appear instantly without the page going white/blank.

**Step 5: Commit**

```bash
git add components/BoardView.tsx
git commit -m "fix: replace router.refresh() with client-side state update to eliminate page flicker"
```

---

## Task 5: Update List component to dark theme + entrance animation

**Files:**
- Modify: `components/List.tsx`

**Step 1: Replace entire List.tsx content**

```tsx
'use client'

import { motion } from 'framer-motion'
import { useDroppable } from '@dnd-kit/core'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from './Card'
import { CreateCardButton } from './CreateCardButton'

type ListProps = {
  list: any
  onUpdate: () => void
  currentUserId?: string
  currentUserName?: string
}

export function List({ list, onUpdate, currentUserId, currentUserName }: ListProps) {
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

  return (
    <motion.div
      ref={setSortableRef}
      style={style}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex-shrink-0 w-72 bg-dark-list rounded-xl p-3 max-h-[calc(100vh-160px)] flex flex-col"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing px-1"
      >
        <h3 className="font-semibold text-white">{list.title}</h3>
        <button className="text-gray-400 hover:text-gray-200 transition-colors">⋯</button>
      </div>

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

Lists should now have a dark (`#161b22`) background with white titles, and slide in from the left when the board first loads.

**Step 3: Commit**

```bash
git add components/List.tsx
git commit -m "style: dark theme + framer-motion entrance animation for List"
```

---

## Task 6: Update Card component — dark theme, hover animation, edit button

**Files:**
- Modify: `components/Card.tsx`

**Step 1: Replace entire Card.tsx content**

```tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CardModal } from './CardModal'

type CardProps = {
  card: any
  onUpdate?: () => void
  currentUserId?: string
  currentUserName?: string
}

export function Card({ card, onUpdate, currentUserId = '', currentUserName = 'User' }: CardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const completedItems = card.checklist_items?.filter((item: any) => item.completed).length || 0
  const totalItems = card.checklist_items?.length || 0
  const hasComments = card.comments?.length > 0

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
        transition={{ duration: 0.15 }}
        whileHover={{ y: -2, transition: { duration: 0.1 } }}
        onClick={() => setIsModalOpen(true)}
        className="relative group bg-white border border-gray-200 rounded-lg p-3 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Hover edit button */}
        <button
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs z-10"
          onClick={(e) => { e.stopPropagation(); setIsModalOpen(true) }}
          title="편집"
        >
          ✎
        </button>

        {/* Labels */}
        {card.card_labels?.length > 0 && (
          <div className="flex gap-1 mb-2">
            {card.card_labels.map((cl: any) => (
              <div
                key={cl.label_id}
                className="h-2 w-10 rounded"
                style={{ backgroundColor: cl.labels?.color }}
              />
            ))}
          </div>
        )}

        {/* Title */}
        <p className="text-gray-800 font-medium mb-2 pr-6">{card.title}</p>

        {/* Metadata */}
        <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          {totalItems > 0 && (
            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
              completedItems === totalItems
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              ✓ {completedItems}/{totalItems}
            </span>
          )}
          {hasComments && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              💬 {card.comments.length}
            </span>
          )}
          {card.due_date && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              📅 {new Date(card.due_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {/* Members */}
        {card.card_members?.length > 0 && (
          <div className="flex gap-1 mt-2">
            {card.card_members.slice(0, 3).map((member: any) => (
              <div
                key={member.user_id}
                className="w-6 h-6 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center font-medium"
                title={member.profiles?.name}
              >
                {member.profiles?.name?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <CardModal
        cardId={card.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={onUpdate || (() => {})}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </>
  )
}
```

**Step 2: Verify**

Hover over a card — it should lift up 2px and show a subtle pencil icon in the top-right corner. The shadow should deepen on hover.

**Step 3: Commit**

```bash
git add components/Card.tsx
git commit -m "style: card dark theme, framer-motion hover/entrance, hover edit button"
```

---

## Task 7: Update CardModal with fade + scale animation

**Files:**
- Modify: `components/CardModal.tsx`

**Step 1: Add framer-motion import**

Find the import section at the top of `components/CardModal.tsx`:
```tsx
import { useState, useEffect } from 'react'
```

Add `motion` import after it:
```tsx
import { motion } from 'framer-motion'
```

**Step 2: Animate backdrop**

Find:
```tsx
<div
  className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-8 overflow-y-auto"
  onClick={onClose}
>
```

Replace with:
```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.15 }}
  className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-8 overflow-y-auto"
  onClick={onClose}
>
```

**Step 3: Animate modal panel**

Find:
```tsx
<div
  className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8"
  onClick={(e) => e.stopPropagation()}
>
```

Replace with:
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.96, y: -8 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  transition={{ duration: 0.2 }}
  className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8"
  onClick={(e) => e.stopPropagation()}
>
```

**Step 4: Close the tags**

Find the closing tags at the bottom of the return:
```tsx
      </div>
    </div>
```

Replace with:
```tsx
      </motion.div>
    </motion.div>
```

**Step 5: Verify**

Click a card to open the modal. It should fade in with a subtle scale effect instead of appearing instantly.

**Step 6: Commit**

```bash
git add components/CardModal.tsx
git commit -m "style: framer-motion fade+scale animation for card modal"
```

---

## Task 8: Update CreateCardButton for dark list theme

**Files:**
- Modify: `components/CreateCardButton.tsx`

**Step 1: Replace entire CreateCardButton.tsx content**

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CreateCardButtonProps = {
  listId: string
  currentPosition: number
  onCardCreated: () => void
}

export function CreateCardButton({ listId, currentPosition, onCardCreated }: CreateCardButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('cards')
        .insert({
          list_id: listId,
          title: title.trim(),
          position: currentPosition,
        })

      if (error) throw error

      setTitle('')
      setIsAdding(false)
      onCardCreated()
    } catch (error) {
      console.error('Error creating card:', error)
      alert('카드 생성 실패')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full p-2 text-left text-gray-400 hover:bg-dark-list-hover hover:text-white rounded-lg transition-colors flex items-center gap-1"
      >
        <span className="text-lg leading-none">+</span>
        <span className="text-sm">카드 추가</span>
      </button>
    )
  }

  return (
    <div className="bg-[#22272e] rounded-lg p-2 shadow-lg">
      <form onSubmit={handleSubmit}>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="카드 제목을 입력하세요..."
          autoFocus
          rows={3}
          className="w-full px-2 py-1.5 border border-gray-600 bg-[#2d333b] rounded text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm"
        />
        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '추가 중...' : '카드 추가'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false)
              setTitle('')
            }}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
```

**Step 2: Verify**

The "카드 추가" button should now be subtle gray text on the dark list background. Clicking it should show a dark-themed form.

**Step 3: Commit**

```bash
git add components/CreateCardButton.tsx
git commit -m "style: dark theme for CreateCardButton"
```

---

## Task 9: Update CreateListButton for dark background

**Files:**
- Modify: `components/CreateListButton.tsx`

**Step 1: Replace entire CreateListButton.tsx content**

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CreateListButtonProps = {
  boardId: string
  currentPosition: number
  onListCreated: () => void
}

export function CreateListButton({ boardId, currentPosition, onListCreated }: CreateListButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('lists')
        .insert({
          board_id: boardId,
          title: title.trim(),
          position: currentPosition,
        })

      if (error) throw error

      setTitle('')
      setIsAdding(false)
      onListCreated()
    } catch (error) {
      console.error('Error creating list:', error)
      alert('리스트 생성 실패')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex-shrink-0 w-72 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left"
      >
        <span className="text-white/80 text-sm">+ 리스트 추가</span>
      </button>
    )
  }

  return (
    <div className="flex-shrink-0 w-72 bg-dark-list rounded-xl p-3">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="리스트 제목 입력..."
          autoFocus
          className="w-full px-3 py-2 border border-gray-600 bg-[#2d333b] rounded text-white mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '추가 중...' : '리스트 추가'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false)
              setTitle('')
            }}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
```

**Step 2: Verify**

The "리스트 추가" button should be a semi-transparent white pill on the dark background. The form should match the dark list style.

**Step 3: Commit**

```bash
git add components/CreateListButton.tsx
git commit -m "style: dark theme for CreateListButton"
```

---

## Task 10: Final check and push

**Step 1: Build check**

Run:
```bash
npm run build
```

Expected: Build succeeds with no TypeScript or compilation errors.

**Step 2: Visual walkthrough checklist**

With `npm run dev` running, verify each item:
- [ ] Page background is near-black (`#0d1117`)
- [ ] Header is black
- [ ] Lists are dark gray (`#161b22`) with white titles
- [ ] Cards are white with gray text, lift up 2px on hover
- [ ] Cards show pencil icon (✎) on hover in top-right
- [ ] Card modal fades in with scale animation
- [ ] Adding a card/list no longer causes page flicker
- [ ] Drag and drop still works correctly
- [ ] "카드 추가" button is subtle gray, expands to dark form
- [ ] "리스트 추가" button is semi-transparent white

**Step 3: Push to GitHub**

```bash
git push origin master
```

Expected: All commits pushed successfully.
