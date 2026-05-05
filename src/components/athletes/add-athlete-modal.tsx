'use client'

import { Modal } from '@/components/ui/modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addAthlete } from '@/app/actions/athletes'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const athleteSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상 입력해주세요.'),
  gender: z.enum(['M', 'F']),
  grade: z.coerce.number().min(1, '학년은 1~6 사이여야 합니다.').max(6, '학년은 1~6 사이여야 합니다.'),
  class_number: z.string().optional(),
  homeroom_teacher: z.string().optional(),
  student_phone: z.string().optional(),
  parent_name: z.string().optional(),
  parent_phone: z.string().optional(),
})

type AthleteFormValues = z.infer<typeof athleteSchema>

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function AddAthleteModal({ isOpen, onClose }: Props) {
  const queryClient = useQueryClient()
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AthleteFormValues>({
    // @ts-expect-error: React Hook Form resolver has strict TS mismatch with coerced values
    resolver: zodResolver(athleteSchema)
  })

  const mutation = useMutation({
    mutationFn: async (data: AthleteFormValues) => {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('gender', data.gender)
      formData.append('grade', data.grade.toString())
      if (data.class_number) formData.append('class_number', data.class_number)
      if (data.homeroom_teacher) formData.append('homeroom_teacher', data.homeroom_teacher)
      if (data.student_phone) formData.append('student_phone', data.student_phone)
      if (data.parent_name) formData.append('parent_name', data.parent_name)
      if (data.parent_phone) formData.append('parent_phone', data.parent_phone)
      
      const result = await addAthlete(formData)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('선수가 성공적으로 등록되었습니다.', {
        style: { background: '#0047AB', color: 'white', border: 'none' }
      })
      queryClient.invalidateQueries({ queryKey: ['athletes'] })
      reset()
      onClose()
    },
    onError: (err: Error) => {
      toast.error(err.message, {
        style: { background: '#FFE4E6', color: '#E11D48', border: 'none' }
      })
    }
  })

  const onSubmit = (data: any) => {
    mutation.mutate(data as AthleteFormValues)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새로운 선수 등록">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-accent-navy mb-1">이름</label>
          <input 
            {...register('name')}
            className={`w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium ${errors.name ? 'border-rose-300' : 'border-slate-200'}`}
            placeholder="예: 홍길동"
          />
          {errors.name && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">성별</label>
            <select 
              {...register('gender')}
              className={`w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium appearance-none ${errors.gender ? 'border-rose-300' : 'border-slate-200'}`}
            >
              <option value="">선택</option>
              <option value="M">남 (Boy)</option>
              <option value="F">여 (Girl)</option>
            </select>
            {errors.gender && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.gender.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">학년</label>
            <input 
              type="number"
              {...register('grade')}
              className={`w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium ${errors.grade ? 'border-rose-300' : 'border-slate-200'}`}
              placeholder="1~6"
            />
            {errors.grade && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.grade.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">학급</label>
            <input 
              {...register('class_number')}
              className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium border-slate-200"
              placeholder="예: 3반"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">담임선생님</label>
            <input 
              {...register('homeroom_teacher')}
              className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium border-slate-200"
              placeholder="담임 성함"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">학생 연락처</label>
            <input 
              {...register('student_phone')}
              className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium border-slate-200"
              placeholder="010-0000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">학부모 성함</label>
            <input 
              {...register('parent_name')}
              className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium border-slate-200"
              placeholder="학부모 성함"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-bold text-accent-navy mb-1">학부모 연락처</label>
            <input 
              {...register('parent_phone')}
              className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium border-slate-200"
              placeholder="010-0000-0000"
            />
          </div>
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
            {mutation.isPending ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
