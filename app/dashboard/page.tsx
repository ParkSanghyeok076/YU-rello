import { createServerClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">내 보드</h2>

        {boards && boards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <a
                key={board.id}
                href={`/board/${board.id}`}
                className="p-6 bg-white text-navy rounded-lg hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold">{board.title}</h3>
                <p className="text-sm text-gray-600 mt-2">
                  생성일: {new Date(board.created_at).toLocaleDateString('ko-KR')}
                </p>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">아직 보드가 없습니다. 새 보드를 만들어보세요!</p>
        )}
      </div>

      <a
        href="/board/new"
        className="inline-block px-6 py-3 bg-white text-navy rounded-lg hover:bg-gray-100 transition-colors font-medium"
      >
        + 새 보드 만들기
      </a>
    </div>
  )
}
