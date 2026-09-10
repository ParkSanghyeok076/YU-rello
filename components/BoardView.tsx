'use client'

import { useState, useRef, useEffect } from 'react'
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
import { CalendarView } from './CalendarView'
import { CardModal } from './CardModal'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription'
import { BoardMemberManager } from './BoardMemberManager'

type BoardViewProps = {
  board: any
  initialLists: any[]
  users: Array<{ id: string; name: string; email: string }>
  currentUserId: string
  boardMembers: Array<{ user_id: string; profiles?: any }>
  isOwner: boolean
  isAdmin: boolean
}

export function BoardView({ board, initialLists, users, currentUserId, boardMembers: initialBoardMembers, isOwner, isAdmin }: BoardViewProps) {
  const [lists, setLists] = useState(initialLists)
  const [currentView, setCurrentView] = useState<'board' | 'calendar'>('board')
  const [userFilter, setUserFilter] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [calendarCardId, setCalendarCardId] = useState<string | null>(null)
  const [isMemberManagerOpen, setIsMemberManagerOpen] = useState(false)
  const [boardMembers, setBoardMembers] = useState(initialBoardMembers)
  const memberManagerRef = useRef<HTMLDivElement>(null)
  const [isBoardSwitcherOpen, setIsBoardSwitcherOpen] = useState(false)
  const [switcherBoards, setSwitcherBoards] = useState<Array<{ id: string; title: string }> | null>(null)
  const [switcherLoading, setSwitcherLoading] = useState(false)
  const boardSwitcherRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isPanningRef = useRef(false)
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  const [isPanning, setIsPanning] = useState(false)

  // 현재 유저 이름 조회
  const currentUserName = users.find(u => u.id === currentUserId)?.name || 'User'

  const handleRefresh = async () => {
    const { data } = await supabase
      .from('lists')
      .select(`
        *,
        list_members (user_id, profiles (*)),
        cards (
          *,
          card_labels (label_id, labels (*)),
          card_members (user_id, profiles (*)),
          checklists (*, checklist_items (*)),
          comments (*)
        )
      `)
      .eq('board_id', board.id)
      .is('archived_at', null)
      .order('position', { ascending: true })
    if (data) {
      const filtered = data.map((list: any) => ({
        ...list,
        cards: (list.cards || []).filter((c: any) => !c.archived_at)
      }))
      setLists(filtered)
    }
    const { data: members } = await supabase
      .from('board_members')
      .select('user_id, profiles(*)')
      .eq('board_id', board.id)
    if (members) setBoardMembers(members)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (memberManagerRef.current && !memberManagerRef.current.contains(e.target as Node)) {
        setIsMemberManagerOpen(false)
      }
    }
    if (isMemberManagerOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMemberManagerOpen])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (boardSwitcherRef.current && !boardSwitcherRef.current.contains(e.target as Node)) {
        setIsBoardSwitcherOpen(false)
      }
    }
    if (isBoardSwitcherOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isBoardSwitcherOpen])

  const handleBoardSwitcherClick = async () => {
    if (isBoardSwitcherOpen) {
      setIsBoardSwitcherOpen(false)
      return
    }
    setIsBoardSwitcherOpen(true)
    if (switcherBoards === null) {
      setSwitcherLoading(true)
      // RLS가 board_members 기준으로 필터링하므로 접근 권한 없는 보드는 조회 자체가 되지 않음
      const { data } = await supabase
        .from('boards')
        .select('id, title')
        .order('created_at', { ascending: false })
      setSwitcherBoards(data || [])
      setSwitcherLoading(false)
    }
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isPanningRef.current = false
      setIsPanning(false)
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [])

  useRealtimeSubscription(board.id, handleRefresh)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    // 리스트 드래그
    if (active.id.toString().startsWith('list-')) {
      const activeListId = active.id.toString().replace('list-', '')
      const overListId = over.id.toString().replace('list-', '')

      const oldIndex = lists.findIndex((list: any) => list.id === activeListId)
      const newIndex = lists.findIndex((list: any) => list.id === overListId)

      if (oldIndex !== newIndex) {
        const newLists = arrayMove(lists, oldIndex, newIndex)
        for (let i = 0; i < newLists.length; i++) {
          await supabase.from('lists').update({ position: i }).eq('id', newLists[i].id)
        }
        handleRefresh()
      }

      setActiveId(null)
      return
    }

    // 카드 드래그
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
      const oldList = lists.find((list: any) => list.id === oldListId)
      const oldIndex = oldList.cards.findIndex((card: any) => card.id === active.id)
      const newIndex = oldList.cards.findIndex((card: any) => card.id === over.id)

      if (oldIndex !== newIndex) {
        const newCards = arrayMove(oldList.cards, oldIndex, newIndex)
        for (let i = 0; i < newCards.length; i++) {
          await supabase.from('cards').update({ position: i }).eq('id', (newCards[i] as any).id)
        }
        handleRefresh()
      }
    } else {
      await supabase
        .from('cards')
        .update({ list_id: newListId, position: overList.cards.length })
        .eq('id', active.id)
      handleRefresh()
    }

    setActiveId(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const handlePanMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('[data-no-pan], button, input, a, select, textarea')) return

    const container = scrollContainerRef.current
    if (!container) return

    isPanningRef.current = true
    setIsPanning(true)
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    }
    e.preventDefault()
  }

  const handlePanMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanningRef.current) return
    const container = scrollContainerRef.current
    if (!container) return
    container.scrollLeft = panStart.current.scrollLeft - (e.clientX - panStart.current.x)
    container.scrollTop = panStart.current.scrollTop - (e.clientY - panStart.current.y)
  }

  const stopPanOnElement = () => {
    isPanningRef.current = false
    setIsPanning(false)
  }

  const filteredLists = userFilter
    ? lists
        .filter((list: any) =>
          list.list_members?.some((m: any) => m.user_id === userFilter) ||
          (list.cards ?? []).some((card: any) =>
            (card.card_members ?? []).some((m: any) => m.user_id === userFilter)
          )
        )
        .map((list: any) => {
          const isListMember = list.list_members?.some((m: any) => m.user_id === userFilter)
          return {
            ...list,
            cards: isListMember
              ? list.cards
              : (list.cards ?? []).filter((card: any) =>
                  (card.card_members ?? []).some((m: any) => m.user_id === userFilter)
                ),
          }
        })
    : lists

  const listIds = lists.map(list => `list-${list.id}`)

  const activeCard = activeId && !activeId.toString().startsWith('list-')
    ? lists.flatMap(list => list.cards).find((card: any) => card.id === activeId)
    : null

  const boardHeaderUI = (
    <div className="flex items-center gap-4 mb-6 flex-wrap">
      <div className="relative" ref={boardSwitcherRef}>
        <h1
          className="text-3xl font-bold text-white cursor-pointer"
          onClick={handleBoardSwitcherClick}
        >
          {board.title}
        </h1>

        {isBoardSwitcherOpen && (
          <div className="absolute left-0 top-full mt-2 w-64 max-h-96 overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
            {switcherLoading ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">불러오는 중...</div>
            ) : switcherBoards && switcherBoards.length > 0 ? (
              <ul>
                {switcherBoards.map((b) => (
                  <li key={b.id}>
                    <button
                      onClick={() => { setIsBoardSwitcherOpen(false); router.push(`/board/${b.id}`) }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        b.id === board.id
                          ? 'bg-gray-100 text-navy font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {b.title}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-6 text-center text-sm text-gray-400">접근 가능한 보드가 없습니다</div>
            )}
          </div>
        )}
      </div>

      {/* 멤버 아바타 */}
      <div className="flex items-center">
        {boardMembers.slice(0, 3).map((m: any) => (
          <div
            key={m.user_id}
            title={m.profiles?.name}
            className="w-10 h-8 rounded-lg bg-blue-500 text-white text-sm flex items-center justify-center -ml-1 first:ml-0 border-2 border-[#0d1117]"
          >
            {(m.profiles?.name?.slice(1) || m.profiles?.name?.[0] || "").toUpperCase()}
          </div>
        ))}
        {boardMembers.length > 3 && (
          <div className="w-8 h-8 rounded-full bg-gray-500 text-white text-xs flex items-center justify-center -ml-1 border-2 border-[#0d1117]">
            +{boardMembers.length - 3}
          </div>
        )}
      </div>

      {/* 멤버 관리 버튼 (owner 또는 admin) */}
      {(isOwner || isAdmin) && (
        <div className="relative" ref={memberManagerRef}>
          <button
            onClick={() => setIsMemberManagerOpen(prev => !prev)}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
          >
            + 멤버 초대
          </button>
          {isMemberManagerOpen && (
            <BoardMemberManager
              boardId={board.id}
              currentMembers={boardMembers}
              users={users}
              isOwner={isOwner}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              onUpdate={() => { setIsMemberManagerOpen(false); handleRefresh() }}
              onClose={() => setIsMemberManagerOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-dark-bg">
      {/* Toolbar at top */}
      <Toolbar
        boardId={board.id}
        onViewChange={setCurrentView}
        onUserFilterChange={setUserFilter}
        users={users}
        onBoardUpdate={handleRefresh}
      />

      {/* Content area fills remaining height — horizontal scrollbar always at viewport bottom */}
      {currentView === 'board' ? (
        <div
          ref={scrollContainerRef}
          className={`flex-1 overflow-x-auto overflow-y-auto ${isPanning ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
          onMouseDown={handlePanMouseDown}
          onMouseMove={handlePanMouseMove}
          onMouseUp={stopPanOnElement}
          onMouseLeave={stopPanOnElement}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="p-6">
              {boardHeaderUI}

              <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
                <div className="flex gap-4 items-start">
                  {filteredLists.map((list) => (
                    <List
                      key={list.id}
                      list={list}
                      onUpdate={handleRefresh}
                      currentUserId={currentUserId}
                      currentUserName={currentUserName}
                      users={users}
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
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col p-6 pb-0">
          {boardHeaderUI}
          <div className="flex-1 min-h-0">
            <CalendarView
              lists={filteredLists}
              onCardClick={(cardId) => setCalendarCardId(cardId)}
            />
          </div>
        </div>
      )}

      {/* 캘린더에서 카드 클릭 시 모달 */}
      {calendarCardId && (
        <CardModal
          cardId={calendarCardId}
          isOpen={true}
          onClose={() => setCalendarCardId(null)}
          onUpdate={handleRefresh}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
        />
      )}
    </div>
  )
}
