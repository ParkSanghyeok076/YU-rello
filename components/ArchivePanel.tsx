'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type ArchivePanelProps = {
  boardId: string
  users: Array<{ id: string; name: string }>
  onUpdate: () => void
  onClose: () => void
}

type ArchivedList = {
  id: string
  title: string
  archived_at: string
  list_members: Array<{ user_id: string; profiles: any }>
}

type ArchivedCard = {
  id: string
  title: string
  archived_at: string
  list_id: string
  lists: { id: string; title: string; archived_at: string | null } | null
  card_members: Array<{ user_id: string; profiles: any }>
}

export function ArchivePanel({ boardId, users, onUpdate, onClose }: ArchivePanelProps) {
  const [tab, setTab] = useState<'lists' | 'cards'>('lists')
  const [archivedLists, setArchivedLists] = useState<ArchivedList[]>([])
  const [archivedCards, setArchivedCards] = useState<ArchivedCard[]>([])
  const [loading, setLoading] = useState(false)
  const [memberFilter, setMemberFilter] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchArchived()
  }, [])

  const fetchArchived = async () => {
    setLoading(true)
    try {
      // 아카이빙된 리스트
      const { data: lists } = await supabase
        .from('lists')
        .select('id, title, archived_at, list_members(user_id, profiles(*))')
        .eq('board_id', boardId)
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })

      if (lists) setArchivedLists(lists as ArchivedList[])

      // 아카이빙된 카드 (리스트가 활성 상태인 것만 — 리스트 아카이빙 시 중복 방지)
      const { data: cards } = await supabase
        .from('cards')
        .select('id, title, archived_at, list_id, lists(id, title, archived_at), card_members(user_id, profiles(*))')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false })

      if (cards) {
        // 클라이언트에서 해당 보드의 카드만 필터 + 리스트가 아카이빙되지 않은 것만
        const filtered = (cards as any[]).filter(
          (c) => c.lists?.archived_at === null && c.lists !== null
        )
        // board_id 필터: archivedLists의 board_id로는 필터 불가하므로, 활성 리스트 ID 목록 조회
        const { data: boardLists } = await supabase
          .from('lists')
          .select('id')
          .eq('board_id', boardId)
        const boardListIds = new Set((boardLists || []).map((l: any) => l.id))
        setArchivedCards(filtered.filter((c) => boardListIds.has(c.list_id)) as ArchivedCard[])
      }
    } catch (error) {
      console.error('Error fetching archived items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreList = async (listId: string) => {
    const { error } = await supabase
      .from('lists')
      .update({ archived_at: null })
      .eq('id', listId)
    if (!error) {
      fetchArchived()
      onUpdate()
    }
  }

  const handleRestoreCard = async (card: ArchivedCard) => {
    // 원래 리스트가 아카이빙 상태인지 확인
    if (card.lists?.archived_at) {
      alert('이 카드가 속한 리스트가 아카이빙 상태입니다. 먼저 리스트를 복구해 주세요.')
      return
    }

    // 해당 리스트의 현재 카드 수를 조회하여 맨 아래 position 결정
    const { data: existingCards } = await supabase
      .from('cards')
      .select('position')
      .eq('list_id', card.list_id)
      .is('archived_at', null)
      .order('position', { ascending: false })
      .limit(1)

    const newPosition = existingCards && existingCards.length > 0
      ? (existingCards[0] as any).position + 1
      : 0

    const { error } = await supabase
      .from('cards')
      .update({ archived_at: null, position: newPosition })
      .eq('id', card.id)

    if (!error) {
      fetchArchived()
      onUpdate()
    }
  }

  const handleDeleteList = async (listId: string, title: string) => {
    if (!confirm(`"${title}" 리스트를 영구 삭제하시겠습니까?\n내부의 모든 카드도 함께 삭제됩니다.`)) return
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return

    const { error } = await supabase.from('lists').delete().eq('id', listId)
    if (!error) {
      fetchArchived()
      onUpdate()
    }
  }

  const handleDeleteCard = async (cardId: string, title: string) => {
    if (!confirm(`"${title}" 카드를 영구 삭제하시겠습니까?`)) return
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return

    const { error } = await supabase.from('cards').delete().eq('id', cardId)
    if (!error) {
      fetchArchived()
      onUpdate()
    }
  }

  // 멤버 필터 적용
  const filteredLists = memberFilter
    ? archivedLists.filter((l) =>
        l.list_members?.some((m) => m.user_id === memberFilter)
      )
    : archivedLists

  const filteredCards = memberFilter
    ? archivedCards.filter((c) =>
        c.card_members?.some((m) => m.user_id === memberFilter)
      )
    : archivedCards

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 text-sm">아카이빙 목록</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* 멤버 필터 + 탭 전환 */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
        <select
          value={memberFilter || 'all'}
          onChange={(e) => setMemberFilter(e.target.value === 'all' ? null : e.target.value)}
          className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-300"
        >
          <option value="all">전체 멤버</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
          <button
            onClick={() => setTab('lists')}
            className={`px-3 py-1 transition-colors ${
              tab === 'lists'
                ? 'bg-gray-800 text-white font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            리스트
          </button>
          <button
            onClick={() => setTab('cards')}
            className={`px-3 py-1 transition-colors ${
              tab === 'cards'
                ? 'bg-gray-800 text-white font-medium'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            카드
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : tab === 'lists' ? (
          filteredLists.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">아카이빙된 리스트가 없습니다</div>
          ) : (
            <ul>
              {filteredLists.map((list) => (
                <li
                  key={list.id}
                  className="px-4 py-3 border-b last:border-0 border-gray-100 flex items-center justify-between gap-2"
                >
                  <span className="text-sm text-gray-800 font-medium truncate flex-1">{list.title}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleRestoreList(list.id)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                      </svg>
                      되돌리기
                    </button>
                    <button
                      onClick={() => handleDeleteList(list.id, list.title)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="영구 삭제"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : (
          filteredCards.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">아카이빙된 카드가 없습니다</div>
          ) : (
            <ul>
              {filteredCards.map((card) => (
                <li
                  key={card.id}
                  className="px-4 py-3 border-b last:border-0 border-gray-100 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-gray-800 font-medium truncate block">{card.title}</span>
                    <span className="text-xs text-gray-400 truncate block">
                      {card.lists?.title || '(삭제된 리스트)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleRestoreCard(card)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                      </svg>
                      되돌리기
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id, card.title)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="영구 삭제"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  )
}
