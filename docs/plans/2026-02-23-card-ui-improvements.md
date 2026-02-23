# Card UI Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 4 UI issues: checklist progress display on cards, calendar month title visibility, list full-height layout, and card title inline editing.

**Architecture:** All changes are purely client-side component edits. No new files, no API schema changes. Features 1+3+4 are one-line or two-line fixes; Feature 2 adds inline editing state to CardModal.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind CSS, Supabase (client), FullCalendar

---

## Task 1: Fix checklist progress display on Card

**Files:**
- Modify: `components/Card.tsx:46-48`

**Context:**
The card data structure is `card.checklists[].checklist_items[]` (nested), but the current code reads `card.checklist_items` (flat, doesn't exist). This causes `completedItems` and `totalItems` to always be 0, hiding the progress badge entirely.

**Step 1: Edit Card.tsx lines 46-48**

Replace:
```typescript
const completedItems = card.checklist_items?.filter((item: any) => item.completed).length || 0
const totalItems = card.checklist_items?.length || 0
```

With:
```typescript
const allItems = card.checklists?.flatMap((cl: any) => cl.checklist_items || []) || []
const completedItems = allItems.filter((item: any) => item.completed).length
const totalItems = allItems.length
```

**Step 2: Verify in browser**

Open a board. Cards that have checklist items should now show the `✓ N/M` badge (green when all complete, gray otherwise). Cards with no checklist items should show no badge.

**Step 3: Commit**

```bash
git add components/Card.tsx
git commit -m "fix: aggregate checklist items across all checklists for card progress badge"
```

---

## Task 2: Fix calendar month/year title visibility

**Files:**
- Modify: `components/CalendarView.tsx:83-98` (the `<style>` block)

**Context:**
FullCalendar renders the month/year title in `.fc-toolbar-title` at the center of the toolbar, but no color is set for it. The title is likely rendering as transparent or an invisible color against the white background.

**Step 1: Add title CSS to the existing style block**

In `components/CalendarView.tsx`, find the `<style>` block and add one rule at the end:

```css
.fc .fc-toolbar-title { color: #1a2b4a; font-size: 1.5rem; font-weight: 700; }
```

The full style block should look like:
```tsx
<style>{`
  .fc {
    --fc-border-color: #e5e7eb;
    --fc-button-bg-color: #1a2b4a;
    --fc-button-border-color: #1a2b4a;
    --fc-button-hover-bg-color: #2a3b5a;
    --fc-button-hover-border-color: #2a3b5a;
    --fc-button-active-bg-color: #0a1b3a;
    --fc-button-active-border-color: #0a1b3a;
    --fc-today-bg-color: #f0f9ff;
  }
  .fc-event { cursor: pointer; }
  .fc-event:hover { opacity: 0.8; }
  .fc .fc-daygrid-day-number { color: #1a2b4a; }
  .fc .fc-col-header-cell-cushion { color: #1a2b4a; font-weight: 600; }
  .fc .fc-toolbar-title { color: #1a2b4a; font-size: 1.5rem; font-weight: 700; }
`}</style>
```

**Step 2: Verify in browser**

Switch to calendar view. The toolbar center should now show "2026년 2월" (or current month) in dark navy, bold text between the prev/next buttons and the month/week toggle.

**Step 3: Commit**

```bash
git add components/CalendarView.tsx
git commit -m "fix: make calendar toolbar month/year title visible with explicit color"
```

---

## Task 3: Make lists fill full viewport height

**Files:**
- Modify: `components/List.tsx:106`

**Context:**
The list's outer `motion.div` uses `max-h-[calc(100vh-160px)]` which allows the list to be *shorter* than full height when there are few cards. Changing to `h-[calc(100vh-160px)]` forces the list to always occupy the full remaining viewport height. The inner cards area already uses `flex-1 overflow-y-auto` which will fill the remaining space inside the list.

The offset 160px accounts for: Toolbar (~48px) + top padding p-6 (24px) + board header h1 + mb-6 (~88px) = ~160px.

**Step 1: Edit List.tsx line 106**

Find this className in the `motion.div`:
```
className="flex-shrink-0 w-72 bg-dark-list rounded-xl p-3 max-h-[calc(100vh-160px)] flex flex-col"
```

Change `max-h-` to `h-`:
```
className="flex-shrink-0 w-72 bg-dark-list rounded-xl p-3 h-[calc(100vh-160px)] flex flex-col"
```

**Step 2: Verify in browser**

Open a board. Lists should now extend to the bottom of the viewport even when empty. When a list has many cards, the cards area should scroll internally. Try scrolling cards inside a tall list to confirm `overflow-y-auto` still works.

If the height feels off (e.g. list is clipped at the bottom), adjust the px value: increase to `180px` if the bottom is cut off, decrease to `140px` if there's a gap.

**Step 3: Commit**

```bash
git add components/List.tsx
git commit -m "feat: make lists fill full viewport height from the start"
```

---

## Task 4: Card title inline editing in CardModal

**Files:**
- Modify: `components/CardModal.tsx`

**Context:**
The modal title (`<h2>`) is currently static text. We need to add inline editing: clicking the title switches it to an input, Enter/blur saves to Supabase `cards.title`, Escape cancels.

**Step 1: Add title editing state variables**

In `CardModal.tsx`, find the existing state declarations (around line 22-27) and add two new states:

```typescript
const [isEditingTitle, setIsEditingTitle] = useState(false)
const [cardTitle, setCardTitle] = useState('')
```

**Step 2: Populate cardTitle when card data loads**

In the `fetchCard` function (around line 62-66), after `setCard(data)` add:

```typescript
setCardTitle((data as any).title || '')
```

**Step 3: Add handleUpdateTitle function**

After `handleUpdateDueDate` (around line 106), add:

```typescript
const handleUpdateTitle = async () => {
  const trimmed = cardTitle.trim()
  if (!trimmed || trimmed === (card as any).title) {
    setCardTitle((card as any).title)
    setIsEditingTitle(false)
    return
  }
  const { error } = await supabase
    .from('cards')
    .update({ title: trimmed })
    .eq('id', cardId)
  if (!error) {
    setIsEditingTitle(false)
    fetchCard()
    onUpdate()
  }
}
```

**Step 4: Replace the static title `<h2>` with inline edit UI**

Find the static title in the Header section (around line 173):
```tsx
<h2 className="text-2xl font-bold text-navy">{(card as any).title}</h2>
```

Replace with:
```tsx
{isEditingTitle ? (
  <input
    type="text"
    value={cardTitle}
    onChange={(e) => setCardTitle(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') handleUpdateTitle()
      if (e.key === 'Escape') { setCardTitle((card as any).title); setIsEditingTitle(false) }
    }}
    onBlur={handleUpdateTitle}
    autoFocus
    className="text-2xl font-bold text-navy w-full border-b-2 border-navy focus:outline-none bg-transparent"
  />
) : (
  <h2
    className="text-2xl font-bold text-navy cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1 transition-colors"
    onClick={() => setIsEditingTitle(true)}
    title="클릭하여 제목 변경"
  >
    {(card as any).title}
  </h2>
)}
```

**Step 5: Verify in browser**

1. Open a card modal. Hover over the title — it should show a light gray background on hover.
2. Click the title — it should become an editable input with a navy underline.
3. Change the text and press Enter — the title should update in the modal and on the board card.
4. Open the modal again, click the title, press Escape — it should revert to the original title.
5. Click the title, clear all text, then blur — should revert to original (no empty title saved).

**Step 6: Commit**

```bash
git add components/CardModal.tsx
git commit -m "feat: add inline title editing to card modal"
```
