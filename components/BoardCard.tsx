'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type BoardCardProps = {
  board: {
    id: string
    title: string
    created_at: string
  }
}

export function BoardCard({ board }: BoardCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMenuOpen(false)
    if (!confirm(`"${board.title}" 보드를 삭제하시겠습니까?\n모든 리스트와 카드가 삭제됩니다.`)) return
    const { error } = await supabase.from('boards').delete().eq('id', board.id)
    if (!error) router.refresh()
  }

  return (
    <div className="relative group">
      <a
        href={`/board/${board.id}`}
        className="block p-6 bg-white text-navy rounded-lg hover:shadow-lg transition-shadow"
      >
        <h3 className="text-lg font-semibold">{board.title}</h3>
        <p className="text-sm text-gray-600 mt-2">
          생성일: {new Date(board.created_at).toLocaleDateString('ko-KR')}
        </p>
      </a>

      {/* ⋯ hover menu */}
      <div className="absolute top-3 right-3" ref={menuRef}>
        <button
          onClick={(e) => { e.preventDefault(); setIsMenuOpen((prev) => !prev) }}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center text-gray-600 text-sm"
        >
          ⋯
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              🗑️ 보드 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
