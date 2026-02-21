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
        className="w-full p-2 text-left text-gray-600 hover:bg-gray-100 rounded transition-colors"
      >
        + 카드 추가
      </button>
    )
  }

  return (
    <div className="bg-white rounded-lg p-2 shadow">
      <form onSubmit={handleSubmit}>
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="카드 제목을 입력하세요..."
          autoFocus
          rows={3}
          className="w-full px-2 py-1 border border-gray-300 rounded text-navy resize-none focus:outline-none focus:ring-2 focus:ring-navy"
        />
        <div className="flex gap-2 mt-2">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="px-3 py-1 bg-navy text-white text-sm rounded hover:bg-navy-light disabled:opacity-50"
          >
            {loading ? '추가 중...' : '카드 추가'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false)
              setTitle('')
            }}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
