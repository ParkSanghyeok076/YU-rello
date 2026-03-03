'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type ChecklistItemProps = {
  item: any
  onUpdate: () => void
}

export function ChecklistItem({ item, onUpdate }: ChecklistItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [dueDate, setDueDate] = useState(item.due_date || '')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const handleToggle = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('checklist_items')
        .update({ completed: !item.completed })
        .eq('id', item.id)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error toggling item:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('checklist_items')
        .update({
          title: title.trim(),
          due_date: dueDate || null,
        })
        .eq('id', item.id)

      if (error) throw error
      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating item:', error)
      alert('항목 업데이트 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('checklist_items')
        .delete()
        .eq('id', item.id)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('항목 삭제 실패')
    } finally {
      setLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={sortableStyle} className="flex flex-col gap-2 p-2 bg-gray-50 rounded">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-navy focus:outline-none focus:ring-2 focus:ring-navy"
        />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dueDate ? new Date(dueDate).toISOString().split('T')[0] : ''}
            onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
            className="px-2 py-1 border border-gray-300 rounded text-navy text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
          <button
            onClick={handleUpdate}
            disabled={loading || !title.trim()}
            className="px-3 py-1 bg-navy text-white text-sm rounded hover:bg-navy-light disabled:opacity-50"
          >
            저장
          </button>
          <button
            onClick={() => {
              setIsEditing(false)
              setTitle(item.title)
              setDueDate(item.due_date || '')
            }}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            취소
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={sortableStyle} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded group">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-100 transition-opacity select-none px-0.5 text-sm"
        title="드래그하여 순서 변경"
      >
        ⠿
      </div>
      <input
        type="checkbox"
        checked={item.completed}
        onChange={handleToggle}
        disabled={loading}
        className="w-4 h-4 text-navy border-gray-300 rounded focus:ring-navy cursor-pointer"
      />
      <div onClick={() => setIsEditing(true)} className="flex-1 cursor-pointer">
        <span className={`text-navy ${item.completed ? 'line-through text-gray-400' : ''}`}>
          {item.title}
        </span>
        {item.due_date && (
          <span className="ml-2 text-sm text-gray-500">
            📅 {new Date(item.due_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-sm"
      >
        🗑️
      </button>
    </div>
  )
}
