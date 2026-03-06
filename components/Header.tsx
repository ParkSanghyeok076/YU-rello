'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { NotificationBell } from './NotificationBell'
import Image from 'next/image'

type HeaderProps = {
  userEmail: string
  userName: string
  userId: string
}

export function Header({ userEmail, userName, userId }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-black border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Image src="/로고사진.png" alt="YU-rello" width={120} height={40} className="object-contain" />
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell userId={userId} />
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
