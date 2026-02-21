'use client'

import { Card } from './Card'
import { CreateCardButton } from './CreateCardButton'

type ListProps = {
  list: any
  onUpdate: () => void
}

export function List({ list, onUpdate }: ListProps) {
  return (
    <div className="flex-shrink-0 w-72 bg-white rounded-lg p-4 max-h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-navy">{list.title}</h3>
        <button className="text-gray-500 hover:text-gray-700">⋯</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-2">
        {list.cards
          .sort((a: any, b: any) => a.position - b.position)
          .map((card: any) => (
            <Card key={card.id} card={card} />
          ))}
      </div>

      <CreateCardButton
        listId={list.id}
        currentPosition={list.cards.length}
        onCardCreated={onUpdate}
      />
    </div>
  )
}
