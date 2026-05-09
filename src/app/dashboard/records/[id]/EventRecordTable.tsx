'use client'

import { useState } from 'react'
import { Calendar, Trash2, Edit2 } from 'lucide-react'
import { format } from 'date-fns'
import { formatTimeSeconds, parseTimeInput } from '@/utils/time'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRecord, updateRecord } from '@/app/actions/records'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const editRecordSchema = z.object({
  record_time: z.string().min(1, '기록을 입력해주세요.'),
  record_date: z.string().min(10, '기록일을 선택해주세요.'),
  match_type: z.string().optional().nullable(),
  rank: z.string().optional().nullable(),
})

type EditFormValues = z.infer<typeof editRecordSchema>

export default function EventRecordTable({ eventRecords, userRole, athleteId }: { eventRecords: any[], userRole: string, athleteId: string }) {
  const queryClient = useQueryClient()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<EditFormValues>({
    resolver: zodResolver(editRecordSchema),
  })

  const canEdit = ['admin', 'developer'].includes(userRole) || userRole === 'coach'

  const delMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const result = await deleteRecord(recordId)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('기록이 삭제되었습니다.')
      window.location.reload() // Or invalidate queries if using React Query for this page
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const editMutation = useMutation({
    mutationFn: async (data: EditFormValues) => {
      if (!editingRecord) return
      const formData = new FormData()
      formData.append('schedule_id', editingRecord.schedule_id || '')
      formData.append('athlete_id', athleteId)
      formData.append('event_name', editingRecord.event_name)
      formData.append('record_time', parseTimeInput(data.record_time).toString())
      formData.append('record_date', data.record_date)
      if (data.match_type) formData.append('match_type', data.match_type)
      if (data.rank) formData.append('rank', data.rank)
      
      const result = await updateRecord(editingRecord.id, formData)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('기록이 수정되었습니다.')
      setIsEditModalOpen(false)
      window.location.reload()
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const handleEditClick = (record: any) => {
    setEditingRecord(record)
    setValue('record_time', formatTimeSeconds(record.record_time))
    setValue('record_date', record.record_date)
    setValue('match_type', record.match_type || '')
    setValue('rank', record.rank ? record.rank.toString() : '')
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (recordId: string) => {
    if(confirm('기록을 삭제하시겠습니까?')) {
      delMutation.mutate(recordId)
    }
  }

  const onSubmitEdit = (data: EditFormValues) => {
    editMutation.mutate(data)
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {eventRecords.map((record: any) => (
          <div key={record.id} className="px-5 py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800 text-sm truncate">{record.schedules?.title || '기타 기록'}</div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(record.record_date), 'yyyy.MM.dd')}
                </span>
                {record.match_type && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    record.match_type === '결승' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {record.match_type}
                  </span>
                )}
                {record.rank && (
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    record.rank === 1 ? 'bg-yellow-100 text-yellow-600' :
                    record.rank === 2 ? 'bg-slate-100 text-slate-500' :
                    record.rank === 3 ? 'bg-orange-50 text-orange-600' :
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {record.rank}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-black text-blue-600 text-lg">
                {formatTimeSeconds(record.record_time)}
              </span>
            </div>
            {canEdit && (
              <div className="flex gap-0.5 shrink-0">
                <button 
                  onClick={() => handleEditClick(record)}
                  className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteClick(record.id)}
                  className="text-rose-400 hover:text-rose-600 p-1.5 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="w-full text-left whitespace-nowrap">
        <thead className="border-b border-slate-100 text-slate-500 text-sm font-bold">
          <tr>
            <th className="px-6 py-4">대회명 / 일정</th>
            <th className="px-6 py-4 text-center">경기 구분</th>
            <th className="px-6 py-4 text-center">순위</th>
            <th className="px-6 py-4">기록일</th>
            <th className="px-6 py-4 text-right">기록</th>
            {canEdit && <th className="px-6 py-4 text-right">관리</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {eventRecords.map((record: any) => (
            <tr key={record.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-bold text-slate-800">{record.schedules?.title || '기타 기록'}</div>
                {record.schedules?.location && (
                  <div className="text-slate-400 text-xs mt-1">{record.schedules.location}</div>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                {record.match_type ? (
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    record.match_type === '결승' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {record.match_type}
                  </span>
                ) : (
                  <span className="text-slate-300">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                {record.rank ? (
                  <div className="flex justify-center">
                    <span className={`flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                      record.rank === 1 ? 'bg-yellow-100 text-yellow-600 border-2 border-yellow-200 shadow-sm' :
                      record.rank === 2 ? 'bg-slate-100 text-slate-500 border-2 border-slate-200' :
                      record.rank === 3 ? 'bg-orange-50 text-orange-600 border-2 border-orange-200' :
                      'text-slate-500'
                    }`}>
                      {record.rank}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-300">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-slate-500">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(record.record_date), 'yyyy.MM.dd')}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="font-black text-blue-600 text-lg">
                  {formatTimeSeconds(record.record_time)}
                </span>
              </td>
              {canEdit && (
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button 
                      onClick={() => handleEditClick(record)}
                      className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors inline-flex"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(record.id)}
                      className="text-rose-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors inline-flex"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {canEdit && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="기록 수정">
          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
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
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">취소</button>
              <button type="submit" disabled={editMutation.isPending} className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30">수정하기</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
