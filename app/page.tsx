import { createServerClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-[family-name:var(--font-logo)] font-bold">
        YU-rello
      </h1>
      <p className="mt-4">
        {session ? `Logged in as ${session.user.email}` : 'Not logged in'}
      </p>
    </main>
  )
}