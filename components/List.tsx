'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDroppable } from '@dnd-kit/core'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import { Card } from './Card'
import { CreateCardButton } from './CreateCardButton'
import { ListMemberPicker } from './ListMemberPicker'

type ListProps = {
  list: any
  onUpdate: () => void
  currentUserId?: string
  currentUserName?: string
}

export function List({ list, onUpdate, currentUserId, currentUserName }: ListProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [listTitle, setListTitle] = useState(list.title)
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

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

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsMemberPickerOpen(false)
      }
    }
    if (isMemberPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMemberPickerOpen])

  const handleRename = async () => {
    const trimmed = listTitle.trim()
    if (!trimmed || trimmed === list.title) {
      setListTitle(list.title)
      setIsRenaming(false)
      return
    }
    const { error } = await supabase
      .from('lists')
      .update({ title: trimmed })
      .eq('id', list.id)
    if (!error) {
      setIsRenaming(false)
      onUpdate()
    }
  }

  const handleDelete = async () => {
    if (!confirm(`"${list.title}" 리스트와 모든 카드를 삭제하시겠습니까?`)) return
    const { error } = await supabase.from('lists').delete().eq('id', list.id)
    if (!error) onUpdate()
  }

  return (
    <motion.div
      ref={setSortableRef}
      style={style}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex-shrink-0 w-72 bg-dark-list rounded-xl p-3 max-h-[calc(100vh-160px)] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        {/* Title or rename input — drag handle only when not renaming */}
        <div
          {...(isRenaming ? {} : { ...attributes, ...listeners })}
          className={`flex-1 ${isRenaming ? '' : 'cursor-grab active:cursor-grabbing'}`}
        >
          {isRenaming ? (
            <input
              type="text"
              value={listTitle}
              onChange={(e) => setListTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') { setListTitle(list.title); setIsRenaming(false) }
              }}
              onBlur={handleRename}
              autoFocus
              className="w-full bg-transparent border-b border-blue-400 text-white font-semibold focus:outline-none"
            />
          ) : (
            <h3 className="font-semibold text-white">{listTitle}</h3>
          )}
        </div>

        {/* 멤버 아바타 + 피커 */}
        <div ref={pickerRef} className="relative flex items-center gap-1 mx-2">
          {(list.list_members || []).slice(0, 3).map((m: any) => (
            <div
              key={m.user_id}
              title={m.profiles?.name}
              className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center -ml-1 first:ml-0 border border-[#161b22]"
            >
              {m.profiles?.name?.[0]?.toUpperCase()}
            </div>
          ))}
          {(list.list_members || []).length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-500 text-white text-xs flex items-center justify-center -ml-1 border border-[#161b22]">
              +{list.list_members.length - 3}
            </div>
          )}
          <button
            onClick={() => { setIsMenuOpen(false); setIsMemberPickerOpen(prev => !prev) }}
            className="w-5 h-5 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center hover:bg-gray-500 transition-colors ml-1"
            title="멤버 관리"
          >
            +
          </button>

          {isMemberPickerOpen && (
            <ListMemberPicker
              listId={list.id}
              currentMembers={list.list_members || []}
              onUpdate={() => { setIsMemberPickerOpen(false); onUpdate() }}
              onClose={() => setIsMemberPickerOpen(false)}
            />
          )}
        </div>

        {/* ⋯ dropdown menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setIsMemberPickerOpen(false); setIsMenuOpen((prev) => !prev) }}
            className="text-gray-400 hover:text-gray-200 transition-colors px-1 ml-2"
          >
            ⋯
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-[#2d333b] border border-gray-600 rounded-lg shadow-xl z-20 overflow-hidden">
              <button
                onClick={() => { setIsRenaming(true); setIsMenuOpen(false) }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#3d444e] transition-colors"
              >
                ✏️ 이름 변경
              </button>
              <button
                onClick={() => { setIsMenuOpen(false); handleDelete() }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#3d444e] transition-colors"
              >
                🗑️ 리스트 삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
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
