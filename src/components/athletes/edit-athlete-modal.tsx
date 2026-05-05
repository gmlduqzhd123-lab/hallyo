'use client'

import { Modal } from '@/components/ui/modal'
import { useForm } from 'react-hook-form'
import { updateAthlete } from '@/app/actions/athletes'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Athlete } from '@/components/athletes/data-table'
import { useEffect } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  athlete: Athlete | null
}

export function EditAthleteModal({ isOpen, onClose, athlete }: Props) {
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    if (athlete) {
      reset({
        category: athlete.category || '',
        gender: athlete.gender,
        name: athlete.name,
        hanja_name: athlete.hanja_name || '',
        is_registered: athlete.is_registered ? 'true' : 'false',
        birth_date: athlete.birth_date || '',
        attendance_start_date: athlete.attendance_start_date || '',
        attendance_end_date: athlete.attendance_end_date || '',
        join_date: athlete.join_date || '',
        grade: athlete.grade || '',
        class_number: athlete.class_number || '',
        student_number: athlete.student_number || '',
        homeroom_teacher: athlete.homeroom_teacher || '',
        student_phone: athlete.student_phone || '',
        parent_name: athlete.parent_name || '',
        parent_phone: athlete.parent_phone || '',
      })
    }
  }, [athlete, reset])

  const mutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      if (!athlete) return
      const result = await updateAthlete(athlete.id, data)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('선수 정보가 성공적으로 수정되었습니다.', {
        style: { background: '#0047AB', color: 'white', border: 'none' }
      })
      queryClient.invalidateQueries({ queryKey: ['athletes'] })
      onClose()
    },
    onError: (err: Error) => {
      toast.error(err.message, {
        style: { background: '#FFE4E6', color: '#E11D48', border: 'none' }
      })
    }
  })

  const onSubmit = (data: any) => {
    mutation.mutate(data)
  }

  if (!athlete) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${athlete.name} 선수 정보 수정`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">종별</label>
            <select {...register('category')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none font-medium">
              <option value="">선택</option>
              <option value="남초">남초</option>
              <option value="남유">남유</option>
              <option value="여초">여초</option>
              <option value="여유">여유</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">성별</label>
            <select {...register('gender')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none font-medium border-slate-200">
              <option value="M">남</option>
              <option value="F">여</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">이름</label>
            <input {...register('name')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium border-slate-200" />
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">한자 이름</label>
            <input {...register('hanja_name')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium border-slate-200" />
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">선수 등록 여부</label>
            <select {...register('is_registered')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none font-medium border-slate-200">
              <option value="true">O (등록)</option>
              <option value="false">X (미등록)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">생년 월일</label>
            <input type="date" {...register('birth_date')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium border-slate-200" />
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">재학 기간 (시작일)</label>
            <input type="date" {...register('attendance_start_date')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium border-slate-200" />
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">재학 기간 (종료일)</label>
            <input type="date" {...register('attendance_end_date')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium border-slate-200" />
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">입단 날짜</label>
            <input type="date" {...register('join_date')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium border-slate-200" />
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">학년</label>
            <input type="number" {...register('grade')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium border-slate-200" />
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">반</label>
            <input {...register('class_number')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium border-slate-200" />
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">번호</label>
            <input type="number" {...register('student_number')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium border-slate-200" />
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">담임교사 성명</label>
            <input {...register('homeroom_teacher')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium border-slate-200" />
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">학생 연락처</label>
            <input {...register('student_phone')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium border-slate-200" />
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">학부모 성함</label>
            <input {...register('parent_name')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium border-slate-200" />
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">학부모 연락처</label>
            <input {...register('parent_phone')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium border-slate-200" />
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
            className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
          >
            {mutation.isPending ? '저장 중...' : '수정 저장'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
