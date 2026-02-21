'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CreateListButtonProps = {
  boardId: string
  currentPosition: number
  onListCreated: () => void
}

export function CreateListButton({ boardId, currentPosition, onListCreated }: CreateListButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('lists')
        .insert({
          board_id: boardId,
          title: title.trim(),
          position: currentPosition,
        })

      if (error) throw error

      setTitle('')
      setIsAdding(false)
      onListCreated()
    } catch (error) {
      console.error('Error creating list:', error)
      alert('리스트 생성 실패')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex-shrink-0 w-72 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-left"
      >
        <span className="text-white/80 text-sm">+ 리스트 추가</span>
      </button>
    )
  }

  return (
    <div className="flex-shrink-0 w-72 bg-dark-list rounded-xl p-3">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="리스트 제목 입력..."
          autoFocus
          className="w-full px-3 py-2 border border-gray-600 bg-[#2d333b] rounded text-white mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '추가 중...' : '리스트 추가'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false)
              setTitle('')
            }}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
