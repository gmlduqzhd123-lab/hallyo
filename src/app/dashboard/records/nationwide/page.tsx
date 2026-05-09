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
  '자유형 50m', '자유형 100m', '자유형 200m', '자유형 400m',
  '배영 50m', '배영 100m', '배영 200m',
  '평영 50m', '평영 100m', '평영 200m',
  '접영 50m', '접영 100m', '접영 200m',
  '개인혼영 200m'
]
const GENDER_OPTIONS = ['남자', '여자']
const GRADE_OPTIONS = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년']
const YEAR_OPTIONS = ['2024', '2025', '2026']

export default function NationwideRecordsPage() {
  const [selectedGender, setSelectedGender] = useState<string>('all')
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [selectedGrade, setSelectedGrade] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const supabase = createClient()

  const { data: rankings, isPending } = useQuery({
    queryKey: ['nationwide_rankings', selectedGender, selectedEvent, selectedGrade, selectedYear],
    staleTime: 0, // 캐시 무효화: 항상 최신 데이터를 요청
    gcTime: 0,
    queryFn: async () => {
      let query = supabase.from('nationwide_rankings').select('*').eq('is_deleted', false);

      const debugFilters: Record<string, string | number> = {}

      if (selectedGender && selectedGender !== 'all') {
        query = query.eq('gender', selectedGender);
        debugFilters.gender = selectedGender;
      }

      if (selectedGrade && selectedGrade !== 'all') {
        // '6학년'에서 숫자만 추출하여 정수형으로 변환 (예: '6학년' -> 6)
        const gradeNumber = parseInt(selectedGrade.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(gradeNumber)) {
          query = query.eq('grade', gradeNumber);
          debugFilters.grade = gradeNumber;
        }
      }

      if (selectedYear && selectedYear !== 'all') {
        const yearNumber = parseInt(selectedYear, 10);
        if (!isNaN(yearNumber)) {
          query = query.eq('year', yearNumber);
          debugFilters.year = yearNumber;
        }
      }

      if (selectedEvent && selectedEvent !== 'all') {
        // '자유형 50m'에서 모든 공백 제거 (예: '자유형 50m' -> '자유형50m')
        const formattedEvent = selectedEvent.replace(/\s+/g, '');
        query = query.eq('event', formattedEvent);
        debugFilters.event = formattedEvent;
      }

      console.log('🚀 [Supabase Request] Filters applied:', debugFilters)

      const { data, error } = await query
        .order('gender', { ascending: true })
        .order('rank', { ascending: true })
        .limit(5000)
      
      console.log('📥 [Supabase Response] Data:', data?.length ? `${data.length}건 반환됨` : '데이터 없음', data)
      if (error) {
        console.error('❌ [Supabase Error]:', error)
        throw error
      }
      
      return data as NationwideRanking[]
    }
  })

  // Normalize event names for comparison
  const normalizeEvent = (e: string) => e.replace(/\s+/g, '');
  const normalizedEventOptions = EVENT_OPTIONS.map(normalizeEvent);

  // Since filtering is done on the server, rankings is already filtered
  // We sort them on the frontend to match the EVENT_OPTIONS order exactly
  const filteredRankings = [...(rankings || [])].sort((a, b) => {
    const aEvent = typeof a.event === 'string' ? normalizeEvent(a.event) : '';
    const bEvent = typeof b.event === 'string' ? normalizeEvent(b.event) : '';
    
    const aIdx = normalizedEventOptions.indexOf(aEvent);
    const bIdx = normalizedEventOptions.indexOf(bEvent);
    
    if (aIdx !== bIdx) {
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    }
    
    // Within same event, gender is already sorted by DB, but we ensure it
    const aGender = typeof a.gender === 'string' ? a.gender.trim() : '';
    const bGender = typeof b.gender === 'string' ? b.gender.trim() : '';
    if (aGender !== bGender) {
      if (aGender === '남자') return -1;
      if (bGender === '남자') return 1;
      return aGender.localeCompare(bGender);
    }
    
    // Within same event and gender, rank is already sorted by DB
    return (Number(a.rank) || 0) - (Number(b.rank) || 0);
  });

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
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
            >
              <option value="all">전체 년도</option>
              {YEAR_OPTIONS.map(year => (
                <option key={year} value={year}>{year}년</option>
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
                {(() => {
                  let currentGroup = '';
                  let currentRank = 1;
                  let currentRecord = '';
                  let itemsInCurrentRank = 0;

                  return filteredRankings.map((ranking, idx) => {
                    if (!ranking || typeof ranking !== 'object') return null;
                    
                    const eventStr = typeof ranking.event === 'string' ? ranking.event : String(ranking.event || '');
                    const genderStr = typeof ranking.gender === 'string' ? ranking.gender : String(ranking.gender || '');
                    const safeEvent = eventStr.trim();
                    const safeGender = genderStr.trim();
                    const isMale = ['남', 'm', '남자'].includes(safeGender.toLowerCase());
                    
                    const recordStr = typeof ranking.record === 'string' ? ranking.record : String(ranking.record || '');
                    const safeRecord = recordStr.trim();

                    const groupKey = `${safeEvent}-${safeGender}`;
                    if (groupKey !== currentGroup) {
                      currentGroup = groupKey;
                      currentRank = 1;
                      currentRecord = safeRecord;
                      itemsInCurrentRank = 1;
                    } else {
                      if (safeRecord === currentRecord) {
                        itemsInCurrentRank++;
                      } else {
                        currentRank += itemsInCurrentRank;
                        currentRecord = safeRecord;
                        itemsInCurrentRank = 1;
                      }
                    }

                    const displayRank = currentRank;
                    const gradeNum = ranking.grade ? Number(ranking.grade) : null;
                    const athleteName = typeof ranking.athlete_name === 'string' ? ranking.athlete_name : String(ranking.athlete_name || '');
                    const schoolName = typeof ranking.school === 'string' ? ranking.school : String(ranking.school || '');
                    const yearNum = Number(ranking.year) || new Date().getFullYear();

                    return (
                      <tr key={ranking.id || `fallback-key-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700">
                          {safeEvent}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isMale ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'
                          }`}>
                            {safeGender}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-medium">
                          {gradeNum ? `${gradeNum}학년` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                            displayRank === 1 ? 'bg-amber-100 text-amber-600' :
                            displayRank === 2 ? 'bg-slate-200 text-slate-600' :
                            displayRank === 3 ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {displayRank > 0 ? displayRank : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
                          {athleteName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                          {schoolName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-amber-600">
                          {safeRecord}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-slate-400">
                          {yearNum}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
