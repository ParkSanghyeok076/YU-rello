'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ListMemberPickerProps = {
  listId: string
  currentMembers: Array<{ user_id: string; profiles?: any }>
  users: Array<{ id: string; name: string; email: string }>
  onUpdate: () => void
  onClose: () => void
}

export function ListMemberPicker({ listId, currentMembers, users, onUpdate, onClose }: ListMemberPickerProps) {
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const handleToggleMember = async (userId: string) => {
    const isAssigned = currentMembers.some(m => m.user_id === userId)
    setLoadingUsers(prev => new Set(prev).add(userId))
    try {
      if (isAssigned) {
        const { error } = await supabase
          .from('list_members')
          .delete()
          .eq('list_id', listId)
          .eq('user_id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('list_members')
          .insert({ list_id: listId, user_id: userId })
        if (error) throw error
      }
      onUpdate()
    } catch (error) {
      console.error('Error toggling list member:', error)
    } finally {
      setLoadingUsers(prev => { const s = new Set(prev); s.delete(userId); return s })
    }
  }

  return (
    <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64 z-30">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-navy">리스트 멤버</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
      </div>

      <div className="space-y-2">
        {users.map((user) => {
          const isAssigned = currentMembers.some(m => m.user_id === user.id)
          return (
            <button
              key={user.id}
              onClick={() => handleToggleMember(user.id)}
              disabled={loadingUsers.has(user.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <div className="w-8 h-8 rounded-full bg-navy text-white text-xs flex items-center justify-center flex-shrink-0">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 text-left">
                <p className="text-navy font-medium">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              {isAssigned && <span className="text-navy font-bold">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
