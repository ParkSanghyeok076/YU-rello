import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BoardView } from '@/components/BoardView'

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // Fetch board
  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .single()

  if (!board) {
    redirect('/dashboard')
  }

  // Fetch lists with cards
  const { data: lists } = await supabase
    .from('lists')
    .select(`
      *,
      cards (
        *,
        card_labels (
          label_id,
          labels (*)
        ),
        card_members (
          user_id,
          profiles (*)
        ),
        checklist_items (*),
        comments (*)
      )
    `)
    .eq('board_id', id)
    .order('position', { ascending: true })

  // Fetch all users for filter
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, email')

  return (
    <BoardView
      board={board}
      initialLists={lists || []}
      users={users || []}
      currentUserId={session.user.id}
    />
  )
}
