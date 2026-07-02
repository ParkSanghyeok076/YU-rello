'use client'

import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

type CalendarViewProps = {
  lists: any[]
  onCardClick: (cardId: string) => void
}

function addOneDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
  const date = new Date(y, m - 1, d + 1)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function CalendarView({ lists, onCardClick }: CalendarViewProps) {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    const calendarEvents: any[] = []

    lists.forEach((list) => {
      list.cards.forEach((card: any) => {
        // 체크리스트 아이템 마감일
        card.checklists?.forEach((cl: any) => {
          cl.checklist_items?.forEach((item: any) => {
            if (item.due_date) {
              calendarEvents.push({
                id: item.id,
                title: `${item.completed ? '✓ ' : ''}${item.title}`,
                date: item.due_date.split('T')[0],
                backgroundColor: item.completed ? '#22c55e' : '#00d992',
                borderColor: item.completed ? '#16a34a' : '#00b87a',
                extendedProps: {
                  cardId: card.id,
                  cardTitle: card.title,
                  listTitle: list.title,
                  completed: item.completed,
                },
              })
            }
          })
        })

        // 카드 날짜 이벤트 (start_date 또는 due_date가 있을 때)
        const cardStart = card.start_date || (card.due_date ? card.due_date.split('T')[0] : null)
        const cardEnd = card.due_date ? card.due_date.split('T')[0] : card.start_date

        if (cardStart) {
          calendarEvents.push({
            id: `card-${card.id}`,
            title: card.title,
            start: cardStart,
            end: addOneDay(cardEnd!),
            allDay: true,
            backgroundColor: '#6366f1',
            borderColor: '#4f46e5',
            extendedProps: {
              cardId: card.id,
              cardTitle: card.title,
              listTitle: list.title,
            },
          })
        }
      })
    })

    setEvents(calendarEvents)
  }, [lists])

  const handleEventClick = (info: any) => {
    const cardId = info.event.extendedProps.cardId
    if (cardId) {
      onCardClick(cardId)
    }
  }

  return (
    <div className="bg-white rounded-lg p-4 h-full">
      <style>{`
        .fc {
          --fc-border-color: #e5e7eb;
          --fc-button-bg-color: #00d992;
          --fc-button-border-color: #00d992;
          --fc-button-hover-bg-color: #00b87a;
          --fc-button-hover-border-color: #00b87a;
          --fc-button-active-bg-color: #009966;
          --fc-button-active-border-color: #009966;
          --fc-today-bg-color: rgba(0,217,146,0.06);
        }
        .fc-button { color: #0a1a14 !important; font-weight: 600 !important; }
        .fc-event { cursor: pointer; }
        .fc-event:hover { opacity: 0.8; }
        .fc .fc-daygrid-day-number { color: #111827; }
        .fc .fc-col-header-cell-cushion { color: #111827; font-weight: 600; }
        .fc .fc-toolbar-title { color: #111827; font-size: 1.5rem; font-weight: 700; }
      `}</style>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek',
        }}
        fixedWeekCount={false}
        height="100%"
        locale="ko"
      />
    </div>
  )
}
