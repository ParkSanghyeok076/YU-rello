# 리스트 멤버 지정 기능 설계

**날짜:** 2026-02-21
**상태:** 승인됨

---

## 개요

리스트(칸반 컬럼)에 담당 멤버를 지정할 수 있는 기능을 추가한다.
카드의 멤버 시스템과 동일한 패턴을 사용한다.

---

## 목적

- **담당자 표시:** 리스트 헤더에 아바타 원형으로 담당자 표시
- **필터링:** 툴바 사용자 필터 적용 시 리스트 멤버 기준으로도 필터링

---

## 데이터베이스

### 새 테이블: `list_members`

```sql
CREATE TABLE list_members (
  list_id uuid REFERENCES lists(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (list_id, user_id)
);

ALTER TABLE list_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "list_members are viewable by everyone"
  ON list_members FOR SELECT USING (true);

CREATE POLICY "list_members can be managed by authenticated users"
  ON list_members FOR ALL USING (auth.uid() IS NOT NULL);
```

> Supabase Dashboard → SQL Editor 에서 직접 실행 필요.

---

## 컴포넌트 변경

### 신규

| 컴포넌트 | 위치 | 역할 |
|---|---|---|
| `ListMemberPicker` | `components/ListMemberPicker.tsx` | 유저 목록 드롭다운, 토글로 멤버 추가/제거 |

### 수정

| 파일 | 변경 내용 |
|---|---|
| `components/List.tsx` | 헤더에 멤버 아바타 표시, ListMemberPicker 연결 |
| `components/BoardView.tsx` | 쿼리에 `list_members(user_id, profiles(*))` join 추가, 필터 로직 변경 |
| `hooks/useRealtimeSubscription.ts` | `list_members` 테이블 Realtime 구독 추가 |

---

## UI 설계

### 리스트 헤더

```
[ 투두 리스트 ]  ●홍  ●박  ⋯
```

- 리스트 제목 오른쪽, ⋯ 버튼 왼쪽에 멤버 아바타 표시
- 아바타 클릭 → `ListMemberPicker` 드롭다운 오픈
- 멤버 없으면 아바타 미표시 (현재 헤더와 동일하게 보임)
- 아바타 스타일: 기존 `card_members` 아바타와 동일 (원형, 이니셜)

---

## 필터링 로직

### 현재 동작
- 유저 필터 적용 시: 해당 유저가 `card_members`에 있는 카드만 표시

### 변경 후 동작
- 유저 필터 적용 시:
  - **조건 A:** 리스트 멤버에 해당 유저가 포함된 리스트 → 해당 리스트의 모든 카드 표시
  - **조건 B:** 카드 멤버에 해당 유저가 포함된 카드가 있는 리스트 → 해당 카드만 표시
  - 두 조건 OR 합산

```ts
// 의사코드
filteredLists = lists
  .filter(list =>
    list.list_members.some(m => m.user_id === userFilter) ||
    list.cards.some(card => card.card_members.some(m => m.user_id === userFilter))
  )
  .map(list => {
    const isListMember = list.list_members.some(m => m.user_id === userFilter)
    return {
      ...list,
      cards: isListMember
        ? list.cards  // 리스트 담당자면 모든 카드 표시
        : list.cards.filter(card => card.card_members.some(m => m.user_id === userFilter))
    }
  })
```

---

## 구현 순서

1. Supabase SQL 실행 (수동)
2. `ListMemberPicker` 컴포넌트 생성
3. `BoardView.tsx` 쿼리 및 필터 로직 수정
4. `List.tsx` 헤더 UI 수정
5. `useRealtimeSubscription.ts` 구독 추가
