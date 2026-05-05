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

  // Custom Event Wrapper for styling based on type
  const eventPropGetter = (event: Event) => {
    const resource = event.resource as any
    const isCompetition = resource.type === 'competition'
    return {
      style: {
        backgroundColor: isCompetition ? '#E11D48' : '#0047AB', // Red for competition, Cobalt for training
        borderRadius: '8px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        padding: '2px 8px',
        fontSize: '0.85rem',
        fontWeight: 'bold'
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-secondary/20 text-primary rounded-xl">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-accent-navy">일정 관리</h1>
            <p className="text-sm text-slate-500 font-medium">훈련 및 대회 일정을 확인하고 관리하세요.</p>
          </div>
        </div>

        <button 
          onClick={() => { setSelectedDate(undefined); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/30"
        >
          <Plus className="w-5 h-5" />
          새 일정 추가
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-[700px] calendar-wrapper">
        <style dangerouslySetInnerHTML={{__html: `
          .calendar-wrapper .rbc-calendar { font-family: inherit; }
          .calendar-wrapper .rbc-header { padding: 10px; font-weight: bold; color: #001f3f; }
          .calendar-wrapper .rbc-today { background-color: #f0f9ff; }
          .calendar-wrapper .rbc-off-range-bg { background-color: #f8fafc; }
          .calendar-wrapper .rbc-event { padding: 4px; }
        `}} />
        
        {isPending ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            messages={{
              next: "다음",
              previous: "이전",
              today: "오늘",
              month: "월",
              week: "주",
              day: "일",
              agenda: "목록",
              noEventsInRange: "이 기간에 등록된 일정이 없습니다."
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
