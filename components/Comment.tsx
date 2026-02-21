'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CommentProps = {
  comment: any
  currentUserId: string
  onUpdate: () => void
}

export function Comment({ comment, currentUserId, onUpdate }: CommentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(comment.content)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const isOwner = comment.user_id === currentUserId

  const handleUpdate = async () => {
    if (!content.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: content.trim() })
        .eq('id', comment.id)

      if (error) throw error

      setIsEditing(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating comment:', error)
      alert('댓글 수정 실패')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('댓글 삭제 실패')
    } finally {
      setLoading(false)
    }
  }

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return '방금 전'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`
    return `${Math.floor(seconds / 86400)}일 전`
  }

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-navy text-white text-xs flex items-center justify-center flex-shrink-0">
        {comment.profiles?.name?.[0]?.toUpperCase()}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-navy">{comment.profiles?.name}</span>
          <span className="text-sm text-gray-500">{timeAgo(comment.created_at)}</span>
        </div>

        {isEditing ? (
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-navy resize-none focus:outline-none focus:ring-2 focus:ring-navy"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleUpdate}
                disabled={loading || !content.trim()}
                className="px-3 py-1 bg-navy text-white text-sm rounded hover:bg-navy-light disabled:opacity-50"
              >
                {loading ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => { setIsEditing(false); setContent(comment.content) }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-navy whitespace-pre-wrap mb-2">{comment.content}</p>
            {isOwner && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-gray-600 hover:text-navy"
                >
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-red-600 disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
