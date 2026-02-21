'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Toolbar } from './Toolbar'
import { List } from './List'
import { CreateListButton } from './CreateListButton'

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
  const router = useRouter()

  const handleRefresh = () => {
    router.refresh()
  }

  // Filter cards based on selected user
  const filteredLists = userFilter
    ? lists.map(list => ({
        ...list,
        cards: list.cards.filter((card: any) =>
          card.card_members.some((m: any) => m.user_id === userFilter)
        ),
      }))
    : lists

  return (
    <div className="min-h-screen bg-navy">
      <Toolbar
        onViewChange={setCurrentView}
        onUserFilterChange={setUserFilter}
        users={users}
      />

      {currentView === 'board' ? (
        <div className="p-6 overflow-x-auto">
          <h1 className="text-3xl font-bold text-white mb-6">{board.title}</h1>

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
        </div>
      ) : (
        <div className="p-6">
          <p className="text-gray-400">달력 뷰는 나중에 구현됩니다.</p>
        </div>
      )}
    </div>
  )
}
