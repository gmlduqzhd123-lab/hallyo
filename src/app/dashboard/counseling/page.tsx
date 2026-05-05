'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addCounselingLog, softDeleteCounselingLog } from '@/app/actions/counseling'
import { toast } from 'sonner'
import { format } from 'date-fns'

const schema = z.object({
  athlete_id: z.string().min(1, '선수를 선택해주세요.'),
  date: z.string().min(10, '날짜를 선택해주세요.'),
  summary: z.string().min(2, '상담 내용을 입력해주세요.'),
})

type FormValues = z.infer<typeof schema>

export default function CounselingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: athletes } = useQuery({
    queryKey: ['athletes'],
    queryFn: async () => {
      const { data } = await supabase.from('athletes').select('id, name').eq('is_deleted', false)
      return data || []
    }
  })

  const { data: logs, isPending } = useQuery({
    queryKey: ['counseling_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('counseling_logs')
        .select('*, athletes(name), users(name)')
        .eq('is_deleted', false)
        .order('date', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd')
    }
  })

  const addMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const formData = new FormData()
      formData.append('athlete_id', data.athlete_id)
      formData.append('date', data.date)
      formData.append('summary', data.summary)
      const result = await addCounselingLog(formData)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('상담 일지가 등록되었습니다.', { style: { background: '#0047AB', color: 'white' } })
      queryClient.invalidateQueries({ queryKey: ['counseling_logs'] })
      reset()
      setIsModalOpen(false)
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await softDeleteCounselingLog(id)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('상담 일지가 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['counseling_logs'] })
    }
  })

  const onSubmit = (data: FormValues) => {
    addMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-secondary/20 text-primary rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-accent-navy">상담 일지</h1>
            <p className="text-sm text-slate-500 font-medium">선수별 개별 상담 내역을 관리하세요.</p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/30"
        >
          <Plus className="w-5 h-5" />
          새 일지 작성
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isPending ? (
          <div className="col-span-full py-12 text-center text-slate-400">불러오는 중...</div>
        ) : logs?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-medium">등록된 상담 일지가 없습니다.</div>
        ) : (
          logs?.map((log: any) => (
            <div key={log.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-secondary/10 text-primary px-3 py-1 rounded-lg text-sm font-bold">
                    {log.athletes?.name} 선수
                  </div>
                  <span className="text-sm text-slate-400 font-medium">{log.date}</span>
                </div>
                <p className="text-slate-600 font-medium whitespace-pre-wrap">{log.summary}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                <span className="text-xs text-slate-400">작성자: {log.users?.name}</span>
                <button 
                  onClick={() => { if(confirm('정말 삭제하시겠습니까?')) deleteMutation.mutate(log.id) }}
                  className="text-rose-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="상담 일지 작성">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">상담 대상 선수</label>
            <select {...register('athlete_id')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50">
              <option value="">선수를 선택하세요</option>
              {athletes?.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {errors.athlete_id && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.athlete_id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">상담 날짜</label>
            <input type="date" {...register('date')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" />
            {errors.date && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.date.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">상담 내용</label>
            <textarea {...register('summary')} rows={5} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 resize-none" placeholder="면담 내용 및 특이사항" />
            {errors.summary && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.summary.message}</p>}
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">취소</button>
            <button type="submit" disabled={addMutation.isPending} className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/30">저장하기</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
