'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Database } from '@/lib/supabase/client'

type Board = Database['public']['Tables']['boards']['Row']

export function BoardForm() {
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('boards')
        .insert({
          title,
          created_by: user.id,
        })
        .select()
        .single() as { data: Board | null; error: unknown }

      if (error) throw error

      // 본인을 board_members에 등록
      const { error: memberError } = await supabase
        .from('board_members')
        .insert({ board_id: (data as Board).id, user_id: user.id })

      if (memberError) throw memberError

      router.push(`/board/${(data as Board).id}`)
      router.refresh()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-navy mb-6">새 보드 만들기</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-navy mb-1">
            보드 이름
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="예: 프로젝트 관리"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-navy focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 px-4 bg-navy text-white rounded-md hover:bg-navy-light disabled:opacity-50 transition-colors"
          >
            {loading ? '생성 중...' : '보드 만들기'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 text-navy rounded-md hover:bg-gray-300 transition-colors"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
