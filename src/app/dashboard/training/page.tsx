'use client'

import { useState } from 'react'
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { AddScheduleModal } from '@/components/schedules/add-schedule-modal'
import { Plus, Calendar as CalendarIcon } from 'lucide-react'

const locales = {
  'ko': ko,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
})

export default function SchedulePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const supabase = createClient()

  const { data: schedules, isPending } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('is_deleted', false)
      if (error) throw error
      return data
    }
  })

  const events: Event[] = schedules?.map((s: any) => {
    const startDate = new Date(s.date)
    const endDate = s.end_date ? new Date(s.end_date) : new Date(s.date)
    
    // react-big-calendar의 allDay 이벤트는 종료일이 배제(exclusive)되므로, 
    // 실제 종료일에도 표시되려면 종료일에 1일을 더해주어야 합니다.
    if (s.end_date) {
      endDate.setDate(endDate.getDate() + 1)
    }

    return {
      id: s.id,
      title: s.title,
      start: startDate,
      end: endDate,
      allDay: true,
      resource: s
    }
  }) || []

  const handleSelectSlot = (slotInfo: { start: Date }) => {
    setSelectedDate(slotInfo.start)
    setIsModalOpen(true)
  }

  const handleSelectEvent = (event: Event) => {
    // We can show details or open edit modal
    // For now, simple alert
    const resource = event.resource as any
    alert(`${resource.title}\n유형: ${resource.type === 'training' ? '훈련' : '대회'}\n장소: ${resource.location || '미정'}\n설명: ${resource.description || '없음'}`)
  }

  // Custom Event Component
  const EventComponent = ({ event }: any) => {
    const resource = event.resource as any
    const isCompetition = resource.type === 'competition'
    return (
      <div className="flex items-center gap-1.5 truncate font-bold text-xs tracking-tight">
        <span className="shrink-0">{isCompetition ? '🏆' : '🏊‍♂️'}</span>
        <span className="truncate">{event.title}</span>
      </div>
    )
  }

  // Custom Event Wrapper for styling based on type
  const eventPropGetter = (event: Event) => {
    const resource = event.resource as any
    const isCompetition = resource.type === 'competition'
    return {
      style: {
        backgroundColor: isCompetition ? '#ffe4e6' : '#e0f2fe', // Pastel pink / Pastel sky blue
        color: isCompetition ? '#e11d48' : '#0369a1',
        borderRadius: '12px',
        border: `1px solid ${isCompetition ? '#fecdd3' : '#bae6fd'}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        display: 'block',
        padding: '3px 6px',
        margin: '2px 4px',
        outline: 'none',
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        {/* Cute background decoration */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-sky-100 rounded-full blur-2xl opacity-60"></div>
        <div className="absolute -bottom-4 right-12 w-20 h-20 bg-pink-100 rounded-full blur-2xl opacity-60"></div>
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-3 bg-gradient-to-br from-blue-100 to-sky-100 text-primary rounded-2xl shadow-sm">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-accent-navy">일정 관리 🗓️</h1>
            <p className="text-sm text-slate-500 font-medium">훈련 및 대회 일정을 확인하고 관리하세요!</p>
          </div>
        </div>

        <button 
          onClick={() => { setSelectedDate(undefined); setIsModalOpen(true); }}
          className="relative z-10 flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/30 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          새 일정 추가
        </button>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 h-[750px] calendar-wrapper relative overflow-hidden">
        {/* Soft gradient background for the whole wrapper */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white pointer-events-none"></div>
        
        <style dangerouslySetInnerHTML={{__html: `
          .calendar-wrapper {
            font-family: 'Nunito', 'NanumSquareRound', sans-serif;
          }
          .calendar-wrapper .rbc-calendar { 
            border: none;
            position: relative;
            z-index: 10;
          }
          .calendar-wrapper .rbc-toolbar {
            margin-bottom: 24px;
            gap: 8px;
          }
          .calendar-wrapper .rbc-toolbar button {
            border-radius: 100px;
            border: 2px solid #e2e8f0;
            padding: 8px 20px;
            font-weight: 800;
            color: #64748b;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            font-size: 0.9rem;
          }
          .calendar-wrapper .rbc-toolbar button:hover {
            background: #f8fafc;
            border-color: #cbd5e1;
            transform: translateY(-2px);
            color: #334155;
          }
          .calendar-wrapper .rbc-toolbar button:active {
            transform: translateY(0);
          }
          .calendar-wrapper .rbc-toolbar button.rbc-active {
            background: #0047AB;
            color: white;
            border-color: #0047AB;
            box-shadow: 0 4px 16px rgba(0,71,171,0.25);
          }
          .calendar-wrapper .rbc-month-view, .calendar-wrapper .rbc-time-view, .calendar-wrapper .rbc-agenda-view {
            border: 2px solid #f1f5f9;
            border-radius: 24px;
            overflow: hidden;
            background: white;
            box-shadow: 0 10px 40px rgba(0,0,0,0.02);
          }
          .calendar-wrapper .rbc-header { 
            padding: 16px 10px; 
            font-weight: 800; 
            color: #475569; 
            border-bottom: 2px solid #f1f5f9;
            background: #f8fafc;
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 0.05em;
          }
          .calendar-wrapper .rbc-header + .rbc-header {
            border-left: 2px solid #f1f5f9;
          }
          .calendar-wrapper .rbc-day-bg + .rbc-day-bg {
            border-left: 2px solid #f1f5f9;
          }
          .calendar-wrapper .rbc-month-row + .rbc-month-row {
            border-top: 2px solid #f1f5f9;
          }
          .calendar-wrapper .rbc-today { 
            background-color: #fffbeb; 
          }
          .calendar-wrapper .rbc-off-range-bg { 
            background-color: #f8fafc; 
            opacity: 0.5;
          }
          .calendar-wrapper .rbc-date-cell {
            padding: 8px 8px 4px 8px;
            font-weight: 800;
            color: #64748b;
            text-align: center;
          }
          .calendar-wrapper .rbc-date-cell > a, .calendar-wrapper .rbc-date-cell > a:link, .calendar-wrapper .rbc-date-cell > a:visited {
            color: inherit;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            transition: all 0.2s;
            font-size: 0.95rem;
          }
          .calendar-wrapper .rbc-date-cell > a:hover {
            background-color: #e2e8f0;
            color: #0f172a;
            transform: scale(1.1);
          }
          .calendar-wrapper .rbc-event { 
            background: transparent !important;
            padding: 0 !important;
            border: none !important;
          }
          .calendar-wrapper .rbc-event-content {
            font-size: 0.8rem;
          }
          .calendar-wrapper .rbc-toolbar-label {
            font-size: 1.5rem;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.02em;
          }
        `}} />
        
        {isPending ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 relative z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-primary"></div>
            <p className="text-slate-400 font-bold animate-pulse">일정을 불러오고 있어요...</p>
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            culture="ko"
            views={['month', 'week', 'day', 'agenda']}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            eventPropGetter={eventPropGetter}
            components={{
              event: EventComponent
            }}
            messages={{
              next: "다음 ❯",
              previous: "❮ 이전",
              today: "오늘",
              month: "월간",
              week: "주간",
              day: "일간",
              agenda: "목록",
              noEventsInRange: "이 기간에는 일정이 없어요! 🏖️"
            }}
          />
        )}
      </div>

      {isModalOpen && (
        <AddScheduleModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          initialDate={selectedDate}
        />
      )}
    </div>
  )
}
