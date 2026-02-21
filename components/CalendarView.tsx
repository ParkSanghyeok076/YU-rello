'use client'

import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

type CalendarViewProps = {
  lists: any[]
  onCardClick: (cardId: string) => void
}

export function CalendarView({ lists, onCardClick }: CalendarViewProps) {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    const calendarEvents: any[] = []

    lists.forEach((list) => {
      list.cards.forEach((card: any) => {
        // 체크리스트 아이템 마감일
        card.checklist_items?.forEach((item: any) => {
          if (item.due_date) {
            calendarEvents.push({
              id: item.id,
              title: `${item.completed ? '✓ ' : ''}${item.title}`,
              date: item.due_date.split('T')[0],
              backgroundColor: item.completed ? '#22c55e' : '#1a2b4a',
              borderColor: item.completed ? '#16a34a' : '#0a1b3a',
              extendedProps: {
                cardId: card.id,
                cardTitle: card.title,
                listTitle: list.title,
                completed: item.completed,
              },
            })
          }
        })

        // 카드 마감일
        if (card.due_date) {
          calendarEvents.push({
            id: `card-${card.id}`,
            title: `📋 ${card.title}`,
            date: card.due_date.split('T')[0],
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
    <div className="bg-white rounded-lg p-6">
      <style>{`
        .fc {
          --fc-border-color: #e5e7eb;
          --fc-button-bg-color: #1a2b4a;
          --fc-button-border-color: #1a2b4a;
          --fc-button-hover-bg-color: #2a3b5a;
          --fc-button-hover-border-color: #2a3b5a;
          --fc-button-active-bg-color: #0a1b3a;
          --fc-button-active-border-color: #0a1b3a;
          --fc-today-bg-color: #f0f9ff;
        }
        .fc-event { cursor: pointer; }
        .fc-event:hover { opacity: 0.8; }
        .fc .fc-daygrid-day-number { color: #1a2b4a; }
        .fc .fc-col-header-cell-cushion { color: #1a2b4a; font-weight: 600; }
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
        height="auto"
        locale="ko"
      />
    </div>
  )
}
