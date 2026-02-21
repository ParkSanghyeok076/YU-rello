'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChecklistSection } from './ChecklistSection'
import { LabelsSection } from './LabelsSection'
import { MembersSection } from './MembersSection'
import { CommentsSection } from './CommentsSection'

type CardModalProps = {
  cardId: string
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  currentUserId: string
  currentUserName: string
}

export function CardModal({ cardId, isOpen, onClose, onUpdate, currentUserId, currentUserName }: CardModalProps) {
  const [card, setCard] = useState<any>(null)
  const [description, setDescription] = useState('')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && cardId) {
      fetchCard()
    }
  }, [isOpen, cardId])

  const fetchCard = async () => {
    const { data } = await supabase
      .from('cards')
      .select(`
        *,
        lists (title, board_id),
        card_labels (
          label_id,
          labels (*)
        ),
        card_members (
          user_id,
          profiles (*)
        ),
        checklist_items (*),
        comments (
          *,
          profiles (*)
        )
      `)
      .eq('id', cardId)
      .single()

    if (data) {
      setCard(data)
      setDescription((data as any).description || '')
    }
  }

  const handleUpdateDescription = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('cards')
        .update({ description })
        .eq('id', cardId)

      if (error) throw error

      setIsEditingDescription(false)
      fetchCard()
      onUpdate()
    } catch (error) {
      console.error('Error updating description:', error)
      alert('설명 업데이트 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCard = async () => {
    if (!confirm('정말 이 카드를 삭제하시겠습니까?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId)

      if (error) throw error

      onClose()
      onUpdate()
    } catch (error) {
      console.error('Error deleting card:', error)
      alert('카드 삭제 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleSectionUpdate = () => {
    fetchCard()
    onUpdate()
  }

  if (!isOpen || !card) return null

  const boardId = (card as any).lists?.board_id || ''

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Labels preview */}
              {(card as any).card_labels?.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {(card as any).card_labels.map((cl: any) => (
                    <span
                      key={cl.label_id}
                      className="px-3 py-1 rounded text-white text-sm"
                      style={{ backgroundColor: cl.labels?.color }}
                    >
                      {cl.labels?.name}
                    </span>
                  ))}
                </div>
              )}

              <h2 className="text-2xl font-bold text-navy">{(card as any).title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                in list <span className="font-medium">{(card as any).lists?.title}</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-light ml-4"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-navy mb-2">📝 설명</h3>
            {isEditingDescription ? (
              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-navy resize-none focus:outline-none focus:ring-2 focus:ring-navy"
                  rows={5}
                  placeholder="이 카드에 대한 설명을 추가하세요..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleUpdateDescription}
                    disabled={loading}
                    className="px-4 py-2 bg-navy text-white rounded hover:bg-navy-light disabled:opacity-50"
                  >
                    {loading ? '저장 중...' : '저장'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingDescription(false)
                      setDescription((card as any).description || '')
                    }}
                    className="px-4 py-2 bg-gray-200 text-navy rounded hover:bg-gray-300"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingDescription(true)}
                className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors min-h-[100px]"
              >
                {(card as any).description ? (
                  <p className="text-navy whitespace-pre-wrap">{(card as any).description}</p>
                ) : (
                  <p className="text-gray-400">설명을 추가하려면 클릭하세요...</p>
                )}
              </div>
            )}
          </div>

          {/* Checklist */}
          <ChecklistSection
            cardId={cardId}
            items={(card as any).checklist_items || []}
            onUpdate={handleSectionUpdate}
          />

          {/* Labels */}
          <LabelsSection
            boardId={boardId}
            cardId={cardId}
            labels={(card as any).card_labels || []}
            onUpdate={handleSectionUpdate}
          />

          {/* Members */}
          <MembersSection
            cardId={cardId}
            cardTitle={(card as any).title}
            members={(card as any).card_members || []}
            onUpdate={handleSectionUpdate}
          />

          {/* Comments */}
          <CommentsSection
            cardId={cardId}
            cardTitle={(card as any).title}
            comments={(card as any).comments || []}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onUpdate={handleSectionUpdate}
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={handleDeleteCard}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            🗑️ 카드 삭제
          </button>
        </div>
      </div>
    </div>
  )
}
