'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { addRecord } from '@/app/actions/records'
import { toast } from 'sonner'
import { parseTimeInput } from '@/utils/time'

const recordSchema = z.object({
  event_name: z.string().min(1, '종목을 선택해주세요.'),
  record_time: z.string().min(1, '기록을 입력해주세요.'),
  record_date: z.string().min(10, '기록일을 선택해주세요.'),
  match_type: z.string().optional().nullable(),
  rank: z.string().optional().nullable(),
  schedule_id: z.string().optional().nullable(),
})

type FormValues = z.infer<typeof recordSchema>

const EVENT_OPTIONS = [
  { key: '자유형50M', label: '자유형 50M' },
  { key: '자유형100M', label: '자유형 100M' },
  { key: '자유형200M', label: '자유형 200M' },
  { key: '배영50M', label: '배영 50M' },
  { key: '평영50M', label: '평영 50M' },
  { key: '평영100M', label: '평영 100M' },
  { key: '접영50M', label: '접영 50M' },
  { key: '접영100M', label: '접영 100M' },
]

export default function AddAthleteRecord({ athleteId, userRole, schedules }: { athleteId: string, userRole: string, schedules: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const canEdit = ['admin', 'developer'].includes(userRole) || userRole === 'coach'

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      record_date: new Date().toISOString().split('T')[0]
    }
  })

  const addMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const formData = new FormData()
      formData.append('athlete_id', athleteId)
      formData.append('event_name', data.event_name)
      formData.append('record_time', parseTimeInput(data.record_time).toString())
      formData.append('record_date', data.record_date)
      if (data.match_type) formData.append('match_type', data.match_type)
      if (data.rank) formData.append('rank', data.rank)
      if (data.schedule_id) formData.append('schedule_id', data.schedule_id)
      
      const result = await addRecord(formData)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('기록이 추가되었습니다.')
      setIsOpen(false)
      reset()
      window.location.reload()
    },
    onError: (err: Error) => toast.error(err.message)
  })

  if (!canEdit) return null

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        기록 추가
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="새 기록 추가">
        <form onSubmit={handleSubmit((d) => addMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">대회 일정 <span className="text-slate-400 text-xs font-normal ml-1">(선택)</span></label>
              <select {...register('schedule_id')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50">
                <option value="">선택 안함</option>
                {schedules.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">종목</label>
              <select {...register('event_name')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50">
                <option value="">종목 선택</option>
                {EVENT_OPTIONS.map(opt => (
                  <option key={opt.key} value={opt.label}>{opt.label}</option>
                ))}
              </select>
              {errors.event_name && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.event_name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">기록 (초)</label>
              <input 
                type="text" 
                {...register('record_time')} 
                className="w-full px-4 py-3 rounded-2xl border bg-slate-50" 
                placeholder="예: 1:02.09 또는 25.43" 
              />
              {errors.record_time && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.record_time.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">기록일</label>
              <input type="date" {...register('record_date')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" />
              {errors.record_date && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.record_date.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">경기 구분 <span className="text-slate-400 text-xs font-normal ml-1">(선택)</span></label>
              <select {...register('match_type')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50">
                <option value="">선택 안함</option>
                <option value="예선">예선</option>
                <option value="결승">결승</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">순위 <span className="text-slate-400 text-xs font-normal ml-1">(선택)</span></label>
              <input type="number" {...register('rank')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" placeholder="예: 1" />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsOpen(false)} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">취소</button>
            <button type="submit" disabled={addMutation.isPending} className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30">저장하기</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
