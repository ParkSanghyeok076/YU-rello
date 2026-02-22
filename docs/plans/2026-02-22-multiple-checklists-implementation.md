# Multiple Checklists Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 카드 안에 체크리스트를 여러 개 만들 수 있도록 `checklists` 테이블을 추가하고, 제목 편집·삭제 기능을 지원한다.

**Architecture:** 새 `checklists` 테이블이 `cards`와 `checklist_items` 사이의 중간 레이어로 추가된다. 기존 `checklist_items.card_id`는 `checklist_id`로 교체된다. `CardModal`은 `checklists` 배열을 fetch해 각각 `ChecklistSection`으로 렌더링하고, "+ 체크리스트 추가" 버튼으로 새 체크리스트를 생성한다.

**Tech Stack:** Next.js 14, React, Supabase (PostgreSQL), TypeScript, Tailwind CSS

---

### Task 1: DB 마이그레이션 (Supabase 대시보드에서 직접 실행)

**Files:**
- 없음 (Supabase SQL Editor에서 실행)

**Step 1: Supabase 대시보드 > SQL Editor에서 아래 SQL을 순서대로 실행**

```sql
-- 1. checklists 테이블 생성
CREATE TABLE checklists (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id    uuid REFERENCES cards(id) ON DELETE CASCADE,
  title      text NOT NULL DEFAULT '체크리스트',
  position   integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 2. 기존 checklist_items의 card_id별로 checklists 행 생성
INSERT INTO checklists (card_id, title, position)
SELECT DISTINCT card_id, '체크리스트', 0
FROM checklist_items;

-- 3. checklist_items에 checklist_id 컬럼 추가 (일단 nullable)
ALTER TABLE checklist_items
  ADD COLUMN checklist_id uuid REFERENCES checklists(id) ON DELETE CASCADE;

-- 4. 기존 아이템들의 checklist_id 채우기
UPDATE checklist_items ci
SET checklist_id = cl.id
FROM checklists cl
WHERE cl.card_id = ci.card_id;

-- 5. checklist_id를 NOT NULL로 변경
ALTER TABLE checklist_items
  ALTER COLUMN checklist_id SET NOT NULL;

-- 6. checklist_items에서 card_id 컬럼 제거
ALTER TABLE checklist_items
  DROP COLUMN card_id;
```

**Step 2: 결과 확인**

SQL Editor에서 아래를 실행해 데이터가 올바르게 마이그레이션 됐는지 확인:
```sql
SELECT cl.title, ci.title as item_title
FROM checklists cl
JOIN checklist_items ci ON ci.checklist_id = cl.id
LIMIT 10;
```
기존 아이템들이 체크리스트와 연결되어 있어야 함.

---

### Task 2: ChecklistSection 컴포넌트 전면 교체

**Files:**
- Modify: `components/ChecklistSection.tsx`

**Step 1: 파일 전체를 아래 코드로 교체**

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChecklistItem } from './ChecklistItem'

type ChecklistSectionProps = {
  checklist: { id: string; title: string }
  items: any[]
  onUpdate: () => void
  onDelete: () => void
}

export function ChecklistSection({ checklist, items, onUpdate, onDelete }: ChecklistSectionProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(checklist.title)
  const [isAdding, setIsAdding] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemDueDate, setNewItemDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSaveTitle = async () => {
    const trimmed = titleValue.trim()
    if (!trimmed) {
      setTitleValue(checklist.title)
      setIsEditingTitle(false)
      return
    }
    await supabase
      .from('checklists')
      .update({ title: trimmed })
      .eq('id', checklist.id)
    setIsEditingTitle(false)
    onUpdate()
  }

  const handleDelete = async () => {
    if (!confirm(`"${checklist.title}" 체크리스트를 삭제하시겠습니까?`)) return
    await supabase.from('checklists').delete().eq('id', checklist.id)
    onDelete()
  }

  const handleAdd = async () => {
    if (!newItemTitle.trim()) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('checklist_items')
        .insert({
          checklist_id: checklist.id,
          title: newItemTitle.trim(),
          due_date: newItemDueDate || null,
          position: items.length,
        })
      if (error) throw error
      setNewItemTitle('')
      setNewItemDueDate('')
      setIsAdding(false)
      onUpdate()
    } catch (error) {
      console.error('Error adding item:', error)
      alert('항목 추가 실패')
    } finally {
      setLoading(false)
    }
  }

  const completedCount = items.filter((item) => item.completed).length
  const totalCount = items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-navy">☑</span>
        {isEditingTitle ? (
          <input
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle()
              if (e.key === 'Escape') {
                setTitleValue(checklist.title)
                setIsEditingTitle(false)
              }
            }}
            autoFocus
            className="text-lg font-semibold text-navy border-b border-navy focus:outline-none bg-transparent flex-1"
          />
        ) : (
          <h3
            className="text-lg font-semibold text-navy cursor-pointer hover:underline flex-1"
            onClick={() => setIsEditingTitle(true)}
          >
            {checklist.title}
          </h3>
        )}
        <button
          onClick={handleDelete}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-red-50 hover:text-red-600 text-gray-600"
        >
          Delete
        </button>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500 w-8">{Math.round(progress)}%</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-navy h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-1 mb-2">
        {items
          .sort((a, b) => a.position - b.position)
          .map((item) => (
            <ChecklistItem key={item.id} item={item} onUpdate={onUpdate} />
          ))}
      </div>

      {/* Add new item */}
      {isAdding ? (
        <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded">
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
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={newItemDueDate}
              onChange={(e) => setNewItemDueDate(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-navy text-sm focus:outline-none focus:ring-2 focus:ring-navy"
            />
            <button
              onClick={handleAdd}
              disabled={loading || !newItemTitle.trim()}
              className="px-3 py-1 bg-navy text-white text-sm rounded hover:bg-navy-light disabled:opacity-50"
            >
              {loading ? '추가 중...' : '추가'}
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewItemTitle('')
                setNewItemDueDate('')
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 text-gray-600"
        >
          Add an item
        </button>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/ChecklistSection.tsx
git commit -m "feat: rewrite ChecklistSection for multiple checklists support"
```

---

### Task 3: CardModal 수정

**Files:**
- Modify: `components/CardModal.tsx`

**Step 1: fetchCard 쿼리에서 `checklist_items (*)` → `checklists (*, checklist_items (*))` 로 변경**

찾을 코드 (`CardModal.tsx` 49번째 줄 근처):
```ts
        checklist_items (*),
```

바꿀 코드:
```ts
        checklists (*, checklist_items (*)),
```

**Step 2: 체크리스트 섹션 렌더링 부분 교체**

찾을 코드 (`CardModal.tsx` 277~282번째 줄):
```tsx
          {/* Checklist */}
          <ChecklistSection
            cardId={cardId}
            items={(card as any).checklist_items || []}
            onUpdate={handleSectionUpdate}
          />
```

바꿀 코드:
```tsx
          {/* Checklists */}
          {((card as any).checklists || [])
            .sort((a: any, b: any) => a.position - b.position)
            .map((checklist: any) => (
              <ChecklistSection
                key={checklist.id}
                checklist={{ id: checklist.id, title: checklist.title }}
                items={checklist.checklist_items || []}
                onUpdate={handleSectionUpdate}
                onDelete={handleSectionUpdate}
              />
            ))}

          {/* 체크리스트 추가 버튼 */}
          <div>
            <button
              onClick={async () => {
                const checklists = (card as any).checklists || []
                await supabase.from('checklists').insert({
                  card_id: cardId,
                  title: '체크리스트',
                  position: checklists.length,
                })
                handleSectionUpdate()
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 text-gray-600"
            >
              + 체크리스트 추가
            </button>
          </div>
```

**Step 3: Commit**

```bash
git add components/CardModal.tsx
git commit -m "feat: support multiple checklists in CardModal"
```

---

### Task 4: Board 페이지 쿼리 및 CalendarView 수정

**Files:**
- Modify: `app/board/[id]/page.tsx`
- Modify: `components/CalendarView.tsx`

**Step 1: board/[id]/page.tsx 쿼리 수정**

찾을 코드:
```ts
        checklist_items (*),
```

바꿀 코드:
```ts
        checklists (*, checklist_items (*)),
```

**Step 2: CalendarView.tsx 수정**

찾을 코드 (`CalendarView.tsx` 27~44번째 줄):
```tsx
        // 체크리스트 아이템 마감일
        card.checklist_items?.forEach((item: any) => {
          if (item.due_date) {
            calendarEvents.push({
              id: item.id,
              title: `${item.completed ? '✓ ' : ''}${item.title}`,
              date: item.due_date.split('T')[0],
              backgroundColor: item.completed ? '#22c55e' : '#1a2b4a',
              borderColor: item.completed ? '#16a34a' : '#0a1b3a',
              extendedProps: {
                cardId: card.id,
                cardTitle: card.title,
                listTitle: list.title,
                completed: item.completed,
              },
            })
          }
        })
```

바꿀 코드:
```tsx
        // 체크리스트 아이템 마감일
        card.checklists?.forEach((cl: any) => {
          cl.checklist_items?.forEach((item: any) => {
            if (item.due_date) {
              calendarEvents.push({
                id: item.id,
                title: `${item.completed ? '✓ ' : ''}${item.title}`,
                date: item.due_date.split('T')[0],
                backgroundColor: item.completed ? '#22c55e' : '#1a2b4a',
                borderColor: item.completed ? '#16a34a' : '#0a1b3a',
                extendedProps: {
                  cardId: card.id,
                  cardTitle: card.title,
                  listTitle: list.title,
                  completed: item.completed,
                },
              })
            }
          })
        })
```

**Step 3: Commit**

```bash
git add app/board/[id]/page.tsx components/CalendarView.tsx
git commit -m "feat: update board query and calendar view for multiple checklists"
```

---

### Task 5: 동작 확인

**Step 1: 개발 서버 실행**

```bash
npm run dev
```

**Step 2: 브라우저에서 확인할 사항**

1. 기존 카드를 열면 기존 체크리스트 아이템들이 "체크리스트" 제목의 섹션 아래에 그대로 표시되는지 확인
2. 체크리스트 제목 클릭 → 이름 변경 → Enter → 저장되는지 확인
3. "Delete" 버튼으로 체크리스트 삭제 확인
4. "+ 체크리스트 추가" 버튼으로 새 체크리스트 생성 확인
5. 새 체크리스트에 항목 추가 확인
6. 달력 뷰에서 체크리스트 아이템 마감일이 여전히 표시되는지 확인
