'use client'

import { useState, useMemo } from 'react'
import { Modal } from '@/components/ui/modal'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { AlertCircle, Plus, Trash2, Check, X } from 'lucide-react'
import { addRecord, deleteRecord } from '@/app/actions/records'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { formatTimeSeconds, parseTimeInput } from '@/utils/time'

interface Props {
  isOpen: boolean
  onClose: () => void
  athleteId: string | null
  athleteName: string | null
}

export function PbChartModal({ isOpen, onClose, athleteId, athleteName }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const queryClient = useQueryClient()
  
  // Form states
  const [isAdding, setIsAdding] = useState(false)
  const [recordTime, setRecordTime] = useState('')
  const [recordDate, setRecordDate] = useState('')
  const [isCompetition, setIsCompetition] = useState(false)
  const [selectedScheduleId, setSelectedScheduleId] = useState('')

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

  const { data: schedules } = useQuery({
    queryKey: ['schedules-all'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('schedules')
        .select('id, title, start_date')
        .eq('is_deleted', false)
        .order('start_date', { ascending: false })
      if (error) throw new Error(error.message)
      return data
    },
    enabled: isOpen
  })

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!athleteId || !recordTime || !recordDate || !selectedEvent) throw new Error('필수 정보를 입력해주세요.')
      const finalRecordTime = parseTimeInput(recordTime)
      const formData = new FormData()
      formData.append('athlete_id', athleteId)
      formData.append('event_name', selectedEvent)
      formData.append('record_time', finalRecordTime)
      formData.append('record_date', recordDate)
      if (isCompetition && selectedScheduleId) {
        formData.append('schedule_id', selectedScheduleId)
      } else {
        formData.append('schedule_id', '')
      }
      
      const res = await addRecord(formData)
      if (res?.error) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      toast.success('기록이 등록되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['records', athleteId] })
      setIsAdding(false)
      setRecordTime('')
      setRecordDate('')
      setIsCompetition(false)
      setSelectedScheduleId('')
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const delMutation = useMutation({
    mutationFn: async ({ id, scheduleId }: { id: string, scheduleId: string | null }) => {
      const res = await deleteRecord(id, scheduleId)
      if (res?.error) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      toast.success('기록이 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['records', athleteId] })
    },
    onError: (err: Error) => toast.error(err.message)
  })

  // Extract unique events for chart lines
  const uniqueEvents = useMemo(() => {
    if (!records) return []
    const events = new Set(records.map(r => r.event_name))
    return Array.from(events)
  }, [records])

  // Combine preset events and actual events for the filter buttons
  const allEvents = useMemo(() => {
    const preset = [
      '자유형 50M', '자유형 100M', '자유형 200M', '자유형 400M',
      '배영 50M', '배영 100M', '배영 200M',
      '평영 50M', '평영 100M', '평영 200M',
      '접영 50M', '접영 100M', '개인혼영 200M'
    ];
    const events = new Set(preset);
    if (records) {
      records.forEach(r => events.add(r.event_name));
    }
    return Array.from(events);
  }, [records]);

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
            <button
              type="button"
              onClick={() => setSelectedEvent('all')}
              className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
                selectedEvent === 'all'
                  ? 'bg-primary text-white shadow-md shadow-primary/30 scale-105'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
              }`}
            >
              전체
            </button>
            {allEvents.map(event => (
              <button
                key={event}
                type="button"
                onClick={() => setSelectedEvent(event)}
                className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
                  selectedEvent === event
                    ? 'bg-primary text-white shadow-md shadow-primary/30 scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                {event}
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
                  reversed={true}
                />
                <Tooltip 
                  formatter={(value: any) => [formatTimeSeconds(value), '기록']}
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

        {/* Record Management Section */}
        {selectedEvent !== 'all' && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-accent-navy flex items-center gap-2">
                기록 관리 <span className="text-sm font-normal text-slate-500">({selectedEvent})</span>
              </h4>
              {!isAdding && (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="text-sm bg-primary text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> 기록 추가
                </button>
              )}
            </div>

            {isAdding && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-4 space-y-4 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">기록일 <span className="text-rose-500">*</span></label>
                    <input 
                      type="date" 
                      value={recordDate} 
                      onChange={e => setRecordDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">기록 <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      value={recordTime} 
                      onChange={e => setRecordTime(e.target.value)}
                      placeholder="예: 1:02.09 또는 25.43"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3 cursor-pointer w-fit select-none">
                    <input 
                      type="checkbox" 
                      checked={isCompetition} 
                      onChange={e => setIsCompetition(e.target.checked)}
                      className="rounded text-primary focus:ring-primary w-4 h-4"
                    />
                    대회 기록입니다
                  </label>
                  
                  {isCompetition && (
                    <select 
                      value={selectedScheduleId}
                      onChange={e => setSelectedScheduleId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
                    >
                      <option value="">대회를 선택해주세요</option>
                      {schedules?.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 mt-4">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    취소
                  </button>
                  <button 
                    onClick={() => addMutation.mutate()}
                    disabled={addMutation.isPending}
                    className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md shadow-primary/20"
                  >
                    {addMutation.isPending ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
              {records?.filter(r => r.event_name === selectedEvent).length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">등록된 기록이 없습니다.</div>
              ) : (
                records?.filter(r => r.event_name === selectedEvent).map(record => (
                  <div key={record.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all rounded-2xl shadow-sm group">
                    <div className="flex items-center gap-4">
                      <div className="font-black text-primary text-xl w-24 tracking-tight">{formatTimeSeconds(record.record_time)}</div>
                      <div className="text-sm flex flex-col gap-1">
                        <div className="font-bold text-slate-700 flex items-center gap-2">
                          {format(new Date(record.record_date), 'yyyy.MM.dd')}
                          {!record.schedule_id && <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full">일반 기록</span>}
                        </div>
                        {record.schedule_id && (
                          <div className="text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg w-fit font-semibold border border-indigo-100">
                            🏆 {schedules?.find((s: any) => s.id === record.schedule_id)?.title || '대회 기록'}
                          </div>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => { if(confirm('이 기록을 삭제하시겠습니까?')) delMutation.mutate({ id: record.id, scheduleId: record.schedule_id }) }}
                      className="text-slate-300 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                      title="기록 삭제"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
