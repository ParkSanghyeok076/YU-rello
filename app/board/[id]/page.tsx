import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BoardView } from '@/components/BoardView'
import { Database } from '@/lib/supabase/client'

type Board = Database['public']['Tables']['boards']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

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
    .single() as { data: Board | null; error: unknown }

  if (!board) {
    redirect('/dashboard')
  }

  // Fetch lists with cards (complex nested join — typed via any to avoid deep inference issues)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    .order('position', { ascending: true }) as { data: any[] | null; error: unknown }

  // Fetch all users for filter
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, email') as { data: Pick<Profile, 'id' | 'name' | 'email'>[] | null; error: unknown }

  return (
    <BoardView
      board={board}
      initialLists={lists || []}
      users={users || []}
      currentUserId={session.user.id}
    />
  )
}
