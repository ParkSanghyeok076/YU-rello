# YU-rello UI Polish Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to implement this design task-by-task.

**Goal:** Transform YU-rello's stiff UI into a smooth, polished experience similar to Trello — with a dark theme, optimistic updates, and framer-motion animations.

---

## Problem Statement

The current UI feels "awkward" due to three root causes:

1. **Page flicker** — every action calls `router.refresh()`, causing a full server round-trip and white flash
2. **No visual feedback** — hover/click interactions feel dead with no transitions or depth
3. **Wrong color scheme** — navy blue background looks corporate, not like modern Trello's dark/space theme

---

## Design Decisions

### 1. Optimistic UI (Eliminate Flicker)

**Approach:** Update local `lists` state in `BoardView` immediately, persist to DB in the background.

- On card create: append card to list state before DB call. Rollback on error.
- On card move (drag): update list state immediately (already partially done), remove `router.refresh()` after DB write
- On list create: append list to state before DB call. Rollback on error.
- Keep `router.refresh()` only for `CardModal` internal data (complex joins, still acceptable)

**Files:** `BoardView.tsx`, `CreateCardButton.tsx`, `CreateListButton.tsx`

---

### 2. Dark Theme

Inspired by the Trello screenshot (dark starry background).

| Element | Current | New |
|---------|---------|-----|
| Page background | `#1a2b4a` (navy) | `#0d1117` (near-black) |
| Header | `bg-navy` | `bg-black` |
| List container | `bg-white` | `bg-[#161b22]` (dark gray) |
| List title text | `text-navy` | `text-white` |
| Card background | `bg-white` | `bg-white` (keep white for contrast) |
| Card text | `text-navy` | `text-gray-800` |
| "Add card" button | gray text | `text-gray-300 hover:text-white` |
| Board title | `text-white` | `text-white` (keep) |

**Tailwind custom colors to add:**
```
dark-bg: '#0d1117'
dark-list: '#161b22'
dark-list-hover: '#1c2128'
```

**Files:** `tailwind.config.ts`, `app/globals.css`, `components/BoardView.tsx`, `components/List.tsx`, `components/Card.tsx`, `components/Header.tsx`, `components/CreateCardButton.tsx`, `components/CreateListButton.tsx`

---

### 3. framer-motion Animations

Install `framer-motion` package.

**Card animations:**
- New card entrance: `initial={{ opacity: 0, y: -8 }}` → `animate={{ opacity: 1, y: 0 }}`, duration 0.15s
- Card hover: `whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}`
- Card tap: `whileTap={{ scale: 0.98 }}`

**Modal animations:**
- Backdrop: `initial={{ opacity: 0 }}` → `animate={{ opacity: 1 }}`, duration 0.15s
- Modal panel: `initial={{ opacity: 0, scale: 0.96, y: -8 }}` → `animate={{ opacity: 1, scale: 1, y: 0 }}`, duration 0.2s

**List animations:**
- New list entrance: `initial={{ opacity: 0, x: -12 }}` → `animate={{ opacity: 1, x: 0 }}`, duration 0.2s

**Files:** `components/Card.tsx`, `components/CardModal.tsx`, `components/List.tsx`

---

### 4. Card Hover Action Button

On card hover, show a pencil/edit icon button in the top-right corner.

- Uses CSS `group` + `group-hover:opacity-100` (no extra JS needed)
- Button opens CardModal (same as clicking the card)
- Visually separates "drag handle area" from "click to open" intent
- Button style: small rounded square, dark semi-transparent background, white icon

**Files:** `components/Card.tsx`

---

## Component-Level Changes

### `BoardView.tsx`
- Replace `handleRefresh` with `handleOptimisticUpdate(newLists)` for card/list mutations
- Remove `router.refresh()` from drag end handlers
- Update background: `bg-navy` → `bg-dark-bg`

### `List.tsx`
- Background: `bg-white` → `bg-dark-list`
- Title: `text-navy` → `text-white`
- Wrap in `motion.div` for entrance animation
- Drag handle: `text-gray-500` → `text-gray-400`

### `Card.tsx`
- Wrap in `motion.div` for hover/entrance animations
- Add `group` class for hover action button
- Add hover edit button (top-right, `opacity-0 group-hover:opacity-100`)
- Metadata badges: keep emoji for now, improve spacing

### `CardModal.tsx`
- Wrap backdrop and panel in `motion.div`
- Add entrance/exit animations

### `CreateCardButton.tsx`
- Accept `onOptimisticAdd(tempCard)` callback instead of `onCardCreated()`
- On submit: call optimistic callback immediately, then DB insert

### `CreateListButton.tsx`
- Accept `onOptimisticAdd(tempList)` callback
- On submit: call optimistic callback immediately, then DB insert

### `Header.tsx`
- Background: `bg-navy` → `bg-black`

### `tailwind.config.ts`
- Add `dark-bg`, `dark-list`, `dark-list-hover` color tokens

---

## Package Changes

```bash
npm install framer-motion
```

---

## Out of Scope

- Icon library (lucide-react) — not needed for this pass
- List inline title editing — save for future
- Board background image/gradient — save for future
