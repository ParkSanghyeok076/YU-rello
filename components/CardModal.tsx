'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
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
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [cardTitle, setCardTitle] = useState('')
  const cancelledRef = useRef(false)
  const supabase = createClient()

  // Issue 2 fix: reset isEditingTitle when modal opens for a new card
  useEffect(() => {
    if (isOpen && cardId) {
      setIsEditingTitle(false)
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
        checklists (
          *,
          checklist_items (*)
        ),
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
      setStartDate((data as any).start_date ? (data as any).start_date.split('T')[0] : '')
      setDueDate((data as any).due_date ? (data as any).due_date.split('T')[0] : '')
      setCardTitle((data as any).title || '')
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

  const handleUpdateStartDate = async (value: string) => {
    setStartDate(value)
    await supabase
      .from('cards')
      .update({ start_date: value || null })
      .eq('id', cardId)
    onUpdate()
  }

  const handleUpdateDueDate = async (value: string) => {
    setDueDate(value)
    await supabase
      .from('cards')
      .update({ due_date: value || null })
      .eq('id', cardId)
    onUpdate()
  }

  // Issues 3 & 4 fix: loading guard + error handling
  const handleUpdateTitle = async () => {
    const trimmed = cardTitle.trim()
    if (!trimmed || trimmed === (card as any).title) {
      setCardTitle((card as any).title)
      setIsEditingTitle(false)
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase
        .from('cards')
        .update({ title: trimmed })
        .eq('id', cardId)
      if (error) {
        console.error('Error updating title:', error)
        alert('제목 업데이트 실패')
        return
      }
      setIsEditingTitle(false)
      fetchCard()
      onUpdate()
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-8 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full my-8"
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

              {isEditingTitle ? (
                <input
                  type="text"
                  value={cardTitle}
                  onChange={(e) => setCardTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      cancelledRef.current = true
                      handleUpdateTitle()
                    }
                    if (e.key === 'Escape') {
                      cancelledRef.current = true
                      setCardTitle((card as any).title)
                      setIsEditingTitle(false)
                    }
                  }}
                  onBlur={() => {
                    if (cancelledRef.current) { cancelledRef.current = false; return }
                    handleUpdateTitle()
                  }}
                  disabled={loading}
                  autoFocus
                  className="text-2xl font-bold text-navy w-full border-b-2 border-navy focus:outline-none bg-transparent"
                />
              ) : (
                <h2
                  className="text-2xl font-bold text-navy cursor-pointer hover:bg-gray-100 rounded px-1 -mx-1 transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                  title="클릭하여 제목 변경"
                >
                  {(card as any).title}
                </h2>
              )}
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

          {/* Dates */}
          <div>
            <h3 className="text-lg font-semibold text-navy mb-3">📅 날짜</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-14 shrink-0">시작일</label>
                <input
                  type="date"
                  value={startDate}
                  max={dueDate || undefined}
                  onChange={(e) => handleUpdateStartDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-navy text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
                {startDate && (
                  <button
                    onClick={() => handleUpdateStartDate('')}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                    title="시작일 삭제"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 w-14 shrink-0">종료일</label>
                <input
                  type="date"
                  value={dueDate}
                  min={startDate || undefined}
                  onChange={(e) => handleUpdateDueDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-navy text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
                {dueDate && (
                  <button
                    onClick={() => handleUpdateDueDate('')}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                    title="종료일 삭제"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Checklists */}
          {((card as any).checklists || [])
            .sort((a: any, b: any) => a.position - b.position)
            .map((cl: any) => (
            <ChecklistSection
              key={cl.id}
              checklist={{ id: cl.id, title: cl.title }}
              items={cl.checklist_items || []}
              onUpdate={handleSectionUpdate}
              onDelete={handleSectionUpdate}
            />
          ))}

          {/* 체크리스트 추가 */}
          <div>
            <button
              onClick={async () => {
                const position = (card as any).checklists?.length ?? 0
                await supabase.from('checklists').insert({
                  card_id: cardId,
                  title: '체크리스트',
                  position,
                })
                handleSectionUpdate()
              }}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 text-gray-600"
            >
              + 체크리스트 추가
            </button>
          </div>

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
      </motion.div>
    </motion.div>
  )
}
