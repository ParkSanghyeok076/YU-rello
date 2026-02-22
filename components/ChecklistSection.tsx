'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChecklistItem } from './ChecklistItem'

type ChecklistSectionProps = {
  checklist: { id: string; title: string }
  items: any[]
  onUpdate: () => void
  onDelete: () => void
}

export function ChecklistSection({ checklist, items, onUpdate, onDelete }: ChecklistSectionProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(checklist.title)
  const [isAdding, setIsAdding] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemDueDate, setNewItemDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSaveTitle = async () => {
    const trimmed = titleValue.trim()
    if (!trimmed) {
      setTitleValue(checklist.title)
      setIsEditingTitle(false)
      return
    }
    await supabase
      .from('checklists')
      .update({ title: trimmed })
      .eq('id', checklist.id)
    setIsEditingTitle(false)
    onUpdate()
  }

  const handleDelete = async () => {
    if (!confirm(`"${checklist.title}" 체크리스트를 삭제하시겠습니까?`)) return
    await supabase.from('checklists').delete().eq('id', checklist.id)
    onDelete()
  }

  const handleAdd = async () => {
    if (!newItemTitle.trim()) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('checklist_items')
        .insert({
          checklist_id: checklist.id,
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

  const completedCount = items.filter((item) => item.completed).length
  const totalCount = items.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-navy">☑</span>
        {isEditingTitle ? (
          <input
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle()
              if (e.key === 'Escape') {
                setTitleValue(checklist.title)
                setIsEditingTitle(false)
              }
            }}
            autoFocus
            className="text-lg font-semibold text-navy border-b border-navy focus:outline-none bg-transparent flex-1"
          />
        ) : (
          <h3
            className="text-lg font-semibold text-navy cursor-pointer hover:underline flex-1"
            onClick={() => setIsEditingTitle(true)}
          >
            {checklist.title}
          </h3>
        )}
        <button
          onClick={handleDelete}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-red-50 hover:text-red-600 text-gray-600"
        >
          Delete
        </button>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500 w-8">{Math.round(progress)}%</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-navy h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-1 mb-2">
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
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 text-gray-600"
        >
          Add an item
        </button>
      )}
    </div>
  )
}
