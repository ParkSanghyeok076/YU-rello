import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeSubscription(boardId: string, onRefresh: () => void) {
  const supabase = createClient()
  const onRefreshRef = useRef(onRefresh)

  useEffect(() => {
    onRefreshRef.current = onRefresh
  })

  useEffect(() => {
    const refresh = () => onRefreshRef.current()

    const listsChannel = supabase
      .channel(`board-${boardId}-lists`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists', filter: `board_id=eq.${boardId}` }, refresh)
      .subscribe()

    const cardsChannel = supabase
      .channel(`board-${boardId}-cards`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, refresh)
      .subscribe()

    const checklistChannel = supabase
      .channel(`board-${boardId}-checklist`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_items' }, refresh)
      .subscribe()

    const commentsChannel = supabase
      .channel(`board-${boardId}-comments`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, refresh)
      .subscribe()

    const labelsChannel = supabase
      .channel(`board-${boardId}-labels`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'labels', filter: `board_id=eq.${boardId}` }, refresh)
      .subscribe()

    const cardLabelsChannel = supabase
      .channel(`board-${boardId}-card-labels`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'card_labels' }, refresh)
      .subscribe()

    const cardMembersChannel = supabase
      .channel(`board-${boardId}-card-members`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'card_members' }, refresh)
      .subscribe()

    const listMembersChannel = supabase
      .channel(`board-${boardId}-list-members`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'list_members' }, refresh)
      .subscribe()

    const boardMembersChannel = supabase
      .channel(`board-${boardId}-board-members`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_members', filter: `board_id=eq.${boardId}` }, refresh)
      .subscribe()

    return () => {
      supabase.removeChannel(listsChannel)
      supabase.removeChannel(cardsChannel)
      supabase.removeChannel(checklistChannel)
      supabase.removeChannel(commentsChannel)
      supabase.removeChannel(labelsChannel)
      supabase.removeChannel(cardLabelsChannel)
      supabase.removeChannel(cardMembersChannel)
      supabase.removeChannel(listMembersChannel)
      supabase.removeChannel(boardMembersChannel)
    }
  }, [boardId])
}
