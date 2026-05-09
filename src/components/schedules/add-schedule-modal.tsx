'use client'

import { Modal } from '@/components/ui/modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addSchedule, updateSchedule } from '@/app/actions/schedules'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

const scheduleSchema = z.object({
  type: z.enum(['training', 'competition'], { message: '일정 구분을 선택해주세요.' }),
  title: z.string().min(2, '제목은 2자 이상 입력해주세요.'),
  date: z.string().min(10, '올바른 날짜를 선택해주세요.'),
  description: z.string().optional(),
  location: z.string().optional(),
})

type ScheduleFormValues = z.infer<typeof scheduleSchema>

interface Props {
  isOpen: boolean
  onClose: () => void
  initialDate?: Date
  initialData?: any
}

export function AddScheduleModal({ isOpen, onClose, initialDate, initialData }: Props) {
  const queryClient = useQueryClient()
  
  const formattedDate = initialDate 
    ? `${initialDate.getFullYear()}-${String(initialDate.getMonth() + 1).padStart(2, '0')}-${String(initialDate.getDate()).padStart(2, '0')}`
    : ''

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      type: 'training',
      date: formattedDate
    }
  })

  useEffect(() => {
    if (initialData) {
      setValue('type', initialData.type)
      setValue('title', initialData.title)
      setValue('date', initialData.date)
      setValue('location', initialData.location || '')
      setValue('description', initialData.description || '')
    } else {
      reset({ type: 'training', date: formattedDate })
    }
  }, [initialData, formattedDate, setValue, reset])

  const mutation = useMutation({
    mutationFn: async (data: ScheduleFormValues) => {
      const formData = new FormData()
      formData.append('type', data.type)
      formData.append('title', data.title)
      formData.append('date', data.date)
      if (data.description) formData.append('description', data.description)
      if (data.location) formData.append('location', data.location)
      
      if (initialData) {
        const result = await updateSchedule(initialData.id, formData)
        if (result?.error) throw new Error(result.error)
        return result
      } else {
        const result = await addSchedule(formData)
        if (result?.error) throw new Error(result.error)
        return result
      }
    },
    onSuccess: () => {
      toast.success(initialData ? '일정이 성공적으로 수정되었습니다.' : '일정이 성공적으로 등록되었습니다.', {
        style: { background: '#0047AB', color: 'white', border: 'none' }
      })
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
      reset()
      onClose()
    },
    onError: (err: Error) => {
      toast.error(err.message, {
        style: { background: '#FFE4E6', color: '#E11D48', border: 'none' }
      })
    }
  })

  const onSubmit = (data: ScheduleFormValues) => {
    mutation.mutate(data)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "일정 수정" : "새로운 일정 등록"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">일정 구분</label>
            <select 
              {...register('type')}
              className={`w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none ${errors.type ? 'border-rose-300' : 'border-slate-200'}`}
            >
              <option value="training">훈련 일정</option>
              <option value="competition">대회 일정</option>
            </select>
            {errors.type && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.type.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">날짜</label>
            <input 
              type="date"
              {...register('date')}
              className={`w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium ${errors.date ? 'border-rose-300' : 'border-slate-200'}`}
            />
            {errors.date && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.date.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-accent-navy mb-1">일정 제목</label>
          <input 
            {...register('title')}
            className={`w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium ${errors.title ? 'border-rose-300' : 'border-slate-200'}`}
            placeholder="예: 하계 집중 훈련"
          />
          {errors.title && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-bold text-accent-navy mb-1">장소 (선택)</label>
          <input 
            {...register('location')}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            placeholder="예: 진남수영장"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-accent-navy mb-1">상세 내용 (선택)</label>
          <textarea 
            {...register('description')}
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
            placeholder="추가 전달사항이나 훈련 목표를 입력하세요"
          />
        </div>

        <div className="pt-4 flex gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            취소
          </button>
          <button 
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-primary hover:bg-primary-hover transition-colors shadow-lg shadow-primary/30 disabled:opacity-50"
          >
            {mutation.isPending ? '저장 중...' : (initialData ? '일정 수정' : '일정 등록')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
