'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChecklistItem } from './ChecklistItem'

type ChecklistSectionProps = {
  cardId: string
  items: any[]
  onUpdate: () => void
}

export function ChecklistSection({ cardId, items, onUpdate }: ChecklistSectionProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemDueDate, setNewItemDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleAdd = async () => {
    if (!newItemTitle.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('checklist_items')
        .insert({
          card_id: cardId,
          title: newItemTitle.trim(),
          due_date: newItemDueDate || null,
          position: items.length,
        })

      if (error) throw error

      setNewItemTitle('')
      setNewItemDueDate('')
      setIsAdding(false)
      onUpdate()
    } catch (error) {
      console.error('Error adding item:', error)
      alert('항목 추가 실패')
    } finally {
      setLoading(false)
    }
  }

  const completedCount = items.filter(item => item.completed).length
  const totalCount = items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div>
      <h3 className="text-lg font-semibold text-navy mb-2 flex items-center gap-2">
        ✓ 체크리스트
        {totalCount > 0 && (
          <span className="text-sm font-normal text-gray-600">
            {completedCount}/{totalCount}
          </span>
        )}
      </h3>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-navy h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Items */}
      <div className="space-y-1 mb-3">
        {items
          .sort((a, b) => a.position - b.position)
          .map((item) => (
            <ChecklistItem key={item.id} item={item} onUpdate={onUpdate} />
          ))}
      </div>

      {/* Add new item */}
      {isAdding ? (
        <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded">
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleAdd()
              }
            }}
            placeholder="항목 제목..."
            autoFocus
            className="px-2 py-1 border border-gray-300 rounded text-navy focus:outline-none focus:ring-2 focus:ring-navy"
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={newItemDueDate}
              onChange={(e) => setNewItemDueDate(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-navy text-sm focus:outline-none focus:ring-2 focus:ring-navy"
            />
            <button
              onClick={handleAdd}
              disabled={loading || !newItemTitle.trim()}
              className="px-3 py-1 bg-navy text-white text-sm rounded hover:bg-navy-light disabled:opacity-50"
            >
              {loading ? '추가 중...' : '추가'}
            </button>
            <button
              onClick={() => {
                setIsAdding(false)
                setNewItemTitle('')
                setNewItemDueDate('')
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
        >
          + 항목 추가
        </button>
      )}
    </div>
  )
}
