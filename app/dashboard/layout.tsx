import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/Header'
import { Database } from '@/lib/supabase/client'

type Profile = Database['public']['Tables']['profiles']['Row']

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single() as { data: Profile | null; error: unknown }

  return (
    <div className="min-h-screen bg-navy">
      <Header
        userEmail={session.user.email!}
        userName={profile?.name || 'User'}
        userId={session.user.id}
      />
      {children}
    </div>
  )
}
