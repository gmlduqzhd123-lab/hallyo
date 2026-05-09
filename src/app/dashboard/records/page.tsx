import Link from 'next/link'
import { Timer, Trophy, ArrowRight, Activity } from 'lucide-react'

export default function RecordsSelectionPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Timer className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-black text-accent-navy mb-3 break-keep leading-tight">선수 기록</h1>
          <p className="text-slate-500 text-base md:text-lg break-keep leading-relaxed">조회하고자 하는 기록의 종류를 선택해주세요.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Local Athletes Card */}
        <Link href="/dashboard/records/local" className="group relative bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[32px] p-8 md:p-10 text-white overflow-hidden shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 transition-transform duration-700 group-hover:scale-110"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md mb-6 border border-white/30 group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-3 break-keep">여수한려초 수영부<br/>선수 기록</h2>
            <p className="text-blue-100 font-medium mb-8 break-keep text-lg">교내 수영부 선수들의 대회별 세부 기록과 개인 최고 기록(PB)을 확인합니다.</p>
            
            <div className="flex items-center gap-2 font-bold text-white group-hover:gap-4 transition-all bg-white/10 inline-flex px-5 py-2.5 rounded-xl border border-white/20 backdrop-blur-sm">
              기록 보기 <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>

        {/* National Athletes Card */}
        <Link href="/dashboard/records/national" className="group relative bg-gradient-to-br from-amber-500 to-orange-500 rounded-[32px] p-8 md:p-10 text-white overflow-hidden shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 transition-transform duration-700 group-hover:scale-110"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md mb-6 border border-white/30 group-hover:scale-110 transition-transform duration-300">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-3 break-keep">전국 선수<br/>공식 기록</h2>
            <p className="text-amber-100 font-medium mb-8 break-keep text-lg">전국 대회에서 활약하는 타 학교 및 주요 선수들의 공식 대회 기록을 확인합니다.</p>
            
            <div className="flex items-center gap-2 font-bold text-white group-hover:gap-4 transition-all bg-white/10 inline-flex px-5 py-2.5 rounded-xl border border-white/20 backdrop-blur-sm">
              기록 보기 <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
