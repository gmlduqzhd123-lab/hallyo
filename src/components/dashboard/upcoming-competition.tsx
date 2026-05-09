'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { CalendarDays, MapPin, CheckSquare, X, ChevronRight, Edit2, Plus, Trash2, Save } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import { updateCompetitionChecklist } from '@/app/actions/settings'
import { toast } from 'sonner'

interface ChecklistItem {
  id: string;
  label: string;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'swimsuit', label: '수영복 일체(수영복, 수모, 수경, 수영가방 등등)' },
  { id: 'clothes', label: '갈아입을 옷(속옷 포함)' },
  { id: 'shoes', label: '운동화' },
  { id: 'slippers', label: '슬리퍼(혹은 크록스)' },
  { id: 'light_padding', label: '경량 패딩' },
  { id: 'short_padding', label: '짧은 패딩 혹은 바람막이' },
  { id: 'pajamas', label: '잠옷' },
  { id: 'medicine', label: '개별 상비약' },
  { id: 'toiletries', label: '세면도구' },
  { id: 'hairpin', label: '머리핀(여학생)' },
  { id: 'mask_umbrella', label: '마스크(필요시) 경량 우산 등' },
  { id: 'nametag', label: '※학생 가방(캐리어 포함)에 네임택 반드시 달아오기' },
]

export function UpcomingCompetition() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [isEditing, setIsEditing] = useState(false)
  const [editChecklist, setEditChecklist] = useState<ChecklistItem[]>([])
  
  const supabase = createClient()
  const queryClient = useQueryClient()

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
      
      if (error && error.code !== 'PGRST116') throw error
      return data || null
    }
  })

  // Fetch role
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
  
  const canEdit = ['admin', 'developer', 'coach'].includes(userRole as string)

  // Fetch checklist from settings
  const { data: dynamicChecklist } = useQuery({
    queryKey: ['competition_checklist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'competition_checklist')
        .single()
      if (error || !data?.value) return DEFAULT_CHECKLIST
      return JSON.parse(data.value) as ChecklistItem[]
    }
  })

  const checklistToUse = dynamicChecklist || DEFAULT_CHECKLIST

  // Update Mutation
  const saveChecklistMutation = useMutation({
    mutationFn: async (items: ChecklistItem[]) => {
      const result = await updateCompetitionChecklist(items)
      if (result.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('체크리스트가 업데이트되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['competition_checklist'] })
      setIsEditing(false)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const startEditing = () => {
    setEditChecklist(checklistToUse)
    setIsEditing(true)
  }

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
  const totalCount = checklistToUse.length
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
              <p className="text-rose-100 font-bold text-sm mb-1 break-keep leading-snug">{upcomingCompetition.location || '장소 미정'}</p>
              <h3 className="text-white font-black text-lg sm:text-xl break-keep leading-snug group-hover:underline underline-offset-4 decoration-2">
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
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-slate-500 font-medium">
                    {upcomingCompetition.title} ({dDayText})
                  </p>
                  {canEdit && !isEditing && (
                    <button onClick={startEditing} className="text-primary font-bold flex items-center gap-1 hover:text-primary-hover px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" /> 수정
                    </button>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full transition-colors self-start mt-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {!isEditing && (
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
            )}

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  {editChecklist.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2">
                       <input 
                         className="flex-1 p-3 rounded-xl border border-slate-200 outline-none focus:border-primary text-sm font-bold text-slate-700"
                         value={item.label}
                         onChange={(e) => {
                           const newArr = [...editChecklist]
                           newArr[index].label = e.target.value
                           setEditChecklist(newArr)
                         }}
                       />
                       <button onClick={() => setEditChecklist(editChecklist.filter(i => i.id !== item.id))} className="p-3 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors">
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => setEditChecklist([...editChecklist, { id: Date.now().toString(), label: '' }])}
                    className="w-full p-3 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> 항목 추가
                  </button>
                  <div className="flex gap-2 pt-4">
                    <button onClick={() => setIsEditing(false)} className="flex-1 p-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                      취소
                    </button>
                    <button onClick={() => saveChecklistMutation.mutate(editChecklist)} disabled={saveChecklistMutation.isPending} className="flex-1 p-3 bg-primary text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-primary-hover transition-colors disabled:opacity-50">
                      <Save className="w-5 h-5" /> 저장
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {checklistToUse.map((item) => (
                      <label 
                        key={item.id}
                        onClick={() => toggleCheck(item.id)}
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
                        <span className={`font-bold leading-snug ${checkedItems[item.id] ? 'line-through decoration-primary/30 text-slate-400' : ''}`}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-sm font-bold text-amber-800 mb-1">💡 코치님 전달사항</p>
                    <p className="text-sm text-amber-700">위 체크리스트는 대회 출전을 위한 필수 기본 장비입니다. 날씨나 경기장 환경에 따라 추가 보온 용품을 챙겨주세요!</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
