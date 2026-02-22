# Card Dates, View Toggle, Notification Button Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add card start/end date range, pill-style view toggle, and upcoming-task notification dropdown to Toolbar.

**Architecture:** 5 independent tasks. Task 1 (DB + types) must come first — all other tasks depend on start_date existing. Tasks 2–5 can be done in any order after Task 1. No new components — all changes are in existing files.

**Tech Stack:** Next.js 16 App Router, Supabase client, Tailwind v4, FullCalendar (already installed)

---

## Task 1: Add start_date to DB and TypeScript types

**Files:**
- Modify: `lib/supabase/client.ts` (cards type)

**Step 1: Run SQL in Supabase Dashboard**

Open Supabase Dashboard → SQL Editor, run:

```sql
ALTER TABLE cards ADD COLUMN start_date DATE;
```

Expected: Query runs without error. Refresh Table Editor → `cards` table now has `start_date` column (nullable, type date).

**Step 2: Update TypeScript types in lib/supabase/client.ts**

Find the `cards` table type block (lines 81–113). Replace the entire block with:

```typescript
      cards: {
        Row: {
          id: string
          list_id: string
          title: string
          description: string | null
          start_date: string | null
          due_date: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          list_id: string
          title: string
          description?: string | null
          start_date?: string | null
          due_date?: string | null
          position: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          title?: string
          description?: string | null
          start_date?: string | null
          due_date?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
```

**Step 3: Commit**

```bash
git add lib/supabase/client.ts
git commit -m "feat: add start_date to cards DB and TypeScript types"
```

---

## Task 2: CardModal — add dates section

**Files:**
- Modify: `components/CardModal.tsx`

**Context:** CardModal fetches card data with `fetchCard()` → stores in `card` state. The body `<div className="p-6 space-y-6">` contains Description → Checklist → Labels → Members → Comments sections. We insert a "날짜" section between Description and Checklist.

**Step 1: Add date state variables**

After the existing state declarations (line 23, after `const [loading, setLoading] = useState(false)`), add:

```tsx
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
```

**Step 2: Populate date state when card loads**

In `fetchCard()`, after `setDescription(...)` (line 58), add:

```tsx
      setStartDate((data as any).start_date || '')
      setDueDate((data as any).due_date ? (data as any).due_date.split('T')[0] : '')
```

Note: `start_date` is a DATE column (returns `YYYY-MM-DD`), `due_date` is TIMESTAMPTZ (returns `YYYY-MM-DDTHH:MM:SS...`) so we split on `T`.

**Step 3: Add date update handlers**

After `handleUpdateDescription` function (after line 81), add these two handlers:

```tsx
  const handleUpdateStartDate = async (value: string) => {
    setStartDate(value)
    await supabase
      .from('cards')
      .update({ start_date: value || null })
      .eq('id', cardId)
    onUpdate()
  }

  const handleUpdateDueDate = async (value: string) => {
    setDueDate(value)
    await supabase
      .from('cards')
      .update({ due_date: value || null })
      .eq('id', cardId)
    onUpdate()
  }
```

**Step 4: Add dates section UI**

In the body section, insert the following block **between** the Description `</div>` and `<ChecklistSection` (between lines 208 and 210):

```tsx
          {/* Dates */}
          <div>
            <h3 className="text-lg font-semibold text-navy mb-3">📅 날짜</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-14 shrink-0">시작일</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleUpdateStartDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-navy text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
                {startDate && (
                  <button
                    onClick={() => handleUpdateStartDate('')}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                    title="시작일 삭제"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-14 shrink-0">종료일</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleUpdateDueDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-navy text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
                {dueDate && (
                  <button
                    onClick={() => handleUpdateDueDate('')}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                    title="종료일 삭제"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
```

**Step 5: Verify manually**

Open any board → click a card → verify "📅 날짜" section appears with two date inputs. Set a start date → close modal → reopen → verify date persists.

**Step 6: Commit**

```bash
git add components/CardModal.tsx
git commit -m "feat: add start/end date picker to CardModal"
```

---

## Task 3: Card.tsx — update date display

**Files:**
- Modify: `components/Card.tsx`

**Context:** The date display is at lines 92–96. Currently shows `card.due_date` only.

**Display rules:**
- Both `start_date` and `due_date` → `📅 2월 9일 ~ 4월 8일`
- Only `start_date` → `📅 2월 9일`
- Only `due_date` → `📅 4월 8일`
- Neither → nothing shown

**Step 1: Add helper function**

Before the `Card` function definition (before line 16), add:

```tsx
function fmtDate(iso: string): string {
  // iso can be YYYY-MM-DD (start_date) or YYYY-MM-DDTHH:MM:SS (due_date)
  const d = new Date(iso.split('T')[0] + 'T00:00:00')
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function formatCardDates(start_date: string | null, due_date: string | null): string | null {
  if (start_date && due_date) return `${fmtDate(start_date)} ~ ${fmtDate(due_date)}`
  if (start_date) return fmtDate(start_date)
  if (due_date) return fmtDate(due_date)
  return null
}
```

**Step 2: Replace the date badge**

Find and replace this block (lines 92–96):

```tsx
          {card.due_date && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              📅 {new Date(card.due_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </span>
          )}
```

Replace with:

```tsx
          {formatCardDates(card.start_date, card.due_date) && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              📅 {formatCardDates(card.start_date, card.due_date)}
            </span>
          )}
```

**Step 3: Commit**

```bash
git add components/Card.tsx
git commit -m "feat: update card date display to show start~end range"
```

---

## Task 4: CalendarView — card range events

**Files:**
- Modify: `components/CalendarView.tsx`

**Context:** Lines 41–54 build card events. Currently uses `card.due_date` for a single-day event. We update to support ranges.

**FullCalendar range format:** `{ start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }` where `end` is **exclusive** (i.e., one day after the last visible day). A single-day event: `{ start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }` where both are the same day works — FullCalendar treats it as a 1-day event.

**Step 1: Add helper function**

Before the `CalendarView` function definition (before line 13), add:

```tsx
function addOneDay(dateStr: string): string {
  const d = new Date(dateStr.split('T')[0] + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
```

**Step 2: Replace the card event block**

Find and replace the entire card due_date block (lines 41–54):

```tsx
        // 카드 마감일
        if (card.due_date) {
          calendarEvents.push({
            id: `card-${card.id}`,
            title: `📋 ${card.title}`,
            date: card.due_date.split('T')[0],
            backgroundColor: '#6366f1',
            borderColor: '#4f46e5',
            extendedProps: {
              cardId: card.id,
              cardTitle: card.title,
              listTitle: list.title,
            },
          })
        }
```

Replace with:

```tsx
        // 카드 날짜 이벤트 (start_date 또는 due_date가 있을 때)
        const cardStart = card.start_date || (card.due_date ? card.due_date.split('T')[0] : null)
        const cardEnd = card.due_date ? card.due_date.split('T')[0] : card.start_date

        if (cardStart) {
          calendarEvents.push({
            id: `card-${card.id}`,
            title: `📋 ${card.title}`,
            start: cardStart,
            end: addOneDay(cardEnd!),
            allDay: true,
            backgroundColor: '#6366f1',
            borderColor: '#4f46e5',
            extendedProps: {
              cardId: card.id,
              cardTitle: card.title,
              listTitle: list.title,
            },
          })
        }
```

**Step 3: Commit**

```bash
git add components/CalendarView.tsx
git commit -m "feat: show card date ranges in calendar view"
```

---

## Task 5: Toolbar — pill toggle + 알림 button

**Files:**
- Modify: `components/Toolbar.tsx`
- Modify: `components/BoardView.tsx` (add boardId prop)

**Context:** Replace the two separate buttons with a pill toggle. Add an 알림 button to the right side (left of the filter). The Toolbar needs `boardId` to fetch upcoming checklist items.

**Step 1: Rewrite Toolbar.tsx entirely**

Replace the entire file content with:

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type UpcomingTask = {
  id: string
  title: string
  due_date: string
  completed: boolean
  cards: {
    id: string
    title: string
    card_members: Array<{
      user_id: string
      profiles: { id: string; name: string } | null
    }>
  } | null
}

type ToolbarProps = {
  boardId: string
  onViewChange: (view: 'board' | 'calendar') => void
  onUserFilterChange: (userId: string | null) => void
  users: Array<{ id: string; name: string }>
}

export function Toolbar({ boardId, onViewChange, onUserFilterChange, users }: ToolbarProps) {
  const [currentView, setCurrentView] = useState<'board' | 'calendar'>('board')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [isAlarmOpen, setIsAlarmOpen] = useState(false)
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([])
  const [alarmLoading, setAlarmLoading] = useState(false)
  const alarmRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Close alarm dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (alarmRef.current && !alarmRef.current.contains(e.target as Node)) {
        setIsAlarmOpen(false)
      }
    }
    if (isAlarmOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isAlarmOpen])

  const handleViewChange = (view: 'board' | 'calendar') => {
    setCurrentView(view)
    onViewChange(view)
  }

  const handleUserFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'all' ? null : e.target.value
    setSelectedUser(value)
    onUserFilterChange(value)
  }

  const handleAlarmClick = async () => {
    if (isAlarmOpen) {
      setIsAlarmOpen(false)
      return
    }

    setAlarmLoading(true)
    setIsAlarmOpen(true)

    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('checklist_items')
        .select(`
          id, title, due_date, completed,
          cards (
            id, title,
            card_members (
              user_id,
              profiles ( id, name )
            )
          )
        `)
        .eq('completed', false)
        .gte('due_date', today)
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true })
        .limit(5)

      if (error) throw error
      setUpcomingTasks((data as unknown as UpcomingTask[]) || [])
    } catch (err) {
      console.error('Error fetching upcoming tasks:', err)
      setUpcomingTasks([])
    } finally {
      setAlarmLoading(false)
    }
  }

  return (
    <div className="bg-navy-light px-6 py-3 flex items-center justify-between">
      {/* Left: pill toggle */}
      <div className="flex rounded-full border border-white/30 overflow-hidden text-sm">
        <button
          onClick={() => handleViewChange('board')}
          className={`px-4 py-1.5 transition-colors ${
            currentView === 'board'
              ? 'bg-white text-gray-900 font-medium'
              : 'text-white/60 hover:text-white'
          }`}
        >
          보드뷰
        </button>
        <button
          onClick={() => handleViewChange('calendar')}
          className={`px-4 py-1.5 transition-colors ${
            currentView === 'calendar'
              ? 'bg-white text-gray-900 font-medium'
              : 'text-white/60 hover:text-white'
          }`}
        >
          달력뷰
        </button>
      </div>

      {/* Right: alarm + filter */}
      <div className="flex items-center gap-3">
        {/* 알림 button */}
        <div className="relative" ref={alarmRef}>
          <button
            onClick={handleAlarmClick}
            className="px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            🔔 알림
          </button>

          {isAlarmOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm">임박한 할 일 (상위 5개)</h3>
              </div>

              {alarmLoading ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">불러오는 중...</div>
              ) : upcomingTasks.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">임박한 할 일이 없습니다</div>
              ) : (
                <ul>
                  {upcomingTasks.map((task) => {
                    const members = task.cards?.card_members ?? []
                    const memberNames = members
                      .map((m) => m.profiles?.name)
                      .filter(Boolean)
                      .join(', ')
                    const dueDateStr = new Date(task.due_date.split('T')[0] + 'T00:00:00')
                      .toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })

                    return (
                      <li key={task.id} className="px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-gray-800 text-sm font-medium leading-snug">{task.title}</span>
                          <span className="text-xs text-gray-400 shrink-0">📅 {dueDateStr}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          {task.cards?.title && (
                            <span className="text-gray-500">{task.cards.title}</span>
                          )}
                          {memberNames && (
                            <span className="ml-2 text-gray-400">· 👤 {memberNames}</span>
                          )}
                          {!memberNames && (
                            <span className="ml-2 text-gray-400">· 담당자 없음</span>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* User filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/80">👤 필터:</span>
          <select
            value={selectedUser || 'all'}
            onChange={handleUserFilterChange}
            className="px-3 py-1 bg-white text-navy rounded focus:outline-none focus:ring-2 focus:ring-white text-sm"
          >
            <option value="all">모두 보기</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Update BoardView.tsx — pass boardId to Toolbar**

In `components/BoardView.tsx`, find the `<Toolbar` usage (around line 257):

```tsx
      <Toolbar
        onViewChange={setCurrentView}
        onUserFilterChange={setUserFilter}
        users={users}
      />
```

Replace with:

```tsx
      <Toolbar
        boardId={board.id}
        onViewChange={setCurrentView}
        onUserFilterChange={setUserFilter}
        users={users}
      />
```

**Step 3: Verify manually**

1. Open a board → confirm view toggle is now a pill shape
2. Click "달력뷰" → switches to calendar → pill active side changes
3. Click "🔔 알림" → dropdown appears showing upcoming checklist items
4. Confirm checklist items without due_date are excluded
5. Confirm completed items are excluded
6. Click outside dropdown → closes

**Step 4: Commit**

```bash
git add components/Toolbar.tsx components/BoardView.tsx
git commit -m "feat: pill toggle for view switch, alarm button with upcoming tasks"
```

---

## Summary

| Task | Files | Commit message |
|---|---|---|
| 1 | `lib/supabase/client.ts` + Supabase SQL | `feat: add start_date to cards DB and TypeScript types` |
| 2 | `components/CardModal.tsx` | `feat: add start/end date picker to CardModal` |
| 3 | `components/Card.tsx` | `feat: update card date display to show start~end range` |
| 4 | `components/CalendarView.tsx` | `feat: show card date ranges in calendar view` |
| 5 | `components/Toolbar.tsx`, `components/BoardView.tsx` | `feat: pill toggle for view switch, alarm button with upcoming tasks` |

**Order dependency:** Task 1 must be done first (DB column must exist before CardModal/Card.tsx try to read/write start_date). Tasks 2–5 can be done in any order after Task 1.
