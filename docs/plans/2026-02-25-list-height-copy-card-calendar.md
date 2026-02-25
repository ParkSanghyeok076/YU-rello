# List Height Revert + Copy Card + Calendar Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** (1) 리스트 고정 높이 제거 & Toolbar를 화면 하단 고정, (2) 카드 우클릭 복사 기능 (데스크탑+모바일), (3) 달력 뷰 높이 채우기 + 현재 월만 표시

**Architecture:**
- Feature 1: List.tsx에서 고정 높이 제거, BoardView.tsx에서 Toolbar를 fixed bottom으로 이동
- Feature 2: Card.tsx에 우클릭 컨텍스트 메뉴 추가, 새 CopyCardModal.tsx 컴포넌트 생성, CardModal.tsx 하단에 모바일용 복사 버튼 추가
- Feature 3: CalendarView.tsx에 fixedWeekCount=false 설정 및 높이 100% 적용, BoardView.tsx의 달력 컨테이너 높이 설정

**Tech Stack:** Next.js 14 App Router, React + TypeScript, Tailwind CSS, Supabase client, FullCalendar

---

### Task 1: 리스트 고정 높이 제거

**Files:**
- Modify: `components/List.tsx` line 106

**현재 코드 (List.tsx:106):**
```tsx
className="flex-shrink-0 w-72 bg-dark-list rounded-xl p-3 h-[calc(100vh-160px)] flex flex-col"
```

**Step 1: List.tsx의 외부 div에서 고정 높이 제거**

`h-[calc(100vh-160px)]`를 제거한다:
```tsx
className="flex-shrink-0 w-72 bg-dark-list rounded-xl p-3 flex flex-col"
```

**Step 2: 카드 영역의 flex-1 overflow-y-auto 제거**

List.tsx:198의 카드 컨테이너:
```tsx
// 변경 전
<div ref={setDroppableRef} className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1">

// 변경 후
<div ref={setDroppableRef} className="space-y-2 mb-2 pr-1">
```

**Step 3: 확인**
- 브라우저에서 리스트에 카드가 없을 때 짧고, 카드 추가 시 아래로 늘어나는지 확인

---

### Task 2: Toolbar를 화면 하단 고정으로 이동

**Files:**
- Modify: `components/BoardView.tsx`

**Step 1: BoardView.tsx에서 Toolbar를 fixed bottom으로 이동**

현재 구조:
```tsx
<div className="min-h-screen bg-dark-bg">
  <Toolbar ... />
  {currentView === 'board' ? (...) : (...)}
</div>
```

변경 후 구조:
```tsx
<div className="min-h-screen bg-dark-bg pb-[50px]">
  {currentView === 'board' ? (...) : (...)}

  {/* CardModal for calendar */}
  {calendarCardId && (...)}

  {/* Fixed bottom toolbar */}
  <div className="fixed bottom-0 left-0 right-0 z-40">
    <Toolbar
      boardId={board.id}
      onViewChange={setCurrentView}
      onUserFilterChange={setUserFilter}
      users={users}
    />
  </div>
</div>
```

**주의:** `pb-[50px]`은 fixed Toolbar 높이만큼 하단 패딩 추가 (컨텐츠가 Toolbar에 가려지지 않도록)

**Step 2: 확인**
- Toolbar가 화면 최하단에 고정되는지 확인
- 스크롤해도 Toolbar가 항상 하단에 있는지 확인
- 보드뷰/달력뷰 전환 정상 동작 확인

---

### Task 3: CopyCardModal 컴포넌트 생성

**Files:**
- Create: `components/CopyCardModal.tsx`

**Step 1: CopyCardModal.tsx 파일 생성**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

type CopyCardModalProps = {
  sourceCardId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CopyCardModal({ sourceCardId, isOpen, onClose, onSuccess }: CopyCardModalProps) {
  const [title, setTitle] = useState('')
  const [keepChecklists, setKeepChecklists] = useState(true)
  const [lists, setLists] = useState<any[]>([])
  const [selectedListId, setSelectedListId] = useState('')
  const [selectedPosition, setSelectedPosition] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [sourceCard, setSourceCard] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && sourceCardId) {
      fetchData()
    }
  }, [isOpen, sourceCardId])

  const fetchData = async () => {
    setFetching(true)
    try {
      // 소스 카드 상세 정보 조회
      const { data: cardData } = await supabase
        .from('cards')
        .select(`
          *,
          lists (id, board_id, title),
          checklists (
            *,
            checklist_items (*)
          )
        `)
        .eq('id', sourceCardId)
        .single()

      if (!cardData) return

      setSourceCard(cardData)
      setTitle(cardData.title)

      // 보드의 모든 리스트 조회 (카드 개수 포함)
      const { data: listsData } = await supabase
        .from('lists')
        .select('id, title, cards(id)')
        .eq('board_id', cardData.lists.board_id)
        .order('position', { ascending: true })

      if (listsData) {
        setLists(listsData)
        // 기본값: 소스 카드의 리스트, 마지막 위치
        setSelectedListId(cardData.list_id)
        const sourceList = listsData.find((l: any) => l.id === cardData.list_id)
        setSelectedPosition((sourceList?.cards?.length ?? 0) + 1)
      }
    } catch (err) {
      console.error('Error fetching card data:', err)
    } finally {
      setFetching(false)
    }
  }

  // 선택된 리스트가 변경될 때 position 업데이트
  const handleListChange = (listId: string) => {
    setSelectedListId(listId)
    const list = lists.find((l: any) => l.id === listId)
    setSelectedPosition((list?.cards?.length ?? 0) + 1)
  }

  const getPositionCount = () => {
    const list = lists.find((l: any) => l.id === selectedListId)
    return (list?.cards?.length ?? 0) + 1
  }

  const handleSubmit = async () => {
    if (!title.trim() || !selectedListId || !sourceCard) return
    setLoading(true)
    try {
      const targetPosition = selectedPosition - 1 // 0-indexed로 변환

      // 1. 타겟 위치 이후의 카드들 position + 1 (기존 카드 밀기)
      const targetList = lists.find((l: any) => l.id === selectedListId)
      if (targetList) {
        const { data: existingCards } = await supabase
          .from('cards')
          .select('id, position')
          .eq('list_id', selectedListId)
          .gte('position', targetPosition)
          .order('position', { ascending: false })

        if (existingCards && existingCards.length > 0) {
          for (const card of existingCards) {
            await supabase
              .from('cards')
              .update({ position: card.position + 1 })
              .eq('id', card.id)
          }
        }
      }

      // 2. 새 카드 삽입
      const { data: newCard, error: cardError } = await supabase
        .from('cards')
        .insert({
          list_id: selectedListId,
          title: title.trim(),
          description: sourceCard.description || null,
          position: targetPosition,
        })
        .select()
        .single()

      if (cardError || !newCard) throw cardError

      // 3. 체크리스트 복사 (선택된 경우)
      if (keepChecklists && sourceCard.checklists?.length > 0) {
        const sortedChecklists = [...sourceCard.checklists].sort(
          (a: any, b: any) => a.position - b.position
        )
        for (const cl of sortedChecklists) {
          const { data: newCl, error: clError } = await supabase
            .from('checklists')
            .insert({
              card_id: newCard.id,
              title: cl.title,
              position: cl.position,
            })
            .select()
            .single()

          if (clError || !newCl) continue

          const sortedItems = [...(cl.checklist_items || [])].sort(
            (a: any, b: any) => a.position - b.position
          )
          for (const item of sortedItems) {
            await supabase.from('checklist_items').insert({
              checklist_id: newCl.id,
              title: item.title,
              position: item.position,
              completed: false,
              due_date: item.due_date || null,
            })
          }
        }
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error copying card:', err)
      alert('카드 복사 실패')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const checklistCount = sourceCard?.checklists?.length ?? 0
  const positionCount = getPositionCount()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">카드 복사</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-light"
          >
            ×
          </button>
        </div>

        {fetching ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {/* 이름 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                이름
              </label>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 포함 항목 */}
            {checklistCount > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  포함...
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepChecklists}
                    onChange={(e) => setKeepChecklists(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    체크리스트 ({checklistCount})
                  </span>
                </label>
              </div>
            )}

            {/* 복사 위치 */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                복사할 위치
              </label>
              <div className="flex gap-2">
                {/* 리스트 선택 */}
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">리스트</label>
                  <select
                    value={selectedListId}
                    onChange={(e) => handleListChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {lists.map((list: any) => (
                      <option key={list.id} value={list.id}>
                        {list.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 위치 선택 */}
                <div className="w-24">
                  <label className="block text-xs text-gray-500 mb-1">위치</label>
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: positionCount }, (_, i) => i + 1).map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={loading || !title.trim()}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '복사 중...' : '카드 만들기'}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
```

---

### Task 4: Card.tsx에 우클릭 컨텍스트 메뉴 추가

**Files:**
- Modify: `components/Card.tsx`

**Step 1: 필요한 import 추가**

파일 상단에 추가:
```tsx
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CopyCardModal } from './CopyCardModal'
```

기존의 `import { useState } from 'react'` 를 위의 import로 교체

**Step 2: Card 함수 내 state + ref 추가**

기존 `const [isModalOpen, setIsModalOpen] = useState(false)` 아래에 추가:
```tsx
const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
const contextMenuRef = useRef<HTMLDivElement>(null)
const supabase = createClient()
```

**Step 3: 컨텍스트 메뉴 닫기 useEffect 추가 (useSortable 아래)**

```tsx
useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
      setContextMenu(null)
    }
  }
  if (contextMenu) {
    document.addEventListener('mousedown', handleClickOutside)
  }
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [contextMenu])
```

**Step 4: 카드 삭제 핸들러 추가**

```tsx
const handleDeleteCard = async (e: React.MouseEvent) => {
  e.stopPropagation()
  setContextMenu(null)
  if (!confirm('정말 이 카드를 삭제하시겠습니까?')) return
  await supabase.from('cards').delete().eq('id', card.id)
  onUpdate?.()
}
```

**Step 5: 우클릭 핸들러 추가**

```tsx
const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  setContextMenu({ x: e.clientX, y: e.clientY })
}
```

**Step 6: motion.div에 onContextMenu 추가**

기존:
```tsx
<motion.div
  ref={setNodeRef}
  style={style}
  {...attributes}
  {...listeners}
  ...
  onClick={() => setIsModalOpen(true)}
  className="..."
>
```

변경 후:
```tsx
<motion.div
  ref={setNodeRef}
  style={style}
  {...attributes}
  {...listeners}
  ...
  onClick={() => setIsModalOpen(true)}
  onContextMenu={handleContextMenu}
  className="..."
>
```

**Step 7: motion.div 닫기 태그(`</motion.div>`) 바로 앞에 컨텍스트 메뉴 JSX 추가**

```tsx
        {/* Right-click context menu */}
        {contextMenu && (
          <div
            ref={contextMenuRef}
            className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[100] overflow-hidden py-1 min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation()
                setContextMenu(null)
                setIsCopyModalOpen(true)
              }}
            >
              📋 카드 복사
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              onClick={handleDeleteCard}
            >
              🗑️ 카드 삭제
            </button>
          </div>
        )}
```

**Step 8: return 블록의 맨 마지막(CardModal 다음)에 CopyCardModal 추가**

```tsx
      <CopyCardModal
        sourceCardId={card.id}
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        onSuccess={() => { setIsCopyModalOpen(false); onUpdate?.() }}
      />
```

**Step 9: 확인**
- 카드 우클릭 시 컨텍스트 메뉴 표시
- "카드 복사" 클릭 시 CopyCardModal 열림
- "카드 삭제" 클릭 시 confirm 후 삭제
- 메뉴 외부 클릭 시 닫힘

---

### Task 5: CardModal.tsx에 모바일용 "카드 복사" 버튼 추가

**Files:**
- Modify: `components/CardModal.tsx`

**Step 1: CopyCardModal import 추가**

파일 상단에:
```tsx
import { CopyCardModal } from './CopyCardModal'
```

**Step 2: state 추가**

기존 `const [loading, setLoading] = useState(false)` 근처에:
```tsx
const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
```

**Step 3: Footer의 삭제 버튼 옆에 복사 버튼 추가**

현재 Footer (CardModal.tsx:404-411):
```tsx
{/* Footer */}
<div className="p-6 border-t border-gray-200">
  <button
    onClick={handleDeleteCard}
    disabled={loading}
    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
  >
    🗑️ 카드 삭제
  </button>
</div>
```

변경 후:
```tsx
{/* Footer */}
<div className="p-6 border-t border-gray-200 flex items-center gap-3">
  <button
    onClick={() => setIsCopyModalOpen(true)}
    disabled={loading}
    className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
  >
    📋 카드 복사
  </button>
  <button
    onClick={handleDeleteCard}
    disabled={loading}
    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
  >
    🗑️ 카드 삭제
  </button>
</div>
```

**Step 4: return 블록 끝(닫는 태그들 바로 앞)에 CopyCardModal 추가**

```tsx
      <CopyCardModal
        sourceCardId={cardId}
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        onSuccess={() => {
          setIsCopyModalOpen(false)
          fetchCard()
          onUpdate()
        }}
      />
```

위치: `</motion.div>` (내부 모달 div) 와 `</motion.div>` (외부 backdrop) 사이

**Step 5: 확인**
- 카드 모달 하단에 "카드 복사" 버튼 표시
- 클릭 시 CopyCardModal 열림
- 복사 성공 후 보드 새로고침

---

### Task 6: CalendarView.tsx 높이 및 fixedWeekCount 수정

**Files:**
- Modify: `components/CalendarView.tsx`

**Step 1: 외부 컨테이너 클래스 수정**

현재 (CalendarView.tsx:82):
```tsx
<div className="bg-white rounded-lg p-6">
```

변경 후:
```tsx
<div className="bg-white rounded-lg p-4 h-full">
```

**Step 2: FullCalendar props 수정**

현재:
```tsx
<FullCalendar
  ...
  height="auto"
  locale="ko"
/>
```

변경 후:
```tsx
<FullCalendar
  ...
  fixedWeekCount={false}
  height="100%"
  locale="ko"
/>
```

---

### Task 7: BoardView.tsx 달력 컨테이너 높이 설정

**Files:**
- Modify: `components/BoardView.tsx`

**Step 1: 달력뷰 컨테이너를 height-aware하게 변경**

현재 (BoardView.tsx의 calendar 분기):
```tsx
) : (
  <div className="p-6">
    {boardHeaderUI}
    <CalendarView
      lists={filteredLists}
      onCardClick={(cardId) => setCalendarCardId(cardId)}
    />
  </div>
)}
```

변경 후:
```tsx
) : (
  <div className="p-6 pb-0 flex flex-col" style={{ height: 'calc(100vh - 50px)' }}>
    {boardHeaderUI}
    <div className="flex-1 min-h-0">
      <CalendarView
        lists={filteredLists}
        onCardClick={(cardId) => setCalendarCardId(cardId)}
      />
    </div>
  </div>
)}
```

여기서 `50px`는 하단 Toolbar의 고정 높이. `min-h-0`은 flexbox에서 자식이 부모를 초과하지 않게 하는 필수 설정.

**Step 2: 확인 사항**
- 달력뷰가 화면 세로를 꽉 채우는지 확인
- 6월 같은 달(28~30일)은 4-5줄, 7월 같은 달은 5줄 (다음 달 주가 나오지 않음) 확인
- 월 이동 시 행 수가 동적으로 변하는지 확인

---

### Task 8: 최종 확인 및 커밋

**Step 1: 전체 기능 통합 테스트**

1. 보드뷰에서 Toolbar가 화면 하단에 고정되는지 확인
2. 달력뷰로 전환 후 Toolbar가 여전히 하단 고정인지 확인
3. 리스트에 카드 없을 때 짧고, 추가할수록 아래로 늘어나는지 확인
4. 카드 우클릭 → 컨텍스트 메뉴 → "카드 복사" → CopyCardModal → 복사 성공 확인
5. 카드 우클릭 → "카드 삭제" → confirm → 삭제 확인
6. CardModal 하단 "카드 복사" 버튼 → CopyCardModal → 복사 성공 확인
7. 달력뷰에서 현재 월 마지막 주 이후로 나타나지 않는지 확인
8. 달력뷰 높이가 화면을 꽉 채우는지 확인

**Step 2: 커밋**

```bash
git add components/List.tsx components/BoardView.tsx components/Card.tsx components/CardModal.tsx components/CalendarView.tsx components/CopyCardModal.tsx
git commit -m "feat: revert list height, add copy card, fix calendar view height"
```
