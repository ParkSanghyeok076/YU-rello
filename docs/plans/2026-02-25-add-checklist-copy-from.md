# Add Checklist with Copy-From Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** "체크리스트 추가" 버튼 클릭 시 제목 입력 + 다른 카드의 체크리스트를 선택해 항목을 복사할 수 있는 팝오버 모달로 교체

**Architecture:** 신규 `AddChecklistPopover` 컴포넌트를 생성하고, `CardModal.tsx`의 인라인 추가 버튼 로직을 이 컴포넌트로 교체한다. 팝오버는 열릴 때 같은 보드의 모든 체크리스트를 Supabase에서 fetch해 드롭다운으로 표시하며, 선택 시 항목 복사(completed=false)도 수행한다.

**Tech Stack:** Next.js 14 App Router, React + TypeScript, Tailwind CSS, Supabase client (`createClient()`)

---

### Task 1: AddChecklistPopover 컴포넌트 생성

**Files:**
- Create: `components/AddChecklistPopover.tsx`

**Props:**
```tsx
type AddChecklistPopoverProps = {
  cardId: string       // 체크리스트를 추가할 대상 카드
  boardId: string      // 보드의 모든 체크리스트를 fetch하기 위한 board_id
  position: number     // 새 체크리스트의 position (기존 checklists.length)
  onClose: () => void  // 팝오버 닫기
  onAdded: () => void  // 추가 완료 후 부모 새로고침
}
```

**Step 1: 파일 생성**

`components/AddChecklistPopover.tsx`를 아래 내용으로 생성:

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type SourceChecklist = {
  id: string
  title: string
  cardTitle: string
  items: { id: string; title: string; position: number; due_date: string | null }[]
}

type AddChecklistPopoverProps = {
  cardId: string
  boardId: string
  position: number
  onClose: () => void
  onAdded: () => void
}

export function AddChecklistPopover({
  cardId,
  boardId,
  position,
  onClose,
  onAdded,
}: AddChecklistPopoverProps) {
  const [title, setTitle] = useState('체크리스트')
  const [sourceLists, setSourceLists] = useState<SourceChecklist[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const popoverRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // 보드의 모든 체크리스트 fetch
  useEffect(() => {
    const fetchChecklists = async () => {
      setFetching(true)
      try {
        const { data } = await supabase
          .from('checklists')
          .select(`
            id,
            title,
            checklist_items (id, title, position, due_date),
            cards (id, title, list_id, lists (board_id))
          `)
          .order('position', { ascending: true })

        if (data) {
          // 같은 보드 + 현재 카드 제외
          const filtered = (data as any[])
            .filter((cl) => cl.cards?.lists?.board_id === boardId)
            .map((cl) => ({
              id: cl.id,
              title: cl.title,
              cardTitle: cl.cards?.title ?? '알 수 없음',
              items: (cl.checklist_items ?? []).sort(
                (a: any, b: any) => a.position - b.position
              ),
            }))
          setSourceLists(filtered)
        }
      } catch (err) {
        console.error('Error fetching checklists:', err)
      } finally {
        setFetching(false)
      }
    }

    fetchChecklists()
  }, [boardId])

  // 팝오버 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleSubmit = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      // 1. 체크리스트 생성
      const { data: newCl, error } = await supabase
        .from('checklists')
        .insert({ card_id: cardId, title: title.trim(), position })
        .select()
        .single()

      if (error || !newCl) throw error

      // 2. 소스 체크리스트가 선택된 경우 항목 복사
      if (selectedSourceId) {
        const source = sourceLists.find((cl) => cl.id === selectedSourceId)
        if (source && source.items.length > 0) {
          for (const item of source.items) {
            await supabase.from('checklist_items').insert({
              checklist_id: (newCl as any).id,
              title: item.title,
              position: item.position,
              completed: false,
              due_date: item.due_date ?? null,
            })
          }
        }
      }

      onAdded()
      onClose()
    } catch (err) {
      console.error('Error adding checklist:', err)
      alert('체크리스트 추가 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">체크리스트 추가</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Title */}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
          제목
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          autoFocus
          className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Copy items from */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
          Copy items from...
        </label>
        {fetching ? (
          <div className="text-xs text-gray-400 py-2">불러오는 중...</div>
        ) : (
          <select
            value={selectedSourceId}
            onChange={(e) => setSelectedSourceId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">(없음)</option>
            {sourceLists.map((cl) => (
              <option key={cl.id} value={cl.id}>
                {cl.cardTitle} / {cl.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !title.trim()}
        className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '추가 중...' : '추가'}
      </button>
    </div>
  )
}
```

**Step 2: 빌드 확인**
```bash
npm run build 2>&1 | tail -10
```
Expected: 에러 없음 (컴포넌트가 아직 어디에도 import되지 않았으므로 경고 없음)

**Step 3: Commit**
```bash
git add components/AddChecklistPopover.tsx
git commit -m "feat: add AddChecklistPopover component"
```

---

### Task 2: CardModal.tsx에 AddChecklistPopover 연동

**Files:**
- Modify: `components/CardModal.tsx`

**현재 상태 (CardModal.tsx:360~376):**
```tsx
{/* 체크리스트 추가 */}
<div>
  <button
    onClick={async () => {
      const position = (card as any).checklists?.length ?? 0
      await supabase.from('checklists').insert({
        card_id: cardId,
        title: '체크리스트',
        position,
      })
      handleSectionUpdate()
    }}
    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 text-gray-600"
  >
    + 체크리스트 추가
  </button>
</div>
```

**Step 1: import 추가**

파일 상단에 `AddChecklistPopover` import 추가:
```tsx
import { AddChecklistPopover } from './AddChecklistPopover'
```

**Step 2: state 추가**

기존 `const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)` 아래에:
```tsx
const [isAddChecklistOpen, setIsAddChecklistOpen] = useState(false)
```

**Step 3: 체크리스트 추가 버튼 섹션 교체**

기존 코드를 아래로 교체:
```tsx
{/* 체크리스트 추가 */}
<div className="relative">
  <button
    onClick={() => setIsAddChecklistOpen((prev) => !prev)}
    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 text-gray-600"
  >
    + 체크리스트 추가
  </button>
  {isAddChecklistOpen && (
    <AddChecklistPopover
      cardId={cardId}
      boardId={boardId}
      position={(card as any).checklists?.length ?? 0}
      onClose={() => setIsAddChecklistOpen(false)}
      onAdded={() => {
        setIsAddChecklistOpen(false)
        handleSectionUpdate()
      }}
    />
  )}
</div>
```

**주의:** `boardId`는 CardModal.tsx line 170에 이미 `const boardId = (card as any).lists?.board_id || ''`로 정의되어 있음. 그대로 사용 가능.

**Step 4: 빌드 확인**
```bash
npm run build 2>&1 | tail -15
```
Expected: 빌드 성공

**Step 5: Commit**
```bash
git add components/CardModal.tsx
git commit -m "feat: replace inline checklist add with AddChecklistPopover"
```

---

### Task 3: GitHub 푸시 및 Vercel 배포

**Step 1: 최종 빌드 확인**
```bash
npm run build 2>&1 | tail -10
```

**Step 2: Push**
```bash
git push origin master
```

**Step 3: 동작 확인 체크리스트**
- 카드 모달에서 `+ 체크리스트 추가` 클릭 → 팝오버 표시
- 제목 입력 필드에 "체크리스트" 기본값 표시
- `Copy items from...` 드롭다운에 같은 보드의 체크리스트 목록 표시 (카드명 / 체크리스트명 형식)
- `(없음)` 선택 후 추가 → 빈 체크리스트 생성
- 소스 선택 후 추가 → 항목이 복사된 체크리스트 생성 (체크 상태 초기화)
- 팝오버 외부 클릭 시 닫힘
- Enter 키로 추가 가능
