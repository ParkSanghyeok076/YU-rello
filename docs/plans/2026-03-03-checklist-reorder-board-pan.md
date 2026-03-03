# Checklist Reorder + Board Pan Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 체크리스트 항목을 드래그 핸들로 순서 변경 + 보드 빈 공간 드래그로 화면 이동

**Architecture:**
- 기능 1: `@dnd-kit` 중첩 DndContext를 `ChecklistSection` 안에 추가. `ChecklistItem`에 `useSortable` + 드래그 핸들 추가. 낙관적 업데이트 + 실패 시 롤백.
- 기능 2: `BoardView` 스크롤 컨테이너에 마우스 이벤트 핸들러 추가. `data-no-pan` 속성으로 인터랙티브 요소 팬 제외. 전역 `mouseup`으로 보드 밖 해제 처리.

**Tech Stack:** @dnd-kit/core, @dnd-kit/sortable (기존 설치됨), React useState/useRef/useEffect, Supabase client

---

## Task 1: ChecklistItem에 useSortable + 드래그 핸들 추가

**Files:**
- Modify: `components/ChecklistItem.tsx`

**Step 1: 파일 상단 import 수정**

기존:
```tsx
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
```

변경 후:
```tsx
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
```

**Step 2: 컴포넌트 내부 — 기존 useState 선언들 바로 아래에 추가**

`const supabase = createClient()` 줄 다음에 삽입:
```tsx
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({ id: item.id })

const sortableStyle = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.4 : 1,
}
```

**Step 3: 편집 모드 반환 div에 ref와 style 추가 (line 79)**

기존:
```tsx
<div className="flex flex-col gap-2 p-2 bg-gray-50 rounded">
```

변경 후:
```tsx
<div ref={setNodeRef} style={sortableStyle} className="flex flex-col gap-2 p-2 bg-gray-50 rounded">
```

**Step 4: 일반 모드 반환 — 외부 div에 ref/style 추가 + 드래그 핸들 삽입 (line 115-116)**

기존:
```tsx
  return (
    <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded group">
      <input
        type="checkbox"
```

변경 후:
```tsx
  return (
    <div ref={setNodeRef} style={sortableStyle} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded group">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-100 transition-opacity select-none px-0.5 text-sm"
        title="드래그하여 순서 변경"
      >
        ⠿
      </div>
      <input
        type="checkbox"
```

**Step 5: 빌드 확인**

```bash
cd "/c/Users/ADMIN/AppData/Local/WEMEETS/yulink/yulink files/■■■Claude House■■■/yu-rello"
npx tsc --noEmit
```

Expected: 에러 없음

**Step 6: Commit**

```bash
git add components/ChecklistItem.tsx
git commit -m "feat: add drag handle and useSortable to ChecklistItem"
```

---

## Task 2: ChecklistSection에 DnD Context 추가

**Files:**
- Modify: `components/ChecklistSection.tsx`

**Step 1: import 수정**

기존:
```tsx
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChecklistItem } from './ChecklistItem'
```

변경 후:
```tsx
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChecklistItem } from './ChecklistItem'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
```

**Step 2: 컴포넌트 내부 — 기존 useState 선언들 바로 아래에 추가**

`const supabase = createClient()` 줄 다음에 삽입:
```tsx
const [localItems, setLocalItems] = useState(() =>
  [...items].sort((a, b) => a.position - b.position)
)
const [draggingItem, setDraggingItem] = useState<any>(null)
const dndSensors = useSensors(useSensor(PointerSensor))

useEffect(() => {
  setLocalItems([...items].sort((a, b) => a.position - b.position))
}, [items])
```

**Step 3: handleItemDragEnd 함수 추가 — handleDelete 함수 다음에 삽입**

```tsx
const handleItemDragEnd = async (event: any) => {
  const { active, over } = event
  setDraggingItem(null)
  if (!over || active.id === over.id) return

  const oldIndex = localItems.findIndex((item: any) => item.id === active.id)
  const newIndex = localItems.findIndex((item: any) => item.id === over.id)
  if (oldIndex === newIndex) return

  const newItems = arrayMove(localItems, oldIndex, newIndex)
  const previousItems = [...localItems]

  setLocalItems(newItems)

  try {
    await Promise.all(
      newItems.map((item: any, index: number) =>
        supabase.from('checklist_items').update({ position: index + 1 }).eq('id', item.id)
      )
    )
    onUpdate()
  } catch (error) {
    console.error('Error reordering checklist items:', error)
    setLocalItems(previousItems)
    alert('순서 변경 실패')
  }
}
```

**Step 4: Items 렌더링 교체 (line 143-150)**

기존:
```tsx
      {/* Items */}
      <div className="space-y-1 mb-2">
        {[...items]
          .sort((a, b) => a.position - b.position)
          .map((item) => (
            <ChecklistItem key={item.id} item={item} onUpdate={onUpdate} />
          ))}
      </div>
```

변경 후:
```tsx
      {/* Items */}
      <DndContext
        sensors={dndSensors}
        onDragStart={(event) =>
          setDraggingItem(localItems.find((i: any) => i.id === event.active.id) ?? null)
        }
        onDragEnd={handleItemDragEnd}
        onDragCancel={() => setDraggingItem(null)}
      >
        <SortableContext
          items={localItems.map((i: any) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1 mb-2">
            {localItems.map((item: any) => (
              <ChecklistItem key={item.id} item={item} onUpdate={onUpdate} />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {draggingItem ? (
            <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded shadow-lg opacity-90">
              <span className="text-gray-400 select-none text-sm">⠿</span>
              <span className={`text-navy ${draggingItem.completed ? 'line-through text-gray-400' : ''}`}>
                {draggingItem.title}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
```

**Step 5: 빌드 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

**Step 6: 수동 테스트**

1. 브라우저에서 보드 열기
2. 카드 클릭 → 카드 모달 열기
3. 체크리스트 항목이 2개 이상 있는 경우 `⠿` 핸들 호버 시 진해지는지 확인
4. 핸들을 드래그하여 순서 변경 → 드래그 오버레이 표시 확인
5. 드롭 후 순서가 바뀐 상태로 유지되는지 확인

**Step 7: Commit**

```bash
git add components/ChecklistSection.tsx
git commit -m "feat: add drag-to-reorder for checklist items using dnd-kit"
```

---

## Task 3: List와 Card에 data-no-pan 속성 추가

**Files:**
- Modify: `components/List.tsx`
- Modify: `components/Card.tsx`

**Step 1: List.tsx — 외부 motion.div에 data-no-pan 추가 (line 100)**

기존:
```tsx
    <motion.div
      ref={setSortableRef}
      style={style}
      initial={{ opacity: 0, x: -12 }}
```

변경 후:
```tsx
    <motion.div
      ref={setSortableRef}
      style={style}
      data-no-pan
      initial={{ opacity: 0, x: -12 }}
```

**Step 2: Card.tsx — 외부 motion.div에 data-no-pan 추가 (line 85)**

기존:
```tsx
      <motion.div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        initial={{ opacity: 0, y: -8 }}
```

변경 후:
```tsx
      <motion.div
        ref={setNodeRef}
        style={style}
        data-no-pan
        {...attributes}
        {...listeners}
        initial={{ opacity: 0, y: -8 }}
```

**Step 3: 빌드 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

**Step 4: Commit**

```bash
git add components/List.tsx components/Card.tsx
git commit -m "feat: add data-no-pan attribute to List and Card for board pan"
```

---

## Task 4: BoardView에 보드 팬 기능 추가

**Files:**
- Modify: `components/BoardView.tsx`

**Step 1: useRef/useEffect는 이미 import됨. useState도 이미 import됨. 확인만.**

`components/BoardView.tsx` 상단 import:
```tsx
import { useState, useRef, useEffect } from 'react'
```
→ 이미 있으므로 변경 불필요

**Step 2: 컴포넌트 내부 — 기존 const supabase 선언 다음에 팬 관련 ref/state 추가**

`const supabase = createClient()` 줄 다음에 삽입:
```tsx
const scrollContainerRef = useRef<HTMLDivElement>(null)
const isPanningRef = useRef(false)
const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
const [isPanning, setIsPanning] = useState(false)
```

**Step 3: 전역 mouseup 리스너 — 기존 useEffect 바로 아래에 새 useEffect 추가**

`useRealtimeSubscription(board.id, handleRefresh)` 줄 다음에 삽입:
```tsx
useEffect(() => {
  const handleGlobalMouseUp = () => {
    isPanningRef.current = false
    setIsPanning(false)
  }
  window.addEventListener('mouseup', handleGlobalMouseUp)
  return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
}, [])
```

**Step 4: 팬 핸들러 함수 추가 — handleDragCancel 함수 다음에 삽입**

```tsx
const handlePanMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
  if (e.button !== 0) return
  const target = e.target as HTMLElement
  if (target.closest('[data-no-pan], button, input, a, select, textarea')) return

  const container = scrollContainerRef.current
  if (!container) return

  isPanningRef.current = true
  setIsPanning(true)
  panStart.current = {
    x: e.clientX,
    y: e.clientY,
    scrollLeft: container.scrollLeft,
    scrollTop: container.scrollTop,
  }
  e.preventDefault()
}

const handlePanMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  if (!isPanningRef.current) return
  const container = scrollContainerRef.current
  if (!container) return
  container.scrollLeft = panStart.current.scrollLeft - (e.clientX - panStart.current.x)
  container.scrollTop = panStart.current.scrollTop - (e.clientY - panStart.current.y)
}

const stopPanOnElement = () => {
  isPanningRef.current = false
  setIsPanning(false)
}
```

**Step 5: 스크롤 컨테이너 div 수정 (line 267)**

기존:
```tsx
        <div className="flex-1 overflow-x-auto overflow-y-auto">
```

변경 후:
```tsx
        <div
          ref={scrollContainerRef}
          className={`flex-1 overflow-x-auto overflow-y-auto ${isPanning ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
          onMouseDown={handlePanMouseDown}
          onMouseMove={handlePanMouseMove}
          onMouseUp={stopPanOnElement}
          onMouseLeave={stopPanOnElement}
        >
```

**Step 6: 빌드 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

**Step 7: 수동 테스트**

1. 보드 빈 공간 호버 시 `cursor: grab` (손 모양 커서) 확인
2. 빈 공간 드래그 시 보드가 마우스 방향으로 이동하는지 확인
3. 카드 클릭이 정상 동작하는지 확인 (팬 모드 미활성화)
4. 리스트 드래그 순서 변경이 정상 동작하는지 확인
5. 보드 밖에서 마우스 놓아도 팬 상태 해제되는지 확인

**Step 8: Commit**

```bash
git add components/BoardView.tsx
git commit -m "feat: add board pan by dragging empty space"
```

---

## 완료 후 검증

전체 기능 통합 테스트:
1. 체크리스트 항목 드래그 순서 변경 후 모달 닫고 다시 열었을 때 순서 유지 확인
2. 체크리스트 드래그 중 보드 카드 드래그가 비활성화되는지 확인 (모달이 열려있으면 자연스럽게 분리됨)
3. 보드 팬 중 체크박스/버튼 클릭이 정상 동작하는지 확인

```bash
npx next build
```

Expected: 빌드 성공, 타입 에러 없음
