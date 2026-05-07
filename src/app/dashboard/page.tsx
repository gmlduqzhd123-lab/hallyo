'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import React, { useState, useEffect } from 'react'
import { CalendarDays, ChevronRight, Bell, AlertCircle, Quote, BookOpen, Download } from 'lucide-react'
import Link from 'next/link'
import { quotes } from '@/lib/quotes'
import { poems } from '@/data/poems'

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

// Fetch recent notices
async function fetchRecentNotices() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notices')
    .select('id, title, created_at')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export default function DashboardPage() {
  const supabase = createClient()
  
  const { data: userRole } = useQuery({
    queryKey: ['user_role'],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return null
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single()
        
      if (error) return null
      return data.role
    }
  })
  
  const isAuthorized = userRole === 'admin' || userRole === 'coach'

  const { data: athletes, isPending, isError, error } = useQuery({
    queryKey: ['athletes', 'active'],
    queryFn: fetchActiveAthletes,
  })

  const { data: notices, isPending: noticesPending } = useQuery({
    queryKey: ['notices', 'recent'],
    queryFn: fetchRecentNotices,
  })

  const [quote, setQuote] = useState<string>('')
  const [poem, setPoem] = useState<{title: string, page: string, content: string} | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]
    setQuote(randomQuote)
    
    const randomPoem = poems[Math.floor(Math.random() * poems.length)]
    setPoem(randomPoem)

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      alert('현재 브라우저에서는 자동 설치를 지원하지 않습니다.\n\n스마트폰의 공유 메뉴(또는 메뉴 버튼)에서 [홈 화면에 추가]를 선택해 설치해 주세요! 📱✨')
      return
    }
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('App installed')
    }
    setDeferredPrompt(null)
  }

  // Calculations for stats
  const total = athletes?.length || 0
  const boys = athletes?.filter(a => a.gender === 'M').length || 0
  const girls = athletes?.filter(a => a.gender === 'F').length || 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">홈 ✨</h1>
          <p className="text-slate-500 mt-1 font-medium text-sm sm:text-base break-keep">여수한려초 수영부에 오신 것을 환영합니다! 🐬</p>
        </div>

        {/* 앱 설치 버튼 */}
        <button 
          onClick={handleInstallApp}
          className="flex-shrink-0 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white w-auto px-5 py-3 sm:px-4 sm:py-2 rounded-2xl sm:rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1 active:scale-95"
        >
          <Download className="w-5 h-5 sm:w-4 sm:h-4" />
          <span>앱 설치</span>
        </button>
      </div>

      {/* Stats Widget */}
      <div className="bg-gradient-to-br from-sky-400 via-blue-400 to-indigo-500 rounded-[32px] p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-blue-500/20 min-h-[160px] border border-white/20">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-sky-300/30 rounded-full blur-2xl translate-y-1/2"></div>
        <div className="absolute top-10 left-1/2 w-20 h-20 bg-pink-300/30 rounded-full blur-xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 h-full">
          {isPending ? (
            <div className="flex items-center gap-3 animate-pulse text-blue-100 font-bold">
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
                <p className="text-white/80 font-bold text-sm md:text-base mb-1 tracking-wide">우리 수영부 요정들 🧚‍♀️</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-5xl md:text-6xl font-black drop-shadow-md">총 {total}명</h2>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-2 border border-white/20 shadow-lg shadow-black/5">
                  <span className="text-2xl drop-shadow-sm">👦</span>
                  <span className="font-bold text-lg text-white whitespace-nowrap">남 ( {boys} )명</span>
                </div>
                <div className="bg-pink-400/30 hover:bg-pink-400/40 transition-colors backdrop-blur-md px-5 py-3 rounded-2xl flex items-center gap-2 border border-pink-300/30 shadow-lg shadow-black/5">
                  <span className="text-2xl drop-shadow-sm">👧</span>
                  <span className="font-bold text-lg text-white whitespace-nowrap">여 ( {girls} )명</span>
                </div>
              </div>
            </React.Fragment>
          )}
        </div>
      </div>

      {/* Random Quote Widget */}
      <div className={`transition-all duration-700 transform ${quote ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {quote && (
          <div className="bg-gradient-to-r from-amber-200 via-orange-200 to-rose-200 rounded-[32px] p-[3px] shadow-lg shadow-orange-500/10">
            <div className="bg-white/90 backdrop-blur-sm rounded-[29px] p-6 md:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden h-full border border-white">
              <div className="absolute top-4 left-6 text-orange-200 opacity-60">
                <Quote className="w-16 h-16" fill="currentColor" />
              </div>
              <p className="relative z-10 text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500 leading-relaxed px-4 md:px-12 py-4 drop-shadow-sm">
                "{quote}"
              </p>
              <div className="relative z-10 flex flex-col items-center gap-1 mt-2">
                <p className="text-sm font-bold text-orange-400/80 tracking-widest uppercase">
                  오늘의 긍정 에너지 ✨
                </p>
                <button 
                  onClick={() => setQuote(quotes[Math.floor(Math.random() * quotes.length)])}
                  className="text-xs text-orange-500 hover:text-white font-bold mt-2 px-4 py-1.5 bg-orange-50 hover:bg-gradient-to-r hover:from-orange-400 hover:to-rose-400 rounded-full transition-all duration-300 shadow-sm"
                >
                  다른 명언 보기 🎯
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Placeholders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Training */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-[32px] p-8 border border-teal-100/50 shadow-sm shadow-teal-500/5 flex flex-col items-center justify-center min-h-[280px] text-center group hover:shadow-md hover:shadow-teal-500/10 transition-all cursor-pointer relative overflow-hidden">
          <div className="absolute -top-10 -right-10 text-teal-500/5 text-[120px] font-black pointer-events-none transform rotate-12">🏊‍♂️</div>
          <Link href="/dashboard/training" className="w-20 h-20 bg-white rounded-[24px] shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10">
            <CalendarDays className="w-10 h-10 text-teal-500" />
          </Link>
          <h3 className="font-extrabold text-xl text-teal-900 mb-3 relative z-10">오늘의 훈련 일정</h3>
          <p className="text-teal-700/70 text-sm mb-8 max-w-[220px] font-medium leading-relaxed relative z-10">등록된 훈련 일정이 없어요.<br/>새로운 훈련을 계획해볼까요? 🌱</p>
          {isAuthorized && (
            <Link href="/dashboard/training" className="relative z-10 inline-flex items-center gap-2 text-white font-bold bg-teal-500 px-6 py-3 rounded-full hover:bg-teal-600 hover:-translate-y-1 transition-all shadow-md shadow-teal-500/30">
              일정 추가하기 <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Recent Notices */}
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-[32px] p-8 border border-indigo-100/50 shadow-sm shadow-indigo-500/5 flex flex-col relative overflow-hidden">
          <div className="absolute -bottom-10 -left-10 text-indigo-500/5 text-[120px] font-black pointer-events-none transform -rotate-12">📢</div>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="font-extrabold text-xl text-indigo-900 flex items-center gap-2">
              <span className="bg-white p-2 rounded-xl shadow-sm text-indigo-500"><Bell className="w-5 h-5" /></span>
              최근 소식
            </h3>
            <Link href="/dashboard/notices" className="text-sm font-bold text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100/50 px-3 py-1.5 rounded-full transition-colors">더보기</Link>
          </div>
          
          <div className="space-y-3 flex-1 relative z-10">
            {noticesPending ? (
              <div className="flex justify-center items-center h-full min-h-[100px]">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
            ) : !notices || notices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-indigo-300">
                <Bell className="w-10 h-10 mb-3 opacity-30 drop-shadow-sm" />
                <p className="text-sm font-bold">새로운 소식이 아직 없어요 💭</p>
              </div>
            ) : (
              notices.map((notice) => {
                const isTournament = notice.title.includes('대회')
                const isTraining = notice.title.includes('훈련')
                const tag = isTournament ? '대회 🏆' : (isTraining ? '훈련 🏊‍♂️' : '공지 📢')
                const tagColor = isTournament ? 'bg-rose-100 text-rose-600' : (isTraining ? 'bg-sky-100 text-sky-600' : 'bg-indigo-100 text-indigo-600')

                return (
                  <Link href={`/dashboard/notices#${notice.id}`} key={notice.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-white/60 hover:bg-white rounded-2xl cursor-pointer transition-all border border-white shadow-sm hover:shadow-md hover:-translate-y-0.5 group">
                    <div className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-black ${tagColor} shadow-sm group-hover:scale-105 transition-transform`}>
                      {tag}
                    </div>
                    <div className="flex-1 truncate font-bold text-slate-700 text-sm group-hover:text-indigo-900 transition-colors">
                      {notice.title}
                    </div>
                    <div className="text-xs text-indigo-400/80 font-bold shrink-0">
                      {new Date(notice.created_at).toLocaleDateString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit' }).replace(new RegExp('\\\\.$'), '')}
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Voice of Mind - Poems */}
      {poem && (
        <div className="bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-[32px] p-6 md:p-8 border border-fuchsia-100/50 shadow-sm shadow-fuchsia-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="font-extrabold text-xl md:text-2xl text-fuchsia-900 flex items-center gap-3">
              <span className="bg-white p-2.5 rounded-xl shadow-sm text-fuchsia-500">
                <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
              </span>
              <a 
                href="https://www.yes24.com/product/goods/154230919" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-fuchsia-600 hover:underline underline-offset-4 decoration-fuchsia-300 transition-all"
              >
                마음의 목소리(숨결처럼 너를 지나, 달디단) 🌸
              </a>
            </h3>
            <button 
              onClick={() => setPoem(poems[Math.floor(Math.random() * poems.length)])}
              className="text-xs md:text-sm font-bold text-fuchsia-500 hover:text-white bg-white hover:bg-fuchsia-400 px-4 py-2 rounded-full transition-all shadow-sm flex items-center gap-2 border border-fuchsia-100"
            >
              다른 시 읽기 📖
            </button>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 md:p-10 border border-white shadow-inner relative z-10">
            <div className="flex flex-col items-center text-center">
              <h4 className="text-xl md:text-2xl font-black text-slate-800 mb-2">{poem.title}</h4>
              <p className="text-xs md:text-sm font-bold text-fuchsia-400 mb-8">{poem.page}</p>
              
              <div className="text-base md:text-lg text-slate-700 leading-[2.2] font-medium whitespace-pre-wrap max-w-2xl text-center">
                {poem.content}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
