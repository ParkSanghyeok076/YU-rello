'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CardModal } from './CardModal'

type CardProps = {
  card: any
  onUpdate?: () => void
  currentUserId?: string
  currentUserName?: string
}

function fmtDate(iso: string): string {
  // iso can be YYYY-MM-DD (start_date) or YYYY-MM-DDTHH:MM:SS (due_date)
  const d = new Date(iso.split('T')[0] + 'T00:00:00')
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function formatCardDates(start_date: string | null, due_date: string | null): string | null {
  if (start_date && due_date) return `${fmtDate(start_date)} ~ ${fmtDate(due_date)}`
  if (start_date) return fmtDate(start_date)
  if (due_date) return fmtDate(due_date)
  return null
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
  }

  const completedItems = card.checklist_items?.filter((item: any) => item.completed).length || 0
  const totalItems = card.checklist_items?.length || 0
  const hasComments = card.comments?.length > 0

  return (
    <>
      <motion.div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
        transition={{ duration: 0.15 }}
        whileHover={{ y: -2, transition: { duration: 0.1 } }}
        onClick={() => setIsModalOpen(true)}
        className="relative group bg-white border border-gray-200 rounded-lg p-3 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
      >
        {/* Hover edit button */}
        <button
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs z-10"
          onClick={(e) => { e.stopPropagation(); setIsModalOpen(true) }}
          title="편집"
        >
          ✎
        </button>

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
        <p className="text-gray-800 font-medium mb-2 pr-6">{card.title}</p>

        {/* Metadata */}
        <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          {totalItems > 0 && (
            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
              completedItems === totalItems
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              ✓ {completedItems}/{totalItems}
            </span>
          )}
          {hasComments && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              💬 {card.comments.length}
            </span>
          )}
          {formatCardDates(card.start_date, card.due_date) && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              📅 {formatCardDates(card.start_date, card.due_date)}
            </span>
          )}
        </div>

        {/* Members */}
        {card.card_members?.length > 0 && (
          <div className="flex gap-1 mt-2">
            {card.card_members.slice(0, 3).map((member: any) => (
              <div
                key={member.user_id}
                className="w-6 h-6 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center font-medium"
                title={member.profiles?.name}
              >
                {member.profiles?.name?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </motion.div>

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
