'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type BoardMemberManagerProps = {
  boardId: string
  currentMembers: Array<{ user_id: string; profiles?: any }>
  users: Array<{ id: string; name: string; email: string }>
  isOwner: boolean
  currentUserId: string
  onUpdate: () => void
  onClose: () => void
}

export function BoardMemberManager({
  boardId,
  currentMembers,
  users,
  isOwner,
  currentUserId,
  onUpdate,
  onClose,
}: BoardMemberManagerProps) {
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const handleToggleMember = async (userId: string) => {
    const isAssigned = currentMembers.some(m => m.user_id === userId)
    setLoadingUsers(prev => new Set(prev).add(userId))
    try {
      if (isAssigned) {
        const { error } = await supabase
          .from('board_members')
          .delete()
          .eq('board_id', boardId)
          .eq('user_id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('board_members')
          .insert({ board_id: boardId, user_id: userId })
        if (error) throw error
      }
      onUpdate()
    } catch (error) {
      console.error('Error toggling board member:', error)
    } finally {
      setLoadingUsers(prev => { const s = new Set(prev); s.delete(userId); return s })
    }
  }

  return (
    <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 z-30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-navy">보드 멤버</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
      </div>

      <div className="space-y-2">
        {users.map((user) => {
          const isAssigned = currentMembers.some(m => m.user_id === user.id)
          const isCurrentUser = user.id === currentUserId
          const canToggle = isOwner && !isCurrentUser

          return (
            <div
              key={user.id}
              className="flex items-center gap-3 px-3 py-2 rounded"
            >
              <div className="w-8 h-8 rounded-full bg-navy text-white text-xs flex items-center justify-center flex-shrink-0">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-navy font-medium text-sm">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              {canToggle ? (
                <button
                  onClick={() => handleToggleMember(user.id)}
                  disabled={loadingUsers.has(user.id)}
                  className={`text-xs px-2 py-1 rounded transition-colors disabled:opacity-50 ${
                    isAssigned
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-navy text-white hover:bg-navy-light'
                  }`}
                >
                  {loadingUsers.has(user.id) ? '...' : isAssigned ? '제거' : '추가'}
                </button>
              ) : (
                isAssigned && (
                  <span className="text-xs text-gray-400">
                    {isCurrentUser && isOwner ? '나 (관리자)' : '멤버'}
                  </span>
                )
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
