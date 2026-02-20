'use client'

import { useState } from 'react'

type ToolbarProps = {
  onViewChange: (view: 'board' | 'calendar') => void
  onUserFilterChange: (userId: string | null) => void
  users: Array<{ id: string; name: string }>
}

export function Toolbar({ onViewChange, onUserFilterChange, users }: ToolbarProps) {
  const [currentView, setCurrentView] = useState<'board' | 'calendar'>('board')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  const handleViewChange = (view: 'board' | 'calendar') => {
    setCurrentView(view)
    onViewChange(view)
  }

  const handleUserFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'all' ? null : e.target.value
    setSelectedUser(value)
    onUserFilterChange(value)
  }

  return (
    <div className="bg-navy-light px-6 py-3 flex items-center justify-between">
      <div className="flex gap-2">
        <button
          onClick={() => handleViewChange('board')}
          className={`px-4 py-2 rounded transition-colors ${
            currentView === 'board'
              ? 'bg-white text-navy font-medium'
              : 'bg-navy-dark text-white hover:bg-navy'
          }`}
        >
          📋 보드 뷰
        </button>
        <button
          onClick={() => handleViewChange('calendar')}
          className={`px-4 py-2 rounded transition-colors ${
            currentView === 'calendar'
              ? 'bg-white text-navy font-medium'
              : 'bg-navy-dark text-white hover:bg-navy'
          }`}
        >
          📅 달력 뷰
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm">👤 필터:</span>
        <select
          value={selectedUser || 'all'}
          onChange={handleUserFilterChange}
          className="px-3 py-1 bg-white text-navy rounded focus:outline-none focus:ring-2 focus:ring-white"
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
  )
}
