'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Comment } from './Comment'

type CommentsSectionProps = {
  cardId: string
  comments: any[]
  currentUserId: string
  currentUserName: string
  onUpdate: () => void
}

export function CommentsSection({
  cardId,
  comments,
  currentUserId,
  currentUserName,
  onUpdate,
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async () => {
    if (!newComment.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          card_id: cardId,
          user_id: currentUserId,
          content: newComment.trim(),
        })

      if (error) throw error

      setNewComment('')
      onUpdate()
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('댓글 추가 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-navy mb-3 flex items-center gap-2">
        💬 댓글
        {comments.length > 0 && (
          <span className="text-sm font-normal text-gray-600">{comments.length}개</span>
        )}
      </h3>

      {/* Add comment */}
      <div className="mb-4 flex gap-3">
        <div className="w-8 h-8 rounded-full bg-navy text-white text-xs flex items-center justify-center flex-shrink-0">
          {currentUserName?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요..."
            className="w-full px-3 py-2 border border-gray-300 rounded text-navy resize-none focus:outline-none focus:ring-2 focus:ring-navy"
            rows={3}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !newComment.trim()}
            className="mt-2 px-4 py-2 bg-navy text-white rounded hover:bg-navy-light disabled:opacity-50"
          >
            {loading ? '추가 중...' : '댓글 추가'}
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {comments
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onUpdate={onUpdate}
            />
          ))}
      </div>

      {comments.length === 0 && (
        <p className="text-gray-400 text-sm">아직 댓글이 없습니다.</p>
      )}
    </div>
  )
}
