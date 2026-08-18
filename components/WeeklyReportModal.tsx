'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { addDays, format, startOfWeek } from 'date-fns'

type ChecklistItemRow = {
  id: string
  title: string
  due_date: string | null
  completed: boolean
}

type CardRow = {
  id: string
  title: string
  archived_at: string | null
  card_members: Array<{ user_id: string; profiles: { id: string; name: string } | null }>
  checklists: Array<{ id: string; checklist_items: ChecklistItemRow[] }>
}

type ListRow = {
  id: string
  title: string
  cards: CardRow[]
}

type ReportRow = {
  cardId: string
  listTitle: string
  cardTitle: string
  overallProgress: number | null
  projectedProgress: number | null
  thisWeekItems: Array<{ id: string; title: string; completed: boolean }>
  nextWeekItems: Array<{ id: string; title: string }>
}

type AssigneeGroup = {
  userId: string
  name: string
  rows: ReportRow[]
}

type WeeklyReportModalProps = {
  boardId: string
  users: Array<{ id: string; name: string }>
  onClose: () => void
}

function isInRange(dateStr: string | null, start: Date, end: Date): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr.split('T')[0] + 'T00:00:00')
  return d >= start && d <= end
}

function rowKeyOf(userId: string, cardId: string): string {
  return `${userId}-${cardId}`
}

export function WeeklyReportModal({ boardId, users, onClose }: WeeklyReportModalProps) {
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<AssigneeGroup[]>([])
  const [excludedRowKeys, setExcludedRowKeys] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const toggleRow = (key: string) => {
    setExcludedRowKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const thisWeekEnd = addDays(thisWeekStart, 4)
  const nextWeekStart = addDays(thisWeekStart, 7)
  const nextWeekEnd = addDays(thisWeekStart, 11)

  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('lists')
        .select(`
          id, title,
          cards (
            id, title, archived_at,
            card_members ( user_id, profiles ( id, name ) ),
            checklists ( id, checklist_items ( id, title, due_date, completed ) )
          )
        `)
        .eq('board_id', boardId)
        .is('archived_at', null)
        .order('position', { ascending: true })

      if (error) throw error

      const groupMap = new Map<string, AssigneeGroup>()

      for (const list of (data ?? []) as unknown as ListRow[]) {
        const activeCards = (list.cards ?? []).filter((card) => !card.archived_at)

        for (const card of activeCards) {
          const allItems = (card.checklists ?? []).flatMap((cl) => cl.checklist_items ?? [])
          const totalItems = allItems.length
          const completedItems = allItems.filter((item) => item.completed).length

          const thisWeekItems = allItems.filter((item) => isInRange(item.due_date, thisWeekStart, thisWeekEnd))
          const nextWeekItems = allItems.filter((item) => isInRange(item.due_date, nextWeekStart, nextWeekEnd))

          if (thisWeekItems.length === 0 && nextWeekItems.length === 0) continue

          const nextWeekIds = new Set(nextWeekItems.map((item) => item.id))
          const projectedCompleted = allItems.filter(
            (item) => item.completed || nextWeekIds.has(item.id)
          ).length

          const row: ReportRow = {
            cardId: card.id,
            listTitle: list.title,
            cardTitle: card.title,
            overallProgress: totalItems > 0 ? (completedItems / totalItems) * 100 : null,
            projectedProgress: totalItems > 0 ? (projectedCompleted / totalItems) * 100 : null,
            thisWeekItems: thisWeekItems.map((item) => ({ id: item.id, title: item.title, completed: item.completed })),
            nextWeekItems: nextWeekItems.map((item) => ({ id: item.id, title: item.title })),
          }

          for (const member of card.card_members ?? []) {
            if (!member.profiles) continue
            const existing = groupMap.get(member.user_id)
            if (existing) {
              existing.rows.push(row)
            } else {
              groupMap.set(member.user_id, {
                userId: member.user_id,
                name: member.profiles.name,
                rows: [row],
              })
            }
          }
        }
      }

      // Preserve board member order where possible, then append any not in the users list
      const ordered: AssigneeGroup[] = []
      users.forEach((u) => {
        const g = groupMap.get(u.id)
        if (g) {
          ordered.push(g)
          groupMap.delete(u.id)
        }
      })
      groupMap.forEach((g) => ordered.push(g))

      setGroups(ordered)
    } catch (err) {
      console.error('Error fetching weekly report:', err)
      setGroups([])
    } finally {
      setLoading(false)
    }
  }

  const dateRangeLabel = `${format(thisWeekStart, 'yyyy.MM.dd')}(월) ~ ${format(thisWeekEnd, 'yyyy.MM.dd')}(금)`
  const totalRows = groups.reduce((sum, g) => sum + g.rows.length, 0)

  // Print output only ever renders checked rows. Filtered independently of the
  // interactive (screen) table so its rowSpan counts stay internally consistent —
  // computing spans from the same array that's actually rendered avoids merged
  // cells overflowing into the wrong group when some rows are excluded.
  const printGroups = groups
    .map((group) => ({
      ...group,
      rows: group.rows.filter((row) => !excludedRowKeys.has(rowKeyOf(group.userId, row.cardId))),
    }))
    .filter((group) => group.rows.length > 0)

  const renderTable = (dataGroups: AssigneeGroup[], interactive: boolean) => {
    const rowsTotal = dataGroups.reduce((sum, g) => sum + g.rows.length, 0)
    let dateCellRendered = false

    return (
      <table className="w-full border-collapse text-sm text-gray-900">
        <thead style={{ display: 'table-header-group' }}>
          <tr className="bg-gray-100">
            <th className="border border-gray-400 px-2 py-2 w-28">일자</th>
            <th className="border border-gray-400 px-2 py-2 w-20">담당자</th>
            <th className="border border-gray-400 px-2 py-2 w-40">구분</th>
            <th className="border border-gray-400 px-2 py-2">금주 수행 업무</th>
            <th className="border border-gray-400 px-2 py-2">차주 수행 업무</th>
            <th className="border border-gray-400 px-2 py-2 w-24">비고</th>
          </tr>
        </thead>
        <tbody>
          {dataGroups.map((group) =>
            group.rows.map((row, rowIdx) => {
              const key = rowKeyOf(group.userId, row.cardId)
              const isFirstDateCell = !dateCellRendered
              if (isFirstDateCell) dateCellRendered = true

              return (
                <tr key={key} className="align-top" style={{ breakInside: 'avoid' }}>
                  {isFirstDateCell && (
                    <td
                      className="border border-gray-400 px-2 py-2 text-center align-middle font-medium"
                      rowSpan={rowsTotal}
                    >
                      {dateRangeLabel}
                    </td>
                  )}
                  {rowIdx === 0 && (
                    <td
                      className="border border-gray-400 px-2 py-2 text-center align-middle font-medium"
                      rowSpan={group.rows.length}
                    >
                      {group.name}
                    </td>
                  )}
                  <td className="border border-gray-400 px-2 py-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      {interactive && (
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={!excludedRowKeys.has(key)}
                          onChange={() => toggleRow(key)}
                        />
                      )}
                      <span>
                        <div className="font-medium text-gray-800">{row.listTitle}</div>
                        <div className="text-gray-600">{row.cardTitle}</div>
                      </span>
                    </label>
                  </td>
                  <td className="border border-gray-400 px-2 py-2">
                    <div className="font-medium mb-1">
                      전체 진행률: {row.overallProgress === null ? '-' : `${Math.round(row.overallProgress)}%`}
                    </div>
                    {row.thisWeekItems.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5">
                        {row.thisWeekItems.map((item) => (
                          <li key={item.id}>
                            {item.title}
                            {item.completed && ' (완료)'}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="border border-gray-400 px-2 py-2">
                    <div className="font-medium mb-1">
                      예상 진행률: {row.projectedProgress === null ? '-' : `${Math.round(row.projectedProgress)}%`}
                    </div>
                    {row.nextWeekItems.length > 0 ? (
                      <ul className="list-disc list-inside space-y-0.5">
                        {row.nextWeekItems.map((item) => (
                          <li key={item.id}>{item.title}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="border border-gray-400 px-2 py-2"></td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-8 overflow-y-auto print:p-0 print:bg-white print:static print:block"
      onClick={onClose}
    >
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 12mm;
          }
          body * {
            visibility: hidden;
          }
          #weekly-report-printable,
          #weekly-report-printable * {
            visibility: visible;
          }
          #weekly-report-printable {
            position: fixed;
            inset: 0;
            width: 100%;
          }
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-8 print:shadow-none print:rounded-none print:max-w-none print:m-0 print:w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (hidden on print) */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 print:hidden">
          <div>
            <h2 className="text-xl font-bold text-gray-900">주간 리포트</h2>
            <p className="text-sm text-gray-500 mt-1">{dateRangeLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-navy text-white text-sm rounded-lg hover:bg-navy-light transition-colors"
            >
              인쇄
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
            >
              닫기
            </button>
          </div>
        </div>

        {/* Printable content */}
        <div id="weekly-report-printable" className="p-6 print:p-0">
          {loading ? (
            <div className="py-16 text-center text-gray-400">불러오는 중...</div>
          ) : totalRows === 0 ? (
            <div className="py-16 text-center text-gray-400">이번 주 · 다음 주에 마감 예정인 업무가 없습니다</div>
          ) : (
            <>
              {/* Screen: interactive checkboxes control what actually prints */}
              <p className="text-xs text-gray-500 mb-2 print:hidden">
                체크 해제한 업무는 인쇄물에서 제외됩니다.
              </p>
              <div className="print:hidden">{renderTable(groups, true)}</div>

              {/* Print: only checked rows, hidden on screen */}
              <div className="hidden print:block">
                {printGroups.length > 0 ? (
                  renderTable(printGroups, false)
                ) : (
                  <div className="py-16 text-center text-gray-400">선택된 업무가 없습니다</div>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
