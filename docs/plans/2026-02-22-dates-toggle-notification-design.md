# YU-rello: Card Dates, View Toggle, Notification Button Design

작성일: 2026-02-22

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to implement this design task-by-task.

**Goal:** Implement 3 features — (1) card start/end date range, (2) board/calendar view pill toggle, (3) upcoming task notification button.

---

## Feature 1: Card Date Range

### DB Change

Add `start_date DATE` column to `cards` table. The existing `due_date` column remains as the end date.

```sql
ALTER TABLE cards ADD COLUMN start_date DATE;
```

TypeScript type update in `lib/supabase/types.ts`:
```typescript
// cards Row:
start_date: string | null  // ISO date string YYYY-MM-DD
// due_date already exists
```

### Display Logic

| State | Display |
|---|---|
| start_date + due_date both set | `📅 Feb 9 ~ Apr 8` |
| start_date only | `📅 Feb 9` |
| due_date only (existing cards) | `📅 Apr 8` |
| neither | (no date shown) |

### CardModal UI

Add a "날짜" section to `CardModal.tsx` between description and checklist:

```
📅 날짜
  시작일  [ 2026-02-09 ] [✕]
  종료일  [ 2026-04-08 ] [✕]
```

- Two `<input type="date">` fields
- Each has an ✕ button to clear the date
- On change: `supabase.from('cards').update({ start_date }).eq('id', card.id)`
- No separate save button — updates on change (same pattern as checklist item due dates)

### Card.tsx

Update the date badge to use the new display logic:

```tsx
function formatCardDates(start_date: string | null, due_date: string | null): string | null {
  if (start_date && due_date) return `${fmt(start_date)} ~ ${fmt(due_date)}`
  if (start_date) return fmt(start_date)
  if (due_date) return fmt(due_date)
  return null
}
```

Where `fmt` converts ISO string to short Korean locale (e.g. `Feb 9`).

### CalendarView.tsx

Cards appear as events alongside checklist items:
- Both start_date and due_date: multi-day range event (`start: start_date, end: due_date`)
- Single date (either start_date or due_date): one-day event
- Cards with no dates: not shown in calendar

---

## Feature 2: Board/Calendar View Pill Toggle

### Location

`Toolbar.tsx` — replace the existing two separate buttons with a single pill toggle.

### UI

```
┌─────────────────────┐
│  보드뷰  │  달력뷰  │  ← pill shape, rounded-full border
└─────────────────────┘
   active: white bg + dark text
   inactive: transparent + muted text
```

### Implementation

Pure Tailwind CSS, no extra library:

```tsx
<div className="flex rounded-full border border-white/30 overflow-hidden text-sm">
  <button
    onClick={() => setView('board')}
    className={view === 'board'
      ? 'px-4 py-1.5 bg-white text-gray-900 font-medium'
      : 'px-4 py-1.5 text-white/60 hover:text-white'}
  >
    보드뷰
  </button>
  <button
    onClick={() => setView('calendar')}
    className={view === 'calendar'
      ? 'px-4 py-1.5 bg-white text-gray-900 font-medium'
      : 'px-4 py-1.5 text-white/60 hover:text-white'}
  >
    달력뷰
  </button>
</div>
```

**Files:** `components/Toolbar.tsx`

---

## Feature 3: Upcoming Task Notification Button

### Location

`Toolbar.tsx` — to the left of the user filter dropdown.

### Query

Fetch the 5 nearest upcoming incomplete checklist items:

```typescript
const { data } = await supabase
  .from('checklist_items')
  .select(`
    id, title, due_date, completed,
    cards (
      id, title,
      card_members (
        profiles ( id, name, email )
      )
    )
  `)
  .eq('completed', false)
  .gte('due_date', today)         // not in the past
  .not('due_date', 'is', null)    // must have a due date
  .order('due_date', { ascending: true })
  .limit(5)
```

Where `today` = `new Date().toISOString().split('T')[0]`.

### Dropdown UI

Button: `🔔 알림` — same style as the filter button.

```
🔔 알림
─────────────────────────────────
☐  보고서 작성           📅 Feb 25
   AI 교육 · 👤 홍길동
─────────────────────────────────
☐  발표 자료 준비        📅 Mar 1
   YES 개편 · 👤 김철수, 이영희
─────────────────────────────────
☐  (최대 5개)
─────────────────────────────────
     임박한 할 일이 없습니다   ← empty state
```

- `completed` 항목 제외 (`eq('completed', false)`)
- `due_date`가 없는 항목 제외
- 담당자 없으면 "담당자 없음" 표시
- 드롭다운 외부 클릭 시 닫힘 (기존 BoardMemberManager 패턴과 동일)

### Files

- Modify: `components/Toolbar.tsx`

---

## Files Changed Summary

| File | Change |
|---|---|
| `lib/supabase/types.ts` | `cards` Row에 `start_date: string \| null` 추가 |
| `components/CardModal.tsx` | 날짜 섹션 추가 (시작일 + 종료일 picker) |
| `components/Card.tsx` | 날짜 표시 로직 업데이트 |
| `components/CalendarView.tsx` | 카드를 범위 이벤트로 추가 |
| `components/Toolbar.tsx` | pill 토글 + 알림 버튼 드롭다운 |

**Supabase Dashboard 작업 (수동):**
- SQL Editor에서 `ALTER TABLE cards ADD COLUMN start_date DATE;` 실행
