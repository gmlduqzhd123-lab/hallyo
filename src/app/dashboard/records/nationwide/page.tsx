'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Trophy, ArrowLeft, Loader2, Filter } from 'lucide-react'
import Link from 'next/link'

type NationwideRanking = {
  id: string
  gender: string
  event: string
  rank: number
  athlete_name: string
  school: string
  record: string
  year: number
  grade?: number
  created_at: string
}

const EVENT_OPTIONS = [
  '자유형 50m', '자유형 100m', '자유형 200m', '자유형 400m', '자유형 800m', '자유형 1500m',
  '배영 50m', '배영 100m', '배영 200m',
  '평영 50m', '평영 100m', '평영 200m',
  '접영 50m', '접영 100m', '접영 200m',
  '개인혼영 200m', '개인혼영 400m'
]
const GENDER_OPTIONS = ['남자', '여자']
const GRADE_OPTIONS = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년']

export default function NationwideRecordsPage() {
  const [selectedGender, setSelectedGender] = useState<string>('all')
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [selectedGrade, setSelectedGrade] = useState<string>('all')
  const supabase = createClient()

  const { data: rankings, isPending } = useQuery({
    queryKey: ['nationwide_rankings', selectedGender, selectedEvent, selectedGrade],
    staleTime: 0, // 캐시 무효화: 항상 최신 데이터를 요청
    gcTime: 0,
    queryFn: async () => {
      let query = supabase
        .from('nationwide_rankings')
        .select('*')
        .eq('is_deleted', false)
      
      let debugFilters: any = {}

      if (selectedGender !== 'all') {
        query = query.eq('gender', selectedGender)
        debugFilters.gender = selectedGender
      }

      if (selectedGrade !== 'all') {
        // 정규식을 이용해 숫자만 추출하여 정수형(Number)으로 변환
        const gradeStr = selectedGrade.replace(/[^0-9]/g, '')
        const gradeNum = Number(gradeStr)
        if (gradeStr && !isNaN(gradeNum)) {
          query = query.eq('grade', gradeNum)
          debugFilters.grade = gradeNum
        }
      }

      if (selectedEvent !== 'all') {
        // 띄어쓰기 제거 후 eq로 검색
        const cleanEvent = selectedEvent.replace(/\s+/g, '')
        query = query.eq('event', cleanEvent)
        debugFilters.event = cleanEvent
      }

      console.log('🚀 [Supabase Request] Filters applied:', debugFilters)

      const { data, error } = await query
        .order('event', { ascending: true })
        .order('gender', { ascending: true })
        .order('rank', { ascending: true })
        .limit(1000)
      
      console.log('📥 [Supabase Response] Data:', data?.length ? `${data.length}건 반환됨` : '데이터 없음', data)
      if (error) {
        console.error('❌ [Supabase Error]:', error)
        throw error
      }
      
      return data as NationwideRanking[]
    }
  })


  // Since filtering is done on the server, rankings is already filtered
  const filteredRankings = rankings || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/records"
            className="p-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-accent-navy break-keep">전국 선수 공식 기록</h1>
              <p className="text-sm text-slate-500 font-medium break-keep">전국 대회의 주요 선수들의 최고 기록을 확인합니다.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2 text-slate-700 font-bold shrink-0">
            <Filter className="w-5 h-5 text-amber-500" />
            필터
          </div>
          <div className="flex gap-4 flex-wrap">
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
            >
              <option value="all">전체 종목</option>
              {EVENT_OPTIONS.map(event => (
                <option key={event} value={event}>{event}</option>
              ))}
            </select>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
            >
              <option value="all">전체 성별</option>
              {GENDER_OPTIONS.map(gender => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
            >
              <option value="all">전체 학년</option>
              {GRADE_OPTIONS.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
        </div>

        {isPending ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
            <p className="font-medium">기록을 불러오는 중입니다...</p>
          </div>
        ) : filteredRankings.length === 0 ? (
          <div className="py-20 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
            해당 조건에 일치하는 전국 기록이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">종목</th>
                  <th className="px-6 py-4 whitespace-nowrap">성별</th>
                  <th className="px-6 py-4 whitespace-nowrap">학년</th>
                  <th className="px-6 py-4 whitespace-nowrap">순위</th>
                  <th className="px-6 py-4 whitespace-nowrap">이름</th>
                  <th className="px-6 py-4 whitespace-nowrap">소속(학교)</th>
                  <th className="px-6 py-4 whitespace-nowrap">기록</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">기준 년도</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRankings.map((ranking) => (
                  <tr key={ranking.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
                      {(ranking.event || '').trim()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        ['남', 'm', '남자'].includes((ranking.gender || '').trim().toLowerCase())
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-rose-100 text-rose-600'
                      }`}>
                        {(ranking.gender || '').trim()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">
                      {ranking.grade ? `${ranking.grade}학년` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        ranking.rank === 1 ? 'bg-amber-100 text-amber-600' :
                        ranking.rank === 2 ? 'bg-slate-200 text-slate-600' :
                        ranking.rank === 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {ranking.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                      {ranking.athlete_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {ranking.school}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-amber-600">
                      {ranking.record}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-400">
                      {ranking.year}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
