'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type SourceChecklist = {
  id: string
  title: string
  cardTitle: string
  items: { id: string; title: string; position: number; due_date: string | null }[]
}

type AddChecklistPopoverProps = {
  cardId: string
  boardId: string
  position: number
  onClose: () => void
  onAdded: () => void
}

export function AddChecklistPopover({
  cardId,
  boardId,
  position,
  onClose,
  onAdded,
}: AddChecklistPopoverProps) {
  const [title, setTitle] = useState('체크리스트')
  const [sourceLists, setSourceLists] = useState<SourceChecklist[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const popoverRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchChecklists = async () => {
      setFetching(true)
      try {
        const { data } = await supabase
          .from('checklists')
          .select(`
            id,
            title,
            checklist_items (id, title, position, due_date),
            cards (id, title, list_id, lists (board_id))
          `)
          .order('position', { ascending: true })

        if (data) {
          const filtered = (data as any[])
            .filter((cl) => (cl.cards as any)?.lists?.board_id === boardId)
            .map((cl) => ({
              id: cl.id,
              title: cl.title,
              cardTitle: (cl.cards as any)?.title ?? '알 수 없음',
              items: ((cl.checklist_items ?? []) as any[]).sort(
                (a: any, b: any) => a.position - b.position
              ),
            }))
          setSourceLists(filtered)
        }
      } catch (err) {
        console.error('Error fetching checklists:', err)
      } finally {
        setFetching(false)
      }
    }

    fetchChecklists()
  }, [boardId])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleSubmit = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      const { data: newCl, error } = await supabase
        .from('checklists')
        .insert({ card_id: cardId, title: title.trim(), position })
        .select()
        .single()

      if (error || !newCl) throw error

      if (selectedSourceId) {
        const source = sourceLists.find((cl) => cl.id === selectedSourceId)
        if (source && source.items.length > 0) {
          for (const item of source.items) {
            await supabase.from('checklist_items').insert({
              checklist_id: (newCl as any).id,
              title: item.title,
              position: item.position,
              completed: false,
              due_date: item.due_date ?? null,
            })
          }
        }
      }

      onAdded()
      onClose()
    } catch (err) {
      console.error('Error adding checklist:', err)
      alert('체크리스트 추가 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">체크리스트 추가</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
          제목
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          autoFocus
          className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
          Copy items from...
        </label>
        {fetching ? (
          <div className="text-xs text-gray-400 py-2">불러오는 중...</div>
        ) : (
          <select
            value={selectedSourceId}
            onChange={(e) => setSelectedSourceId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">(없음)</option>
            {sourceLists.map((cl) => (
              <option key={cl.id} value={cl.id}>
                {cl.cardTitle} / {cl.title}
              </option>
            ))}
          </select>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !title.trim()}
        className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '추가 중...' : '추가'}
      </button>
    </div>
  )
}
