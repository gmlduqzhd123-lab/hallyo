'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { History, Plus, Edit2, Trash2, AlertCircle, X, Save, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { addHistory, updateHistory, deleteHistory } from '@/app/actions/history'

interface HistoryRecord {
  id: string
  date: string
  title: string
  description?: string
}

export default function HistoryPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<HistoryRecord | null>(null)
  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data: histories, isPending, isError, error } = useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('is_deleted', false)
        .order('date', { ascending: false })
      if (error) throw new Error(error.message)
      return data as HistoryRecord[]
    }
  })

  const { data: userRole } = useQuery({
    queryKey: ['user_role'],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return null
      const { data } = await supabase.from('users').select('role').eq('id', authData.user.id).single()
      return data?.role
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteHistory(id)
      if (res?.error) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      toast.success('연혁이 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['history'] })
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const handleDelete = (id: string) => {
    if (confirm('이 연혁을 삭제하시겠습니까?')) {
      deleteMutation.mutate(id)
    }
  }

  // Add/Edit Form
  const HistoryForm = ({ initialData, onClose }: { initialData?: HistoryRecord | null, onClose: () => void }) => {
    const isEdit = !!initialData
    const actionMutation = useMutation({
      mutationFn: async (formData: FormData) => {
        const res = isEdit ? await updateHistory(initialData.id, formData) : await addHistory(formData)
        if (res?.error) throw new Error(res.error)
        return res
      },
      onSuccess: () => {
        toast.success(isEdit ? '연혁이 수정되었습니다.' : '새 연혁이 추가되었습니다.')
        queryClient.invalidateQueries({ queryKey: ['history'] })
        onClose()
      },
      onError: (err: Error) => toast.error(err.message)
    })

    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-xl font-bold text-accent-navy flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              {isEdit ? '연혁 수정' : '새 연혁 추가'}
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form action={(formData) => actionMutation.mutate(formData)} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">날짜</label>
              <input type="date" name="date" required defaultValue={initialData?.date || ''} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-medium text-slate-700" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">연혁 내용 (제목)</label>
              <input type="text" name="title" required placeholder="예: 제 52회 전국소년체육대회 종합 우승" defaultValue={initialData?.title || ''} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-medium text-slate-700" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">상세 설명 (선택)</label>
              <textarea name="description" rows={3} placeholder="추가적인 설명이나 성과를 적어주세요." defaultValue={initialData?.description || ''} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm text-slate-700 resize-none"></textarea>
            </div>
            
            <div className="pt-4 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-3 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">취소</button>
              <button type="submit" disabled={actionMutation.isPending} className="flex-1 px-4 py-3 rounded-2xl font-bold text-white bg-primary hover:bg-primary-hover transition-colors shadow-lg shadow-primary/30 flex justify-center items-center gap-2 disabled:opacity-50">
                <Save className="w-4 h-4" /> {actionMutation.isPending ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500 flex items-center gap-2">
            <History className="w-8 h-8 text-orange-500" /> 수영부 연혁
          </h1>
          <p className="text-slate-500 mt-1 font-medium">여수한려초등학교 수영부의 자랑스러운 발자취입니다. 🏆</p>
        </div>

        {['admin', 'developer'].includes(userRole) && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/30 flex items-center gap-2 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            새 연혁 추가
          </button>
        )}
      </div>

      {isPending ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-t-orange-500 border-orange-200 rounded-full animate-spin"></div>
        </div>
      ) : isError ? (
         <div className="flex items-center justify-center gap-3 text-rose-500 bg-rose-50 p-6 rounded-3xl border border-rose-100">
           <AlertCircle className="w-6 h-6" />
           <p className="font-bold">연혁을 불러오는 중 오류가 발생했습니다: {error.message}</p>
         </div>
      ) : histories?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <History className="w-16 h-16 mb-4 opacity-20" />
          <p className="font-bold text-lg">아직 등록된 연혁이 없습니다.</p>
          <p className="text-sm mt-2">새로운 역사를 기록해보세요!</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
          {/* Vertical line for timeline */}
          <div className="absolute left-8 md:left-[160px] top-12 bottom-12 w-0.5 bg-gradient-to-b from-orange-100 via-orange-200 to-amber-100"></div>
          
          <div className="space-y-8">
            {histories?.map((history) => {
              const year = new Date(history.date).getFullYear()
              const monthDate = new Date(history.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
              
              return (
                <div key={history.id} className="relative flex flex-col md:flex-row gap-4 md:gap-8 group">
                  {/* Date section */}
                  <div className="md:w-[120px] shrink-0 pt-1 relative z-10 md:text-right pl-10 md:pl-0">
                    <div className="absolute left-[-31px] md:left-auto md:right-[-41px] top-2 w-4 h-4 rounded-full bg-white border-4 border-orange-400 shadow-[0_0_0_4px_rgba(251,146,60,0.1)] group-hover:scale-125 transition-transform duration-300"></div>
                    <div className="font-black text-xl text-orange-500">{year}</div>
                    <div className="text-sm font-bold text-slate-400">{monthDate}</div>
                  </div>
                  
                  {/* Content section */}
                  <div className="flex-1 bg-slate-50/50 group-hover:bg-orange-50/30 p-5 rounded-2xl border border-slate-100 group-hover:border-orange-200 transition-colors ml-10 md:ml-0 relative">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{history.title}</h3>
                    {history.description && (
                      <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{history.description}</p>
                    )}
                    
                    {['admin', 'developer'].includes(userRole) && (
                      <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                        <button 
                          onClick={() => setEditingItem(history)}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(history.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {isAddModalOpen && <HistoryForm onClose={() => setIsAddModalOpen(false)} />}
      {editingItem && <HistoryForm initialData={editingItem} onClose={() => setEditingItem(null)} />}
    </div>
  )
}
