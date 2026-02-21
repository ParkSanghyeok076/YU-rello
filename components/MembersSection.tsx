'use client'

import { useState } from 'react'
import { MemberPicker } from './MemberPicker'

type MembersSectionProps = {
  cardId: string
  cardTitle: string
  members: any[]
  onUpdate: () => void
}

export function MembersSection({ cardId, cardTitle, members, onUpdate }: MembersSectionProps) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div>
      <h3 className="text-lg font-semibold text-navy mb-2">👥 멤버</h3>

      <div className="flex flex-wrap gap-2 mb-2">
        {members.map((member) => (
          <div
            key={member.user_id}
            className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded"
          >
            <div className="w-6 h-6 rounded-full bg-navy text-white text-xs flex items-center justify-center">
              {member.profiles?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm text-navy">{member.profiles?.name}</span>
          </div>
        ))}
      </div>

      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="px-3 py-1 bg-gray-100 text-navy text-sm rounded hover:bg-gray-200"
        >
          {members.length > 0 ? '멤버 편집' : '+ 멤버 추가'}
        </button>

        {showPicker && (
          <MemberPicker
            cardId={cardId}
            cardTitle={cardTitle}
            currentMembers={members}
            onUpdate={onUpdate}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    </div>
  )
}
