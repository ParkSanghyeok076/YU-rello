'use client'

import { useState } from 'react'
import { LabelPicker } from './LabelPicker'

type LabelsSectionProps = {
  boardId: string
  cardId: string
  labels: any[]
  onUpdate: () => void
}

export function LabelsSection({ boardId, cardId, labels, onUpdate }: LabelsSectionProps) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div>
      <h3 className="text-lg font-semibold text-navy mb-2">🏷️ 라벨</h3>

      <div className="flex flex-wrap gap-2 mb-2">
        {labels.map((cl) => (
          <span
            key={cl.label_id}
            className="px-3 py-1 rounded text-white text-sm font-medium"
            style={{ backgroundColor: cl.labels?.color || '#888' }}
          >
            {cl.labels?.name}
          </span>
        ))}
      </div>

      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="px-3 py-1 bg-gray-100 text-navy text-sm rounded hover:bg-gray-200"
        >
          {labels.length > 0 ? '라벨 편집' : '+ 라벨 추가'}
        </button>

        {showPicker && (
          <LabelPicker
            boardId={boardId}
            cardId={cardId}
            currentLabels={labels}
            onUpdate={onUpdate}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    </div>
  )
}
