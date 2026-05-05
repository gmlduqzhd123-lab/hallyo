'use client'

import { useState, useMemo } from 'react'
import { Modal } from '@/components/ui/modal'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { AlertCircle } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  athleteId: string | null
  athleteName: string | null
}

export function PbChartModal({ isOpen, onClose, athleteId, athleteName }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<string>('all')

  const { data: records, isPending, isError } = useQuery({
    queryKey: ['records', athleteId],
    queryFn: async () => {
      if (!athleteId) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('athlete_id', athleteId)
        .eq('is_deleted', false)
        .order('record_date', { ascending: true })

      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!athleteId && isOpen
  })

  // Extract unique events
  const uniqueEvents = useMemo(() => {
    if (!records) return []
    const events = new Set(records.map(r => r.event_name))
    return Array.from(events)
  }, [records])

  // Process data for chart
  const chartData = useMemo(() => {
    if (!records) return []
    let filtered = records
    if (selectedEvent !== 'all') {
      filtered = records.filter(r => r.event_name === selectedEvent)
    }

    // Group by date
    const grouped = filtered.reduce((acc, curr) => {
      const date = curr.record_date
      if (!acc[date]) acc[date] = { date }
      // To display multiple lines if 'all' is selected, we map event_name to the record_time
      acc[date][curr.event_name] = parseFloat(curr.record_time)
      return acc
    }, {} as Record<string, Record<string, string | number>>)

    // @ts-expect-error: Object.values inferred as unknown[]
    return Object.values(grouped).sort((a: Record<string, unknown>, b: Record<string, unknown>) => new Date(String(a.date)).getTime() - new Date(String(b.date)).getTime())
  }, [records, selectedEvent])

  const colors = ['#0047AB', '#89CFF0', '#E11D48', '#10B981', '#F59E0B']

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${athleteName || '선수'} 개인 최고 기록 (PB)`}>
      <div className="space-y-4">
        {/* Event Selector Buttons */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-accent-navy">종목 선택:</label>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: '전체' },
              { key: '자유형50M', label: '자유형 50M' },
              { key: '자유형100M', label: '자유형 100M' },
              { key: '자유형200M', label: '자유형 200M' },
              { key: '배영50M', label: '배영 50M' },
              { key: '평영50M', label: '평영 50M' },
              { key: '평영100M', label: '평영 100M' },
              { key: '접영50M', label: '접영 50M' },
              { key: '접영100M', label: '접영 100M' },
            ].map(event => (
              <button
                key={event.key}
                type="button"
                onClick={() => setSelectedEvent(event.key)}
                className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
                  selectedEvent === event.key
                    ? 'bg-primary text-white shadow-md shadow-primary/30 scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                {event.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Area */}
        <div className="h-[300px] w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-center">
          {isPending ? (
            <div className="flex flex-col items-center gap-3 animate-pulse text-primary font-bold">
              <div className="w-8 h-8 border-4 border-t-primary border-primary/30 rounded-full animate-spin"></div>
              기록을 불러오는 중...
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 text-rose-500">
              <AlertCircle className="w-8 h-8" />
              <p className="font-bold text-sm">데이터를 불러오지 못했습니다.</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="text-slate-400 font-bold text-sm">
              등록된 기록이 없습니다.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                  axisLine={false} 
                  tickLine={false}
                  dx={-10}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0047AB', marginBottom: '4px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} />
                
                {selectedEvent === 'all' ? (
                  uniqueEvents.map((event, idx) => (
                    <Line 
                      key={event} 
                      type="monotone" 
                      dataKey={event} 
                      stroke={colors[idx % colors.length]} 
                      strokeWidth={3}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      connectNulls
                    />
                  ))
                ) : (
                  <Line 
                    type="monotone" 
                    dataKey={selectedEvent} 
                    stroke="#0047AB" 
                    strokeWidth={4}
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#89CFF0' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </Modal>
  )
}
