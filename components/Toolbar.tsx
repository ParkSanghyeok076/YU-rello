'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type UpcomingTask = {
  id: string
  title: string
  due_date: string
  completed: boolean
  cards: {
    id: string
    title: string
    card_members: Array<{
      user_id: string
      profiles: { id: string; name: string } | null
    }>
  } | null
}

type ToolbarProps = {
  boardId: string
  onViewChange: (view: 'board' | 'calendar') => void
  onUserFilterChange: (userId: string | null) => void
  users: Array<{ id: string; name: string }>
}

export function Toolbar({ boardId, onViewChange, onUserFilterChange, users }: ToolbarProps) {
  const [currentView, setCurrentView] = useState<'board' | 'calendar'>('board')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [isAlarmOpen, setIsAlarmOpen] = useState(false)
  const [allUpcomingTasks, setAllUpcomingTasks] = useState<UpcomingTask[]>([])
  const [alarmLoading, setAlarmLoading] = useState(false)
  const [selectedAlarmMember, setSelectedAlarmMember] = useState<string | null>(null)
  const alarmRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Close alarm dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (alarmRef.current && !alarmRef.current.contains(e.target as Node)) {
        setIsAlarmOpen(false)
      }
    }
    if (isAlarmOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isAlarmOpen])

  const handleViewChange = (view: 'board' | 'calendar') => {
    setCurrentView(view)
    onViewChange(view)
  }

  const handleUserFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'all' ? null : e.target.value
    setSelectedUser(value)
    onUserFilterChange(value)
  }

  const handleAlarmClick = async () => {
    if (isAlarmOpen) {
      setIsAlarmOpen(false)
      return
    }

    setAlarmLoading(true)
    setIsAlarmOpen(true)

    try {
      const today = new Date().toISOString().split('T')[0]
      console.log('🔍 [알림 디버그] boardId:', boardId)
      console.log('🔍 [알림 디버그] today:', today)

      // Step 1: get all card IDs in this board
      const { data: listData, error: listError } = await supabase
        .from('lists')
        .select('cards(id)')
        .eq('board_id', boardId)

      console.log('🔍 [알림 디버그] Step 1 - listData:', listData)
      console.log('🔍 [알림 디버그] Step 1 - listError:', listError)

      if (listError) throw listError

      const cardIds = (listData ?? []).flatMap((l: any) =>
        ((l.cards ?? []) as Array<{ id: string }>).map((c) => c.id)
      )

      console.log('🔍 [알림 디버그] Step 1 - cardIds:', cardIds)
      console.log('🔍 [알림 디버그] Step 1 - cardIds.length:', cardIds.length)

      if (cardIds.length === 0) {
        console.log('⚠️ [알림 디버그] cardIds가 비어있음 - 알림 없음으로 표시')
        setAllUpcomingTasks([])
        return
      }

      // Step 2: fetch upcoming checklist items scoped to those cards
      const { data, error } = await supabase
        .from('checklist_items')
        .select(`
          id, title, due_date, completed,
          checklists (
            card_id,
            cards (
              id, title,
              card_members (
                user_id,
                profiles ( id, name )
              )
            )
          )
        `)
        .eq('completed', false)
        .gte('due_date', today)
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true })
        .limit(100)

      console.log('🔍 [알림 디버그] Step 2 - data:', data)
      console.log('🔍 [알림 디버그] Step 2 - error:', error)
      console.log('🔍 [알림 디버그] Step 2 - data?.length:', data?.length)

      if (error) throw error

      // Filter by cardIds and map to expected format (store all for client-side member filter)
      const filteredTasks = (data || [])
        .filter((item: any) => {
          const cardId = item.checklists?.cards?.id
          return cardId && cardIds.includes(cardId)
        })
        .map((item: any) => ({
          ...item,
          cards: item.checklists?.cards || null
        }))

      console.log('🔍 [알림 디버그] Step 2 - filteredTasks:', filteredTasks)
      setAllUpcomingTasks(filteredTasks as UpcomingTask[])
    } catch (err) {
      console.error('❌ [알림 디버그] Error fetching upcoming tasks:', err)
      setAllUpcomingTasks([])
    } finally {
      setAlarmLoading(false)
    }
  }

  return (
    <div className="bg-navy-light px-6 py-3 flex items-center justify-between">
      {/* Left: pill toggle */}
      <div className="flex rounded-full border border-white/30 overflow-hidden text-sm">
        <button
          onClick={() => handleViewChange('board')}
          className={`px-4 py-1.5 transition-colors ${
            currentView === 'board'
              ? 'bg-white text-gray-900 font-medium'
              : 'text-white/60 hover:text-white'
          }`}
        >
          보드뷰
        </button>
        <button
          onClick={() => handleViewChange('calendar')}
          className={`px-4 py-1.5 transition-colors ${
            currentView === 'calendar'
              ? 'bg-white text-gray-900 font-medium'
              : 'text-white/60 hover:text-white'
          }`}
        >
          달력뷰
        </button>
      </div>

      {/* Right: alarm + filter */}
      <div className="flex items-center gap-3">
        {/* 알림 button */}
        <div className="relative" ref={alarmRef}>
          <button
            onClick={handleAlarmClick}
            className="px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            🔔 알림
          </button>

          {isAlarmOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 space-y-2">
                <h3 className="font-semibold text-gray-800 text-sm">임박한 할 일 (상위 10개)</h3>
                <select
                  value={selectedAlarmMember || 'all'}
                  onChange={(e) => setSelectedAlarmMember(e.target.value === 'all' ? null : e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
                >
                  <option value="all">전체 멤버</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              {alarmLoading ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">불러오는 중...</div>
              ) : (() => {
                const displayedTasks = (selectedAlarmMember
                  ? allUpcomingTasks.filter((task) =>
                      task.cards?.card_members.some((m) => m.user_id === selectedAlarmMember)
                    )
                  : allUpcomingTasks
                ).slice(0, 10)

                return displayedTasks.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">임박한 할 일이 없습니다</div>
                ) : (
                  <ul>
                    {displayedTasks.map((task) => {
                      const members = task.cards?.card_members ?? []
                      const memberNames = members
                        .map((m) => m.profiles?.name)
                        .filter(Boolean)
                        .join(', ')
                      const dueDateStr = new Date(task.due_date.split('T')[0] + 'T00:00:00')
                        .toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })

                      return (
                        <li key={task.id} className="px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-gray-800 text-sm font-medium leading-snug">{task.title}</span>
                            <span className="text-xs text-gray-400 shrink-0">📅 {dueDateStr}</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            {task.cards?.title && (
                              <span className="text-gray-500">{task.cards.title}</span>
                            )}
                            {memberNames && (
                              <span className="ml-2 text-gray-400">· 👤 {memberNames}</span>
                            )}
                            {!memberNames && (
                              <span className="ml-2 text-gray-400">· 담당자 없음</span>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )
              })()}
            </div>
          )}
        </div>

        {/* User filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/80">👤 필터:</span>
          <select
            value={selectedUser || 'all'}
            onChange={handleUserFilterChange}
            className="px-3 py-1 bg-white text-navy rounded focus:outline-none focus:ring-2 focus:ring-white text-sm"
          >
            <option value="all">모두 보기</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
