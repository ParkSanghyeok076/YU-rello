import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function useRealtimeSubscription(boardId: string) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const listsChannel = supabase
      .channel(`board-${boardId}-lists`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists', filter: `board_id=eq.${boardId}` },
        () => router.refresh()
      ).subscribe()

    const cardsChannel = supabase
      .channel(`board-${boardId}-cards`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' },
        () => router.refresh()
      ).subscribe()

    const checklistChannel = supabase
      .channel(`board-${boardId}-checklist`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_items' },
        () => router.refresh()
      ).subscribe()

    const commentsChannel = supabase
      .channel(`board-${boardId}-comments`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' },
        () => router.refresh()
      ).subscribe()

    const labelsChannel = supabase
      .channel(`board-${boardId}-labels`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'labels', filter: `board_id=eq.${boardId}` },
        () => router.refresh()
      ).subscribe()

    const cardLabelsChannel = supabase
      .channel(`board-${boardId}-card-labels`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'card_labels' },
        () => router.refresh()
      ).subscribe()

    const cardMembersChannel = supabase
      .channel(`board-${boardId}-card-members`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'card_members' },
        () => router.refresh()
      ).subscribe()

    return () => {
      supabase.removeChannel(listsChannel)
      supabase.removeChannel(cardsChannel)
      supabase.removeChannel(checklistChannel)
      supabase.removeChannel(commentsChannel)
      supabase.removeChannel(labelsChannel)
      supabase.removeChannel(cardLabelsChannel)
      supabase.removeChannel(cardMembersChannel)
    }
  }, [boardId, router])
}
