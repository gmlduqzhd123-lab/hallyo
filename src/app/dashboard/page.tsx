'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import React from 'react'
import { CalendarDays, ChevronRight, Bell, AlertCircle } from 'lucide-react'

// Fetch athletes (is_deleted = false)
async function fetchActiveAthletes() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('athletes')
    .select('id, gender')
    .eq('is_deleted', false)

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export default function DashboardPage() {
  const { data: athletes, isPending, isError, error } = useQuery({
    queryKey: ['athletes', 'active'],
    queryFn: fetchActiveAthletes,
  })

  // Calculations for stats
  const total = athletes?.length || 0
  const boys = athletes?.filter(a => a.gender === 'M').length || 0
  const girls = athletes?.filter(a => a.gender === 'F').length || 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-accent-navy">선수 명단 대시보드</h1>
        <p className="text-slate-500 mt-1">한려초등학교 수영부 선수 현황입니다.</p>
      </div>

      {/* Stats Widget */}
      <div className="bg-primary rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-[0_10px_40px_rgb(0,71,171,0.2)] min-h-[160px]">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 right-20 w-32 h-32 bg-secondary/30 rounded-full blur-2xl translate-y-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 h-full">
          {isPending ? (
            <div className="flex items-center gap-3 animate-pulse text-blue-200 font-bold">
              <div className="w-6 h-6 border-4 border-t-white border-white/30 rounded-full animate-spin"></div>
              데이터를 불러오는 중...
            </div>
          ) : isError ? (
             <div className="flex items-center gap-3 text-rose-200 bg-rose-900/30 p-4 rounded-xl border border-rose-500/50">
               <AlertCircle className="w-6 h-6" />
               <p className="font-bold text-sm">통계 불러오기 실패: {error.message}</p>
             </div>
          ) : (
            <React.Fragment>
              <div>
                <p className="text-primary-100 font-semibold text-sm md:text-base mb-1 text-blue-200">현재 선수 인원</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-4xl md:text-5xl font-bold">총 {total}명</h2>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="bg-white/15 backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-2 border border-white/10">
                  <span className="text-xl">👦</span>
                  <span className="font-bold text-lg">남 ( {boys} )명</span>
                </div>
                <div className="bg-accent-pink/20 backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-2 border border-accent-pink/20">
                  <span className="text-xl">👧</span>
                  <span className="font-bold text-lg">여 ( {girls} )명</span>
                </div>
              </div>
            </React.Fragment>
          )}
        </div>
      </div>

      {/* Placeholders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Training */}
        <div className="bg-white rounded-3xl p-6 border-2 border-secondary/20 shadow-sm flex flex-col items-center justify-center min-h-[280px] text-center group hover:border-secondary transition-colors cursor-pointer">
          <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <CalendarDays className="w-8 h-8 text-secondary-hover" />
          </div>
          <h3 className="font-bold text-lg text-accent-navy mb-2">오늘의 훈련 일정</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-[200px]">등록된 오늘의 훈련 일정이 없습니다. 새로운 훈련을 계획해보세요!</p>
          <button className="flex items-center gap-2 text-primary font-bold bg-primary/5 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors">
            일정 추가하기 <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Recent Notices */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-accent-navy flex items-center gap-2">
              <Bell className="w-5 h-5 text-secondary-hover" /> 최근 공지
            </h3>
            <button className="text-sm font-semibold text-slate-400 hover:text-primary transition-colors">전체보기</button>
          </div>
          
          <div className="space-y-3 flex-1">
            {[
              { tag: '공지', title: '5월 주말 훈련 일정 안내', date: '2026.05.04' },
              { tag: '대회', title: '제 15회 교육감배 수영대회 참가 신청', date: '2026.05.02', isPink: true },
              { tag: '훈련', title: '실내수영장 보수공사로 인한 장소 변경', date: '2026.04.28' }
            ].map((notice, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${notice.isPink ? 'bg-accent-pink/10 text-rose-500' : 'bg-secondary/15 text-primary'}`}>
                  {notice.tag}
                </div>
                <div className="flex-1 truncate font-semibold text-slate-700 text-sm">
                  {notice.title}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {notice.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
