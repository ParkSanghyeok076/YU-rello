'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type LabelPickerProps = {
  boardId: string
  cardId: string
  currentLabels: any[]
  onUpdate: () => void
  onClose: () => void
}

const PRESET_COLORS = [
  { name: '빨강', color: '#ef4444' },
  { name: '주황', color: '#f97316' },
  { name: '노랑', color: '#eab308' },
  { name: '초록', color: '#22c55e' },
  { name: '파랑', color: '#3b82f6' },
  { name: '남색', color: '#6366f1' },
  { name: '보라', color: '#a855f7' },
  { name: '분홍', color: '#ec4899' },
]

export function LabelPicker({ boardId, cardId, currentLabels, onUpdate, onClose }: LabelPickerProps) {
  const [boardLabels, setBoardLabels] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(PRESET_COLORS[0].color)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchBoardLabels()
  }, [])

  const fetchBoardLabels = async () => {
    const { data } = await supabase
      .from('labels')
      .select('*')
      .eq('board_id', boardId)

    setBoardLabels(data || [])
  }

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('labels')
        .insert({
          board_id: boardId,
          name: newLabelName.trim(),
          color: newLabelColor,
        })
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('card_labels')
        .insert({
          card_id: cardId,
          label_id: (data as any).id,
        })

      setNewLabelName('')
      setIsCreating(false)
      fetchBoardLabels()
      onUpdate()
    } catch (error) {
      console.error('Error creating label:', error)
      alert('라벨 생성 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleLabel = async (labelId: string) => {
    const isAttached = currentLabels.some(cl => cl.label_id === labelId)

    setLoading(true)
    try {
      if (isAttached) {
        const { error } = await supabase
          .from('card_labels')
          .delete()
          .eq('card_id', cardId)
          .eq('label_id', labelId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('card_labels')
          .insert({ card_id: cardId, label_id: labelId })

        if (error) throw error
      }

      onUpdate()
    } catch (error) {
      console.error('Error toggling label:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-72 z-10">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-navy">라벨</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
      </div>

      {/* Existing labels */}
      <div className="space-y-2 mb-3">
        {boardLabels.map((label) => {
          const isAttached = currentLabels.some(cl => cl.label_id === label.id)
          return (
            <button
              key={label.id}
              onClick={() => handleToggleLabel(label.id)}
              disabled={loading}
              className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <div className="w-8 h-4 rounded" style={{ backgroundColor: label.color }} />
              <span className="flex-1 text-left text-navy">{label.name}</span>
              {isAttached && <span className="text-navy font-bold">✓</span>}
            </button>
          )
        })}
        {boardLabels.length === 0 && (
          <p className="text-sm text-gray-400 px-3">아직 라벨이 없습니다.</p>
        )}
      </div>

      {/* Create new label */}
      {isCreating ? (
        <div className="border-t pt-3">
          <input
            type="text"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            placeholder="라벨 이름..."
            autoFocus
            className="w-full px-2 py-1 border border-gray-300 rounded text-navy mb-2 focus:outline-none focus:ring-2 focus:ring-navy"
          />
          <div className="grid grid-cols-4 gap-2 mb-2">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.color}
                onClick={() => setNewLabelColor(preset.color)}
                className={`w-full h-8 rounded ${newLabelColor === preset.color ? 'ring-2 ring-navy ring-offset-1' : ''}`}
                style={{ backgroundColor: preset.color }}
                title={preset.name}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateLabel}
              disabled={loading || !newLabelName.trim()}
              className="flex-1 px-3 py-1 bg-navy text-white text-sm rounded hover:bg-navy-light disabled:opacity-50"
            >
              생성
            </button>
            <button
              onClick={() => { setIsCreating(false); setNewLabelName('') }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full px-3 py-2 bg-gray-100 text-navy text-sm rounded hover:bg-gray-200"
        >
          + 새 라벨 만들기
        </button>
      )}
    </div>
  )
}
