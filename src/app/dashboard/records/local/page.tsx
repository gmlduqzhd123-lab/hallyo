import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Timer, User, ArrowLeft } from 'lucide-react'

export default async function RecordsDashboardPage() {
  const supabase = await createClient()
  const { data: athletes } = await supabase
    .from('athletes')
    .select('id, name, grade, gender')
    .eq('is_deleted', false)
    .order('grade', { ascending: false })
    .order('name', { ascending: true })

  return (
    <div className="space-y-6">
      <Link href="/dashboard/records" className="inline-flex items-center text-slate-500 hover:text-accent-navy transition-colors font-bold gap-2">
        <ArrowLeft className="w-5 h-5" />
        기록 선택으로 돌아가기
      </Link>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Timer className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-black text-accent-navy mb-3 break-keep leading-tight">여수한려초 수영부 기록</h1>
          <p className="text-slate-500 text-base md:text-lg break-keep leading-relaxed">우리 수영부 선수들의 이름을 클릭하여 대회 기록을 한눈에 확인하세요.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {athletes?.map((athlete) => (
          <Link href={`/dashboard/records/${athlete.id}`} key={athlete.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col items-center justify-center text-center group cursor-pointer">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-colors">
              <User className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <h3 className="font-black text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">{athlete.name}</h3>
            <span className="text-sm font-bold text-slate-400 mt-1">{athlete.grade}학년 {athlete.gender === 'M' ? '남' : athlete.gender === 'F' ? '여' : ''}</span>
          </Link>
        ))}
        {(!athletes || athletes.length === 0) && (
          <div className="col-span-full text-center py-12 text-slate-400 font-medium">등록된 선수가 없습니다.</div>
        )}
      </div>
    </div>
  )
}
