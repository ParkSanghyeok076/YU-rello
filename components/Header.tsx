'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type HeaderProps = {
  userEmail: string
  userName: string
}

export function Header({ userEmail, userName }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-navy border-b border-navy-light px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-[family-name:var(--font-logo)] font-bold">YU-rello</h1>
          {/* Board selector will go here */}
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications will go here */}
          <div className="flex items-center gap-2">
            <span className="text-sm">{userName}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm bg-navy-light hover:bg-navy-dark rounded transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
