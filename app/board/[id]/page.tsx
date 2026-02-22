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

  // 현재 유저의 admin 여부 조회 (멤버십 체크 전에 필요)
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single() as { data: { is_admin: boolean } | null; error: unknown }

  const isAdmin = currentProfile?.is_admin ?? false

  // 명시적 멤버십 확인 (RLS 보완용 방어 코드) — admin은 멤버십 없이도 접근 가능
  const { data: membership } = await supabase
    .from('board_members')
    .select('user_id')
    .eq('board_id', id)
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (!membership && !isAdmin) {
    redirect('/dashboard')
  }

  // Fetch lists with cards (complex nested join — typed via any to avoid deep inference issues)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lists } = await supabase
    .from('lists')
    .select(`
      *,
      list_members (user_id, profiles (*)),
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
        checklists (*, checklist_items (*)),
        comments (*)
      )
    `)
    .eq('board_id', id)
    .order('position', { ascending: true }) as { data: any[] | null; error: unknown }

  // Fetch all users for filter
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, email') as { data: Pick<Profile, 'id' | 'name' | 'email'>[] | null; error: unknown }

  // board_members fetch (멤버 목록 + 프로필)
  const { data: boardMembers } = await supabase
    .from('board_members')
    .select('user_id, profiles(*)')
    .eq('board_id', id) as { data: any[] | null; error: unknown }

  // 현재 유저가 보드 owner인지 확인
  const isOwner = board.created_by === session.user.id

  return (
    <BoardView
      board={board}
      initialLists={lists || []}
      users={users || []}
      currentUserId={session.user.id}
      boardMembers={boardMembers || []}
      isOwner={isOwner}
      isAdmin={isAdmin}
    />
  )
}
