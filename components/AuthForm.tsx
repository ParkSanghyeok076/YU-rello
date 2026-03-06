'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type AuthFormProps = {
  mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        })
        if (error) throw error
        alert('회원가입 성공! 이메일을 확인해주세요.')
        router.push('/login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto mt-16 p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-[family-name:var(--font-logo)] font-bold text-navy mb-8 text-center">
        YU-rello
      </h1>
      <h2 className="text-xl text-navy mb-6">
        {mode === 'login' ? '로그인' : '회원가입'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-navy mb-1">
              이름
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-navy focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-navy mb-1">
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-navy focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-navy mb-1">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-navy focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-navy text-white rounded-md hover:bg-navy-light disabled:opacity-50 transition-colors"
        >
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>
      </form>

      <div className="mt-4 text-center">
        {mode === 'login' ? (
          <p className="text-navy">
            계정이 없으신가요?{' '}
            <a href="/signup" className="text-blue-600 hover:underline">
              회원가입
            </a>
          </p>
        ) : (
          <p className="text-navy">
            이미 계정이 있으신가요?{' '}
            <a href="/login" className="text-blue-600 hover:underline">
              로그인
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
