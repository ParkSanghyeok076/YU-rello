# Design: Checklist Item Reorder + Board Pan

**Date:** 2026-03-03
**Status:** Approved

---

## Feature 1: Checklist Item Drag-to-Reorder

### Goal
체크리스트 항목을 드래그 핸들로 잡아 같은 체크리스트 내에서 순서를 변경할 수 있다.

### Affected Files
- `components/ChecklistSection.tsx`
- `components/ChecklistItem.tsx`

### Design

**ChecklistSection.tsx**
- 항목 목록을 `DndContext` + `SortableContext`로 감싼다 (@dnd-kit 중첩 DndContext 공식 지원)
- 센서: `PointerSensor` (activationConstraint 없음, 핸들에만 리스너 부착하므로 불필요)
- `handleDragEnd`:
  1. `arrayMove`로 로컬 순서 재정렬 (낙관적 업데이트)
  2. 순서가 변경된 항목만 필터링 (`newPosition !== oldPosition`)
  3. 변경된 항목들 Supabase 일괄 업데이트 (`position = index + 1`)
  4. 실패 시: 이전 순서로 로컬 상태 롤백 + 에러 토스트 표시
  5. 성공 시: `onUpdate()` 호출
- `DragOverlay`: 드래그 중인 항목의 미리보기 렌더링

**ChecklistItem.tsx**
- `useSortable` 훅 적용
- `⠿` 드래그 핸들 아이콘을 항목 왼쪽에 추가
  - 핸들에만 `{...attributes} {...listeners}` 부착 (체크박스/텍스트는 클릭 정상 동작)
  - 기본: `opacity: 30%`, 호버: `opacity: 100%`, `cursor: grab`
- 드래그 중인 항목: `opacity: 40%` (원본 위치 표시)

### Error Handling
- Supabase 업데이트 실패 시: 이전 `items` 상태로 롤백, 에러 메시지 표시
- 낙관적 업데이트로 UI 반응성 유지

---

## Feature 2: Board Pan by Dragging Empty Space

### Goal
보드의 빈 공간을 클릭+드래그하여 상하좌우로 화면을 이동할 수 있다.

### Affected Files
- `components/BoardView.tsx`
- `components/List.tsx`
- `components/Card.tsx`

### Design

**BoardView.tsx**
- 스크롤 컨테이너에 이벤트 핸들러 추가: `onMouseDown`, `onMouseMove`, `onMouseUp`, `onMouseLeave`
- 전역 `window` mouseup 리스너 (`useEffect`에서 등록/해제) — 보드 밖에서 마우스 놓을 때 팬 해제
- 팬 상태: `isPanning`, `startX`, `startY`, `scrollLeftStart`, `scrollTopStart` (ref로 관리, 리렌더 불필요)

**팬 활성화 조건 (`onMouseDown`)**
- `e.target.closest('[data-no-pan]')`이 존재하면 팬 모드 시작 안 함
- 왼쪽 마우스 버튼(`e.button === 0`)만 처리
- `e.preventDefault()` 호출 (드래그 중 텍스트 선택 방지)

**팬 동작 (`onMouseMove`)**
- `isPanning` 중일 때만 동작
- `scrollLeft = scrollLeftStart - (e.clientX - startX)`
- `scrollTop = scrollTopStart - (e.clientY - startY)` (1:1 비율, 자연스러운 느낌)

**커서**
- 기본: `cursor: grab` (빈 공간 호버 인식)
- 팬 중: 컨테이너 전체에 `cursor: grabbing` + `user-select: none` 강제 적용

**data-no-pan 적용 대상**
- `List.tsx`: 리스트 컨테이너 루트에 `data-no-pan`
- `Card.tsx`: 카드 컨테이너 루트에 `data-no-pan`
- BoardView 내 버튼/툴바 등 인터랙티브 요소: `data-no-pan`

---

## Summary

| 항목 | 변경 파일 | 신규 의존성 |
|------|-----------|------------|
| 체크리스트 순서 변경 | ChecklistSection.tsx, ChecklistItem.tsx | 없음 (@dnd-kit 기존 사용) |
| 보드 팬 | BoardView.tsx, List.tsx, Card.tsx | 없음 (순수 마우스 이벤트) |
