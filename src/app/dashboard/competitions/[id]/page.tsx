'use client'

import { useState, use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Trophy, Plus, Trash2, MapPin, Calendar as CalendarIcon } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addRecord, deleteRecord } from '@/app/actions/records'
import { toast } from 'sonner'
import { format } from 'date-fns'
import Link from 'next/link'

const schema = z.object({
  athlete_id: z.string().min(1, '선수를 선택해주세요.'),
  event_name: z.string().min(1, '종목을 입력해주세요.'),
  record_time: z.string().min(1, '기록을 입력해주세요.'),
  record_date: z.string().min(10, '기록일을 선택해주세요.'),
})

type FormValues = z.infer<typeof schema>

export default function CompetitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: competition, isPending: compPending } = useQuery({
    queryKey: ['competition', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    }
  })

  const { data: records, isPending: recordsPending } = useQuery({
    queryKey: ['records', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('records')
        .select('*, athletes(name)')
        .eq('schedule_id', id)
        .eq('is_deleted', false)
        .order('record_date', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const { data: athletes } = useQuery({
    queryKey: ['athletes-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('id, name')
        .eq('is_deleted', false)
        .order('name')
      if (error) throw error
      return data
    }
  })

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const addMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const formData = new FormData()
      formData.append('schedule_id', id)
      formData.append('athlete_id', data.athlete_id)
      formData.append('event_name', data.event_name)
      formData.append('record_time', data.record_time.toString())
      formData.append('record_date', data.record_date)
      
      const result = await addRecord(formData)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('기록이 등록되었습니다.', { style: { background: '#0047AB', color: 'white' } })
      queryClient.invalidateQueries({ queryKey: ['records', id] })
      reset()
      setIsModalOpen(false)
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const delMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const result = await deleteRecord(recordId, id)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('기록이 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['records', id] })
    }
  })

  const onSubmit = (data: FormValues) => {
    addMutation.mutate(data)
  }

  // Set default date when opening modal
  const handleOpenModal = () => {
    if (competition?.date) {
      setValue('record_date', competition.date)
    }
    setIsModalOpen(true)
  }

  if (compPending) {
    return <div className="py-12 text-center text-slate-400">대회 정보를 불러오는 중...</div>
  }

  if (!competition) {
    return <div className="py-12 text-center text-slate-400">대회 정보를 찾을 수 없습니다.</div>
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/competitions" className="inline-flex items-center text-slate-500 hover:text-accent-navy transition-colors font-bold gap-2">
        <ArrowLeft className="w-5 h-5" />
        목록으로 돌아가기
      </Link>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Trophy className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-rose-100 text-rose-600 px-4 py-1.5 rounded-full text-sm font-black border border-rose-200">
              {format(new Date(competition.date), 'yyyy년 MM월 dd일')}
              {competition.end_date ? ` ~ ${format(new Date(competition.end_date), 'yyyy년 MM월 dd일')}` : ''}
            </span>
            {competition.location && (
              <div className="flex items-center gap-1.5 text-slate-600 text-sm font-bold bg-slate-100 px-4 py-1.5 rounded-full">
                <MapPin className="w-4 h-4" />
                {competition.location}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-black text-accent-navy mb-3">{competition.title}</h1>
          {competition.description && <p className="text-slate-500 text-lg">{competition.description}</p>}
        </div>
      </div>

      <div className="flex justify-between items-center mt-12 mb-6">
        <h2 className="text-2xl font-black text-accent-navy flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          대회 결과
        </h2>
        <button 
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-accent-navy hover:bg-blue-900 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          기록 등록
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-bold">
            <tr>
              <th className="px-6 py-4">선수명</th>
              <th className="px-6 py-4">종목</th>
              <th className="px-6 py-4">기록 (초)</th>
              <th className="px-6 py-4">기록일</th>
              <th className="px-6 py-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {recordsPending ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">결과를 불러오는 중...</td>
              </tr>
            ) : records?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">등록된 결과가 없습니다.</td>
              </tr>
            ) : (
              records?.map((record: any) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-accent-navy">{record.athletes?.name}</td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{record.event_name}</td>
                  <td className="px-6 py-4 text-blue-600 font-black">{record.record_time}</td>
                  <td className="px-6 py-4 text-slate-500">{format(new Date(record.record_date), 'yyyy.MM.dd')}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => { if(confirm('기록을 삭제하시겠습니까?')) delMutation.mutate(record.id) }}
                      className="text-rose-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors inline-flex"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="대회 기록 등록">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">선수 선택</label>
            <select {...register('athlete_id')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 text-slate-700">
              <option value="">선수를 선택하세요</option>
              {athletes?.map((athlete: any) => (
                <option key={athlete.id} value={athlete.id}>{athlete.name}</option>
              ))}
            </select>
            {errors.athlete_id && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.athlete_id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">종목</label>
            <input {...register('event_name')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" placeholder="예: 50m 자유형" />
            {errors.event_name && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.event_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">기록 (초)</label>
              <input 
                type="number" 
                step="0.01" 
                {...register('record_time')} 
                className="w-full px-4 py-3 rounded-2xl border bg-slate-50" 
                placeholder="예: 25.43" 
              />
              {errors.record_time && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.record_time.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">기록일</label>
              <input type="date" {...register('record_date')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" />
              {errors.record_date && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.record_date.message}</p>}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">취소</button>
            <button type="submit" disabled={addMutation.isPending} className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-accent-navy hover:bg-blue-900 shadow-lg shadow-blue-900/30">등록하기</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
