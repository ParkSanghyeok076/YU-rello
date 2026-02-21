'use client'

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
    <div
      ref={setSortableRef}
      style={style}
      className="flex-shrink-0 w-72 bg-white rounded-lg p-4 max-h-[calc(100vh-200px)] flex flex-col"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between mb-4 cursor-grab active:cursor-grabbing"
      >
        <h3 className="font-semibold text-navy">{list.title}</h3>
        <button className="text-gray-500 hover:text-gray-700">⋯</button>
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div ref={setDroppableRef} className="flex-1 overflow-y-auto space-y-2 mb-2">
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
    </div>
  )
}
