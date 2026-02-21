'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CardModal } from './CardModal'

type CardProps = {
  card: any
  onUpdate?: () => void
  currentUserId?: string
  currentUserName?: string
}

export function Card({ card, onUpdate, currentUserId = '', currentUserName = 'User' }: CardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const completedItems = card.checklist_items?.filter((item: any) => item.completed).length || 0
  const totalItems = card.checklist_items?.length || 0
  const hasComments = card.comments?.length > 0

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setIsModalOpen(true)}
        className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        {/* Labels */}
        {card.card_labels?.length > 0 && (
          <div className="flex gap-1 mb-2">
            {card.card_labels.map((cl: any) => (
              <div
                key={cl.label_id}
                className="h-2 w-10 rounded"
                style={{ backgroundColor: cl.labels?.color }}
              />
            ))}
          </div>
        )}

        {/* Title */}
        <p className="text-navy font-medium mb-2">{card.title}</p>

        {/* Metadata */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {totalItems > 0 && (
            <span className="flex items-center gap-1">
              ✓ {completedItems}/{totalItems}
            </span>
          )}
          {hasComments && (
            <span className="flex items-center gap-1">
              💬 {card.comments.length}
            </span>
          )}
          {card.due_date && (
            <span className="flex items-center gap-1">
              📅 {new Date(card.due_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {/* Members */}
        {card.card_members?.length > 0 && (
          <div className="flex gap-1 mt-2">
            {card.card_members.slice(0, 3).map((member: any) => (
              <div
                key={member.user_id}
                className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center"
                title={member.profiles?.name}
              >
                {member.profiles?.name?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>

      <CardModal
        cardId={card.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={onUpdate || (() => {})}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </>
  )
}
