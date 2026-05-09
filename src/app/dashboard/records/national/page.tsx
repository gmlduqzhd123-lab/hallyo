import Link from 'next/link'
import { Trophy, ArrowLeft } from 'lucide-react'

export default function NationalRecordsPage() {
  return (
    <div className="space-y-6">
      <Link href="/dashboard/records" className="inline-flex items-center text-slate-500 hover:text-accent-navy transition-colors font-bold gap-2">
        <ArrowLeft className="w-5 h-5" />
        기록 선택으로 돌아가기
      </Link>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Trophy className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-black text-accent-navy mb-3 break-keep leading-tight">전국 선수 기록</h1>
          <p className="text-slate-500 text-base md:text-lg break-keep leading-relaxed">전국 수영 대회에 출전하는 주요 선수들의 공식 기록을 관리하고 열람합니다.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-700 mb-2">전국 선수 기록 기능 준비 중</h3>
        <p className="text-slate-500 mb-6 max-w-md mx-auto break-keep">
          여수한려초 소속이 아닌 타 학교 및 전국 선수들의 기록을 등록하고 관리할 수 있는 전용 데이터베이스를 준비하고 있습니다. 향후 이곳에서 선수들의 기록을 조회하고 비교할 수 있습니다.
        </p>
      </div>
    </div>
  )
}
