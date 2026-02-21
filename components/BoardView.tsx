'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  sortableKeyboardCoordinates,
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Toolbar } from './Toolbar'
import { List } from './List'
import { CreateListButton } from './CreateListButton'
import { createClient } from '@/lib/supabase/client'

type BoardViewProps = {
  board: any
  initialLists: any[]
  users: Array<{ id: string; name: string; email: string }>
  currentUserId: string
}

export function BoardView({ board, initialLists, users, currentUserId }: BoardViewProps) {
  const [lists, setLists] = useState(initialLists)
  const [currentView, setCurrentView] = useState<'board' | 'calendar'>('board')
  const [userFilter, setUserFilter] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이상 움직여야 드래그 시작 (클릭과 구분)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleRefresh = () => {
    router.refresh()
  }

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    // 리스트 드래그 처리
    if (active.id.toString().startsWith('list-')) {
      const activeListId = active.id.toString().replace('list-', '')
      const overListId = over.id.toString().replace('list-', '')

      const oldIndex = lists.findIndex((list: any) => list.id === activeListId)
      const newIndex = lists.findIndex((list: any) => list.id === overListId)

      if (oldIndex !== newIndex) {
        const newLists = arrayMove(lists, oldIndex, newIndex)

        for (let i = 0; i < newLists.length; i++) {
          await supabase
            .from('lists')
            .update({ position: i })
            .eq('id', newLists[i].id)
        }

        handleRefresh()
      }

      setActiveId(null)
      return
    }

    // 카드 드래그 처리
    const activeCard = lists
      .flatMap(list => list.cards)
      .find((card: any) => card.id === active.id)

    if (!activeCard) {
      setActiveId(null)
      return
    }

    const overList = lists.find((list: any) =>
      list.cards.some((card: any) => card.id === over.id) || list.id === over.id
    )

    if (!overList) {
      setActiveId(null)
      return
    }

    const oldListId = activeCard.list_id
    const newListId = overList.id

    if (oldListId === newListId) {
      // 같은 리스트 내 재정렬
      const oldList = lists.find((list: any) => list.id === oldListId)
      const oldIndex = oldList.cards.findIndex((card: any) => card.id === active.id)
      const newIndex = oldList.cards.findIndex((card: any) => card.id === over.id)

      if (oldIndex !== newIndex) {
        const newCards = arrayMove(oldList.cards, oldIndex, newIndex)

        for (let i = 0; i < newCards.length; i++) {
          await supabase
            .from('cards')
            .update({ position: i })
            .eq('id', newCards[i].id)
        }

        handleRefresh()
      }
    } else {
      // 다른 리스트로 이동
      await supabase
        .from('cards')
        .update({
          list_id: newListId,
          position: overList.cards.length,
        })
        .eq('id', active.id)

      handleRefresh()
    }

    setActiveId(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  // 유저 필터링
  const filteredLists = userFilter
    ? lists.map(list => ({
        ...list,
        cards: list.cards.filter((card: any) =>
          card.card_members.some((m: any) => m.user_id === userFilter)
        ),
      }))
    : lists

  const listIds = lists.map(list => `list-${list.id}`)

  const activeCard = activeId && !activeId.toString().startsWith('list-')
    ? lists.flatMap(list => list.cards).find((card: any) => card.id === activeId)
    : null

  return (
    <div className="min-h-screen bg-navy">
      <Toolbar
        onViewChange={setCurrentView}
        onUserFilterChange={setUserFilter}
        users={users}
      />

      {currentView === 'board' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="p-6 overflow-x-auto">
            <h1 className="text-3xl font-bold text-white mb-6">{board.title}</h1>

            <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-4 items-start">
                {filteredLists.map((list) => (
                  <List
                    key={list.id}
                    list={list}
                    onUpdate={handleRefresh}
                  />
                ))}

                <CreateListButton
                  boardId={board.id}
                  currentPosition={lists.length}
                  onListCreated={handleRefresh}
                />
              </div>
            </SortableContext>
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="w-72 bg-white border-2 border-navy rounded-lg p-3 opacity-90 shadow-xl">
                <p className="text-navy font-medium">{activeCard.title}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="p-6">
          <p className="text-gray-400">달력 뷰는 나중에 구현됩니다.</p>
        </div>
      )}
    </div>
  )
}
