'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { CalendarDays, MapPin, CheckSquare, X, ChevronRight } from 'lucide-react'
import { differenceInDays } from 'date-fns'

interface ChecklistItem {
  id: string;
  label: string;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'swimsuit', label: '수영복 / 시합복' },
  { id: 'caps', label: '수모 (팀 수모 및 여분)' },
  { id: 'goggles', label: '수경 (시합용 및 여분)' },
  { id: 'towels', label: '수건 (건식 및 습식 수건)' },
  { id: 'warmclothes', label: '여벌 옷 및 보온용 겉옷 (수영장 대기용)' },
  { id: 'foamroller', label: '폼롤러 및 스트레칭 밴드' },
  { id: 'snacks', label: '개인 간식 및 생수/스포츠 음료' },
  { id: 'slippers', label: '슬리퍼' },
  { id: 'bag', label: '방수 가방' },
]

export function UpcomingCompetition() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  const { data: upcomingCompetition, isPending } = useQuery({
    queryKey: ['upcoming_competition'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('type', 'competition')
        .eq('is_deleted', false)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(1)
        .single()
      
      // single() throws error if no rows found
      if (error && error.code !== 'PGRST116') throw error
      return data || null
    }
  })

  useEffect(() => {
    if (upcomingCompetition && isModalOpen) {
      const saved = localStorage.getItem(`checklist_${upcomingCompetition.id}`)
      if (saved) {
        setCheckedItems(JSON.parse(saved))
      }
    }
  }, [upcomingCompetition, isModalOpen])

  const toggleCheck = (id: string) => {
    const newChecked = { ...checkedItems, [id]: !checkedItems[id] }
    setCheckedItems(newChecked)
    if (upcomingCompetition) {
      localStorage.setItem(`checklist_${upcomingCompetition.id}`, JSON.stringify(newChecked))
    }
  }

  if (isPending || !upcomingCompetition) return null

  const compDate = new Date(upcomingCompetition.date)
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  compDate.setHours(0, 0, 0, 0)
  
  const dDay = differenceInDays(compDate, todayDate)
  const dDayText = dDay === 0 ? 'D-Day' : `D-${dDay}`

  const checkedCount = Object.values(checkedItems).filter(Boolean).length
  const totalCount = DEFAULT_CHECKLIST.length
  const progressPercent = Math.round((checkedCount / totalCount) * 100) || 0

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-[32px] p-[3px] shadow-lg shadow-rose-500/20 cursor-pointer transform transition-all hover:-translate-y-1 hover:shadow-rose-500/40 group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="bg-white/10 backdrop-blur-md rounded-[29px] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/20 relative z-10">
          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
            <div className="bg-white text-rose-600 font-black text-2xl sm:text-3xl px-4 py-2 rounded-2xl shadow-inner shrink-0">
              {dDayText}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-rose-100 font-bold text-sm mb-1 line-clamp-1">{upcomingCompetition.location || '장소 미정'}</p>
              <h3 className="text-white font-black text-lg sm:text-xl line-clamp-1 group-hover:underline underline-offset-4 decoration-2">
                {upcomingCompetition.title}
              </h3>
            </div>
          </div>
          
          <button className="flex items-center gap-2 bg-white text-rose-600 font-bold px-5 py-3 rounded-full text-sm shrink-0 w-full sm:w-auto justify-center shadow-md hover:bg-rose-50 transition-colors">
            <CheckSquare className="w-4 h-4" />
            <span>필수 준비물 체크</span>
            <ChevronRight className="w-4 h-4 text-rose-300" />
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl sm:rounded-t-3xl">
              <div>
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <CheckSquare className="w-6 h-6 text-primary" /> 대회 준비물 체크리스트
                </h2>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  {upcomingCompetition.title} ({dDayText})
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="px-6 py-4 bg-white border-b border-slate-100">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-600">준비 진행률</span>
                <span className="text-primary">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-primary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <div className="space-y-3">
                {DEFAULT_CHECKLIST.map((item) => (
                  <label 
                    key={item.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      checkedItems[item.id] 
                        ? 'border-primary/30 bg-blue-50/50 text-slate-800' 
                        : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors shrink-0 ${
                      checkedItems[item.id]
                        ? 'border-primary bg-primary'
                        : 'border-slate-300'
                    }`}>
                      {checkedItems[item.id] && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={`font-bold ${checkedItems[item.id] ? 'line-through decoration-primary/30 text-slate-400' : ''}`}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-sm font-bold text-amber-800 mb-1">💡 코치님 전달사항</p>
                <p className="text-sm text-amber-700">위 체크리스트는 대회 출전을 위한 필수 기본 장비입니다. 날씨나 경기장 환경에 따라 추가 보온 용품을 챙겨주세요!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
