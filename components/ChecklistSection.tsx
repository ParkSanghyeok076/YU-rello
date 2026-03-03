'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChecklistItem } from './ChecklistItem'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'

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
  const isSavingTitle = useRef(false)

  const [localItems, setLocalItems] = useState(() =>
    [...items].sort((a, b) => a.position - b.position)
  )
  const [draggingItem, setDraggingItem] = useState<any>(null)
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    setLocalItems([...items].sort((a, b) => a.position - b.position))
  }, [items])

  const handleSaveTitle = async () => {
    if (isSavingTitle.current) return
    isSavingTitle.current = true
    const trimmed = titleValue.trim()
    if (!trimmed) {
      setTitleValue(checklist.title)
      setIsEditingTitle(false)
      isSavingTitle.current = false
      return
    }
    try {
      const { error } = await supabase
        .from('checklists')
        .update({ title: trimmed })
        .eq('id', checklist.id)
      if (error) throw error
      setIsEditingTitle(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating checklist title:', error)
      setTitleValue(checklist.title)
      setIsEditingTitle(false)
      alert('제목 변경 실패')
    } finally {
      isSavingTitle.current = false
    }
  }

  const handleDelete = async () => {
    if (!confirm(`"${checklist.title}" 체크리스트를 삭제하시겠습니까?`)) return
    try {
      const { error } = await supabase.from('checklists').delete().eq('id', checklist.id)
      if (error) throw error
      onDelete()
    } catch (error) {
      console.error('Error deleting checklist:', error)
      alert('체크리스트 삭제 실패')
    }
  }

  const handleItemDragEnd = async (event: any) => {
    const { active, over } = event
    setDraggingItem(null)
    if (!over || active.id === over.id) return

    const oldIndex = localItems.findIndex((item: any) => item.id === active.id)
    const newIndex = localItems.findIndex((item: any) => item.id === over.id)
    if (oldIndex === newIndex) return

    const newItems = arrayMove(localItems, oldIndex, newIndex)
    const previousItems = [...localItems]

    setLocalItems(newItems)

    try {
      await Promise.all(
        newItems.map((item: any, index: number) =>
          supabase.from('checklist_items').update({ position: index }).eq('id', item.id)
        )
      )
      onUpdate()
    } catch (error) {
      console.error('Error reordering checklist items:', error)
      setLocalItems(previousItems)
      alert('순서 변경 실패')
    }
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
          position: localItems.length,
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
      <DndContext
        sensors={dndSensors}
        onDragStart={(event) =>
          setDraggingItem(localItems.find((i: any) => i.id === event.active.id) ?? null)
        }
        onDragEnd={handleItemDragEnd}
        onDragCancel={() => setDraggingItem(null)}
      >
        <SortableContext
          items={localItems.map((i: any) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1 mb-2">
            {localItems.map((item: any) => (
              <ChecklistItem key={item.id} item={item} onUpdate={onUpdate} />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {draggingItem ? (
            <div className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded shadow-lg opacity-90">
              <span className="text-gray-400 select-none text-sm">⠿</span>
              <span className={`text-navy ${draggingItem.completed ? 'line-through text-gray-400' : ''}`}>
                {draggingItem.title}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
