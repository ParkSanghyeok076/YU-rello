# 다중 체크리스트 디자인 문서

작성일: 2026-02-22

## 개요

카드 내 체크리스트를 여러 개 만들 수 있도록 기능을 확장합니다. 현재는 체크리스트가 카드당 하나로 고정되어 있으며, 그룹 개념 없이 `checklist_items`가 `card_id`로 직접 연결되어 있습니다.

## 요구사항

- 카드에 기본 체크리스트 1개가 항상 존재 (카드 생성 시 자동 생성)
- "+ 체크리스트 추가" 버튼으로 추가 체크리스트 생성 가능
- 체크리스트 제목 클릭 시 인라인 이름 변경 가능
- 각 체크리스트에 "Delete" 버튼으로 삭제 가능
- 각 체크리스트는 독립적인 진행률 바, "Hide checked items" 기능 보유

## 데이터베이스 스키마

### 새 테이블: `checklists`

```sql
CREATE TABLE checklists (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id    uuid REFERENCES cards(id) ON DELETE CASCADE,
  title      text NOT NULL DEFAULT '체크리스트',
  position   integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

### 기존 테이블 변경: `checklist_items`

- `checklist_id uuid REFERENCES checklists(id) ON DELETE CASCADE` 컬럼 추가
- 기존 `card_id` 컬럼 제거

### 데이터 마이그레이션

기존 `checklist_items`의 각 `card_id`별로 `checklists` 행을 하나 생성하고, 해당 카드의 기존 아이템들을 새 `checklist_id`로 연결합니다.

## UI 구조

```
[✓ 수료처리 (클릭 시 제목 편집)]   [Hide checked]  [Delete]
10% ████░░░░░░
  ☑ 12월
  ☐ 3월
  ☐ 4월
  + Add an item

[✓ 신청안내 (클릭 시 제목 편집)]   [Hide checked]  [Delete]
10% ████░░░░░░
  ☑ 3월 신청안내
  ☐ 4월 신청안내
  + Add an item

[+ 체크리스트 추가]
```

## 컴포넌트 변경

### `ChecklistSection`
- props: `checklist: { id, title }` + `items` + `onUpdate`
- 제목 인라인 편집 (클릭 → input → Enter/blur 저장)
- "Hide checked items" 토글 (로컬 상태)
- "Delete" 버튼 (체크리스트 전체 삭제)
- 아이템 추가 시 `checklist_id` 기반으로 insert

### `CardModal`
- `checklists` 배열 fetch (각 checklist에 items 포함)
- `ChecklistSection`을 checklists 배열만큼 렌더링
- "+ 체크리스트 추가" 버튼으로 새 checklist 생성

### `ChecklistItem`
- 변경 없음 (내부 로직은 동일)

## CardModal 쿼리

```
checklists (
  *,
  checklist_items (*)
)
```
