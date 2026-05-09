import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Timer, Trophy, Calendar } from 'lucide-react'
import { formatTimeSeconds } from '@/utils/time'
import { format } from 'date-fns'
import EventRecordChart from './EventRecordChart'
import EventRecordTable from './EventRecordTable'

export default async function AthleteRecordsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const id = resolvedParams.id
  const supabase = await createClient()

  const { data: athlete } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', id)
    .single()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id)
    .single()
  const userRole = profile?.role || ''

  const { data: records } = await supabase
    .from('records')
    .select('*, schedules(title, location)')
    .eq('athlete_id', id)
    .eq('is_deleted', false)
    .order('record_date', { ascending: false })

  // Group records by event_name to show best times or progression
  const recordsByEvent = records?.reduce((acc: any, record: any) => {
    if (!acc[record.event_name]) acc[record.event_name] = []
    acc[record.event_name].push(record)
    return acc
  }, {})

  // Sort within each group
  Object.keys(recordsByEvent || {}).forEach(event => {
    recordsByEvent[event].sort((a: any, b: any) => {
      const dateA = new Date(a.record_date).getTime();
      const dateB = new Date(b.record_date).getTime();
      if (dateB !== dateA) return dateB - dateA; // Descending by date

      // Same date, sort by match_type.
      // We want '결승' to be at the top (before '예선')
      if (a.match_type === '결승' && b.match_type !== '결승') return -1;
      if (a.match_type !== '결승' && b.match_type === '결승') return 1;

      // If both or neither are '결승', sort by record_time (faster time first)
      return parseFloat(a.record_time) - parseFloat(b.record_time);
    });
  });

  return (
    <div className="space-y-6">
      <Link href="/dashboard/records" className="inline-flex items-center text-slate-500 hover:text-accent-navy transition-colors font-bold gap-2">
        <ArrowLeft className="w-5 h-5" />
        선수 명단으로 돌아가기
      </Link>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Timer className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-black border border-indigo-200">
              {athlete?.grade}학년
            </span>
            {athlete?.gender && (
              <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-sm font-bold border border-slate-200">
                {athlete.gender === 'M' ? '남성' : athlete.gender === 'F' ? '여성' : athlete.gender}
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-accent-navy mb-2">{athlete?.name} 선수의 기록</h1>
        </div>
      </div>

      <div className="space-y-8">
        {Object.keys(recordsByEvent || {}).length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center">
            <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">등록된 대회 기록이 없습니다.</p>
          </div>
        ) : (
          Object.entries(recordsByEvent).map(([event, eventRecords]: [string, any]) => (
            <div key={event} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-black text-accent-navy">{event}</h2>
              </div>
              
              {/* Add the Chart here if there are at least 2 data points for a meaningful trend */}
              {eventRecords.length > 1 && (
                <div className="px-6 pt-6 pb-2 border-b border-slate-50">
                  <h3 className="text-sm font-bold text-slate-500 mb-2">기록 성장 추이</h3>
                  <EventRecordChart records={eventRecords} />
                </div>
              )}

              <EventRecordTable eventRecords={eventRecords} userRole={userRole} athleteId={id} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
