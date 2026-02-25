'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

type CopyCardModalProps = {
  sourceCardId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CopyCardModal({ sourceCardId, isOpen, onClose, onSuccess }: CopyCardModalProps) {
  const [title, setTitle] = useState('')
  const [keepChecklists, setKeepChecklists] = useState(true)
  const [lists, setLists] = useState<any[]>([])
  const [selectedListId, setSelectedListId] = useState('')
  const [selectedPosition, setSelectedPosition] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [sourceCard, setSourceCard] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && sourceCardId) {
      fetchData()
    }
  }, [isOpen, sourceCardId])

  const fetchData = async () => {
    setFetching(true)
    try {
      const { data: cardData } = await supabase
        .from('cards')
        .select(`
          *,
          lists (id, board_id, title),
          checklists (
            *,
            checklist_items (*)
          )
        `)
        .eq('id', sourceCardId)
        .single()

      if (!cardData) return

      setSourceCard(cardData)
      setTitle(cardData.title)

      const { data: listsData } = await supabase
        .from('lists')
        .select('id, title, cards(id)')
        .eq('board_id', (cardData as any).lists.board_id)
        .order('position', { ascending: true })

      if (listsData) {
        setLists(listsData)
        setSelectedListId((cardData as any).list_id)
        const sourceList = listsData.find((l: any) => l.id === (cardData as any).list_id)
        setSelectedPosition((sourceList?.cards?.length ?? 0) + 1)
      }
    } catch (err) {
      console.error('Error fetching card data:', err)
    } finally {
      setFetching(false)
    }
  }

  const handleListChange = (listId: string) => {
    setSelectedListId(listId)
    const list = lists.find((l: any) => l.id === listId)
    setSelectedPosition((list?.cards?.length ?? 0) + 1)
  }

  const getPositionCount = () => {
    const list = lists.find((l: any) => l.id === selectedListId)
    return (list?.cards?.length ?? 0) + 1
  }

  const handleSubmit = async () => {
    if (!title.trim() || !selectedListId || !sourceCard) return
    setLoading(true)
    try {
      const targetPosition = selectedPosition - 1

      const { data: existingCards } = await supabase
        .from('cards')
        .select('id, position')
        .eq('list_id', selectedListId)
        .gte('position', targetPosition)
        .order('position', { ascending: false })

      if (existingCards && existingCards.length > 0) {
        for (const card of existingCards) {
          await supabase
            .from('cards')
            .update({ position: card.position + 1 })
            .eq('id', card.id)
        }
      }

      const { data: newCard, error: cardError } = await supabase
        .from('cards')
        .insert({
          list_id: selectedListId,
          title: title.trim(),
          description: (sourceCard as any).description || null,
          position: targetPosition,
        })
        .select()
        .single()

      if (cardError || !newCard) throw cardError

      if (keepChecklists && (sourceCard as any).checklists?.length > 0) {
        const sortedChecklists = [...(sourceCard as any).checklists].sort(
          (a: any, b: any) => a.position - b.position
        )
        for (const cl of sortedChecklists) {
          const { data: newCl, error: clError } = await supabase
            .from('checklists')
            .insert({
              card_id: (newCard as any).id,
              title: cl.title,
              position: cl.position,
            })
            .select()
            .single()

          if (clError || !newCl) continue

          const sortedItems = [...(cl.checklist_items || [])].sort(
            (a: any, b: any) => a.position - b.position
          )
          for (const item of sortedItems) {
            await supabase.from('checklist_items').insert({
              checklist_id: (newCl as any).id,
              title: item.title,
              position: item.position,
              completed: false,
              due_date: item.due_date || null,
            })
          }
        }
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error copying card:', err)
      alert('카드 복사 실패')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const checklistCount = (sourceCard as any)?.checklists?.length ?? 0
  const positionCount = getPositionCount()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-800">카드 복사</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-light"
          >
            ×
          </button>
        </div>

        {fetching ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                이름
              </label>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {checklistCount > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  포함...
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepChecklists}
                    onChange={(e) => setKeepChecklists(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    체크리스트 ({checklistCount})
                  </span>
                </label>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                복사할 위치
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">리스트</label>
                  <select
                    value={selectedListId}
                    onChange={(e) => handleListChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {lists.map((list: any) => (
                      <option key={list.id} value={list.id}>
                        {list.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-24">
                  <label className="block text-xs text-gray-500 mb-1">위치</label>
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: positionCount }, (_, i) => i + 1).map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !title.trim()}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '복사 중...' : '카드 만들기'}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
