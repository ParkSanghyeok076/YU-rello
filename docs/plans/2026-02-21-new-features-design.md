# YU-rello New Features Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to implement this design task-by-task.

**Goal:** Add 4 features — board deletion, checklist Enter key, list ⋯ menu (rename + delete), and smooth real-time updates without page flicker.

---

## Feature 1: Board Deletion

**Problem:** Dashboard page is a server component with no client interactivity. Boards can only be navigated to, not deleted.

**Solution:** Create `components/BoardCard.tsx` as a client component. Dashboard page renders `<BoardCard>` instead of plain `<a>` tags.

**Behavior:**
- Hover over board card → `⋯` button appears (top-right, `opacity-0 group-hover:opacity-100`)
- Click `⋯` → dropdown menu with single item: "보드 삭제"
- Click "보드 삭제" → `window.confirm()` prompt
- Confirmed → `supabase.from('boards').delete().eq('id', board.id)` → `router.refresh()`
- Board disappears from dashboard

**Files:**
- Create: `components/BoardCard.tsx`
- Modify: `app/dashboard/page.tsx` — import and use `<BoardCard>`

---

## Feature 2: Checklist Enter Key

**Problem:** Adding a checklist item requires clicking the "추가" button. Pressing Enter does nothing.

**Solution:** Add `onKeyDown` handler to the title `<input>` in `ChecklistSection.tsx`.

```tsx
onKeyDown={(e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleAdd()
  }
}}
```

**Files:**
- Modify: `components/ChecklistSection.tsx`

---

## Feature 3: List ⋯ Menu (Rename + Delete)

**Problem:** The `⋯` button in `List.tsx` renders but has no functionality.

**Behavior:**
- Click `⋯` → dropdown menu appears below the button
- Menu items:
  - ✏️ **이름 변경** — replaces list title `<h3>` with an `<input>` inline; press Enter or blur to save
  - 🗑️ **리스트 삭제** — `window.confirm()` → delete list from DB → parent `onUpdate()` callback
- Click outside dropdown → close menu (via `useEffect` with `mousedown` listener or simple blur)

**Rename flow:**
1. Click "이름 변경" → `isRenaming = true` → close dropdown
2. List header shows `<input value={title}>` instead of `<h3>`
3. Press Enter or input loses focus → `supabase.from('lists').update({ title }).eq('id', list.id)` → `onUpdate()`
4. Input replaced back with `<h3>` showing new title

**Delete flow:**
1. Click "리스트 삭제" → `window.confirm('리스트와 모든 카드를 삭제하시겠습니까?')`
2. Confirmed → `supabase.from('lists').delete().eq('id', list.id)`
3. Call `onUpdate()` → BoardView refreshes state

**Dropdown positioning:** `absolute top-full right-0 mt-1 z-20` relative to the `⋯` button's parent container.

**Files:**
- Modify: `components/List.tsx`

---

## Feature 4: Smooth Real-time Updates

**Problem:** `useRealtimeSubscription` calls `router.refresh()` on every DB change event, causing a white flash when the partner makes changes.

**Solution:** Pass `handleRefresh` from `BoardView` into the hook as a callback. Hook calls the callback instead of `router.refresh()`.

**Change to hook signature:**
```typescript
// Before:
export function useRealtimeSubscription(boardId: string)

// After:
export function useRealtimeSubscription(boardId: string, onRefresh: () => void)
```

**All 7 `router.refresh()` calls** inside the hook replaced with `onRefresh()`.

**BoardView usage:**
```typescript
// Before:
useRealtimeSubscription(board.id)

// After:
useRealtimeSubscription(board.id, handleRefresh)
```

**Result:** When partner adds/moves/deletes cards or lists, changes appear on your screen smoothly with no white flash — same as your own actions.

**Files:**
- Modify: `hooks/useRealtimeSubscription.ts`
- Modify: `components/BoardView.tsx`
