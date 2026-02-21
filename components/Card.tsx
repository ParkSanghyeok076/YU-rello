'use client'

type CardProps = {
  card: any
}

export function Card({ card }: CardProps) {
  const completedItems = card.checklist_items?.filter((item: any) => item.completed).length || 0
  const totalItems = card.checklist_items?.length || 0
  const hasComments = card.comments?.length > 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors">
      {/* Labels */}
      {card.card_labels?.length > 0 && (
        <div className="flex gap-1 mb-2">
          {card.card_labels.map((cl: any) => (
            <div
              key={cl.label_id}
              className="h-2 w-10 rounded"
              style={{ backgroundColor: cl.labels.color }}
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
  )
}
