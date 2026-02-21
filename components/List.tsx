'use client'

import { motion } from 'framer-motion'
import { useDroppable } from '@dnd-kit/core'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from './Card'
import { CreateCardButton } from './CreateCardButton'

type ListProps = {
  list: any
  onUpdate: () => void
  currentUserId?: string
  currentUserName?: string
}

export function List({ list, onUpdate, currentUserId, currentUserName }: ListProps) {
  const { setNodeRef: setDroppableRef } = useDroppable({ id: list.id })

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `list-${list.id}` })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const cardIds = list.cards
    .sort((a: any, b: any) => a.position - b.position)
    .map((card: any) => card.id)

  return (
    <motion.div
      ref={setSortableRef}
      style={style}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex-shrink-0 w-72 bg-dark-list rounded-xl p-3 max-h-[calc(100vh-160px)] flex flex-col"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing px-1"
      >
        <h3 className="font-semibold text-white">{list.title}</h3>
        <button className="text-gray-400 hover:text-gray-200 transition-colors">⋯</button>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div ref={setDroppableRef} className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1">
          {list.cards
            .sort((a: any, b: any) => a.position - b.position)
            .map((card: any) => (
              <Card
                key={card.id}
                card={card}
                onUpdate={onUpdate}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
              />
            ))}
        </div>
      </SortableContext>

      <CreateCardButton
        listId={list.id}
        currentPosition={list.cards.length}
        onCardCreated={onUpdate}
      />
    </motion.div>
  )
}
