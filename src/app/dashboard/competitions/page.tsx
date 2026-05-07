'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Calendar, Plus, Trash2, MapPin } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addSchedule, softDeleteSchedule } from '@/app/actions/schedules'
import { toast } from 'sonner'
import { format } from 'date-fns'
import Link from 'next/link'

const schema = z.object({
  type: z.literal('competition'),
  title: z.string().min(2, '대회명을 입력해주세요.'),
  date: z.string().min(10, '시작일을 선택해주세요.'),
  end_date: z.string().optional().or(z.literal('')),
  location: z.string().min(2, '장소를 입력해주세요.'),
  description: z.string().optional(),
  participants: z.array(z.string()).optional()
})

type FormValues = z.infer<typeof schema>

export default function CompetitionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: competitions, isPending } = useQuery({
    queryKey: ['competitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*, users(name)')
        .eq('type', 'competition')
        .eq('is_deleted', false)
        .order('date', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const { data: athletes } = useQuery({
    queryKey: ['athletes-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('id, name, grade')
        .eq('is_deleted', false)
        .order('grade', { ascending: false })
        .order('name')
      if (error) throw error
      return data
    }
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'competition' }
  })

  const addMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const formData = new FormData()
      formData.append('type', data.type)
      formData.append('title', data.title)
      formData.append('date', data.date)
      if (data.end_date) formData.append('end_date', data.end_date)
      if (data.location) formData.append('location', data.location)
      if (data.description) formData.append('description', data.description)
      if (data.participants && data.participants.length > 0) {
        formData.append('participants', JSON.stringify(data.participants))
      }
      
      const result = await addSchedule(formData)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('대회 일정이 등록되었습니다.', { style: { background: '#0047AB', color: 'white' } })
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
      queryClient.invalidateQueries({ queryKey: ['schedules'] }) // Also invalidates calendar
      reset()
      setIsModalOpen(false)
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await softDeleteSchedule(id)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('대회 일정이 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
      queryClient.invalidateQueries({ queryKey: ['schedules'] })
    }
  })

  const onSubmit = (data: FormValues) => {
    addMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-100 text-rose-500 rounded-xl shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-accent-navy break-keep">대회 일정</h1>
            <p className="text-sm text-slate-500 font-medium break-keep">참가할 대회의 세부 정보와 기록을 관리하세요.</p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-rose-500/30 shrink-0 whitespace-nowrap w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 shrink-0" />
          새 대회 등록
        </button>
      </div>

      <div className="space-y-4">
        {isPending ? (
          <div className="py-12 text-center text-slate-400">불러오는 중...</div>
        ) : competitions?.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-100">등록된 대회 일정이 없습니다.</div>
        ) : (
          competitions?.map((comp: any) => {
            const endDate = new Date(comp.end_date || comp.date)
            endDate.setHours(23, 59, 59, 999)
            const isExpired = endDate.getTime() < new Date().getTime()
            
            const participantNames = comp.participants
              ?.map((id: string) => athletes?.find((a: any) => a.id === id))
              .filter(Boolean)
              .sort((a: any, b: any) => {
                const gradeA = a.grade || 0
                const gradeB = b.grade || 0
                if (gradeB !== gradeA) return gradeB - gradeA
                return a.name.localeCompare(b.name)
              })
              .map((a: any) => a.grade ? `${a.name}(${a.grade}학년)` : a.name)
              .join(', ')
            
            return (
            <div key={comp.id} className={`bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex gap-2 sm:gap-4 justify-between items-center transition-all group ${isExpired ? 'opacity-50 grayscale hover:opacity-75' : 'hover:shadow-md hover:border-blue-200'}`}>
              <Link href={`/dashboard/competitions/${comp.id}`} className="flex-1 block cursor-pointer min-w-0">
                <div className="flex flex-col xl:flex-row xl:items-center gap-2 xl:gap-3 mb-3">
                  <span className={`w-fit inline-block px-3 py-1.5 rounded-full text-xs font-bold border break-keep ${isExpired ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-rose-100 text-rose-600 border-rose-200'}`}>
                    {format(new Date(comp.date), 'yyyy년 MM월 dd일')}
                    {comp.end_date ? ` ~ ${format(new Date(comp.end_date), 'yyyy년 MM월 dd일')}` : ''}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      window.open(`https://map.naver.com/p/search/${encodeURIComponent(comp.location)}`, '_blank')
                    }}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-blue-500 text-sm font-medium shrink-0 transition-colors z-10 relative"
                    title="네이버 지도로 보기"
                  >
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="break-keep underline-offset-4 hover:underline">{comp.location}</span>
                  </button>
                </div>
                <div className="flex flex-col gap-2 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-accent-navy group-hover:text-blue-600 transition-colors break-keep truncate w-full whitespace-normal line-clamp-2">{comp.title}</h2>
                  {participantNames && (
                    <p className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 break-keep leading-relaxed w-fit mt-1">
                      {participantNames}
                    </p>
                  )}
                  {comp.description && <p className="text-slate-500 mt-1 text-sm line-clamp-2 break-keep">{comp.description}</p>}
                </div>
              </Link>
              
              <div className="flex flex-col sm:flex-row items-center sm:ml-4 pl-2 sm:pl-4 border-l border-slate-100 gap-1 shrink-0">
                <Link href={`/dashboard/competitions/${comp.id}`} className="p-2 sm:p-3 text-slate-300 group-hover:text-blue-500 transition-colors rounded-xl hover:bg-blue-50">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
                <button 
                  onClick={(e) => { e.preventDefault(); if(confirm('정말 삭제하시겠습니까?')) deleteMutation.mutate(comp.id) }}
                  className="text-rose-400 hover:text-rose-600 p-2 sm:p-3 rounded-xl hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )})
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="대회 일정 등록">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('type')} value="competition" />
          
          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">대회명</label>
            <input {...register('title')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" placeholder="예: 전라남도 소년체전" />
            {errors.title && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">시작일</label>
              <input type="date" {...register('date')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" />
              {errors.date && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">종료일</label>
              <input type="date" {...register('end_date')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" />
              {errors.end_date && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.end_date.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-accent-navy mb-1">장소</label>
              <input {...register('location')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" placeholder="개최 수영장" />
              {errors.location && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.location.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-2">참여 선수</label>
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border">
              {athletes?.map((athlete: any) => (
                <label key={athlete.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                  <input 
                    type="checkbox" 
                    value={athlete.id} 
                    {...register('participants')} 
                    className="w-4 h-4 text-rose-500 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {athlete.name} {athlete.grade ? <span className="text-slate-400 text-xs">({athlete.grade}학년)</span> : ''}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">대회 목표/설명</label>
            <textarea {...register('description')} rows={3} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 resize-none" placeholder="비고를 입력하세요" />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">취소</button>
            <button type="submit" disabled={addMutation.isPending} className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/30">등록하기</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
