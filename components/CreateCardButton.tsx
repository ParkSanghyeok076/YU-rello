'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CreateCardButtonProps = {
  listId: string
  currentPosition: number
  onCardCreated: () => void
}

export function CreateCardButton({ listId, currentPosition, onCardCreated }: CreateCardButtonProps) {
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
        .from('cards')
        .insert({
          list_id: listId,
          title: title.trim(),
          position: currentPosition,
        })

      if (error) throw error

      setTitle('')
      setIsAdding(false)
      onCardCreated()
    } catch (error) {
      console.error('Error creating card:', error)
      alert('카드 생성 실패')
    } finally {
      setLoading(false)
    }
  }

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full p-2 text-left text-gray-400 hover:bg-dark-list-hover hover:text-white rounded-lg transition-colors flex items-center gap-1"
      >
        <span className="text-lg leading-none">+</span>
        <span className="text-sm">카드 추가</span>
      </button>
    )
  }

  return (
    <div className="bg-[#22272e] rounded-lg p-2 shadow-lg">
      <form onSubmit={handleSubmit}>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="카드 제목을 입력하세요..."
          autoFocus
          rows={3}
          className="w-full px-2 py-1.5 border border-gray-600 bg-[#2d333b] rounded text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 text-sm"
        />
        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '추가 중...' : '카드 추가'}
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
