'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Bell, Plus, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addNotice, softDeleteNotice } from '@/app/actions/notices'
import { toast } from 'sonner'
import { format } from 'date-fns'

const schema = z.object({
  title: z.string().min(2, '제목을 입력해주세요.'),
  content: z.string().min(2, '내용을 입력해주세요.'),
})

type FormValues = z.infer<typeof schema>

export default function NoticesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      return data
    }
  })

  const { data: notices, isPending } = useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*, users(name)')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema)
  })

  const addMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('content', data.content)
      const result = await addNotice(formData)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('공지사항이 등록되었습니다.', { style: { background: '#0047AB', color: 'white' } })
      queryClient.invalidateQueries({ queryKey: ['notices'] })
      reset()
      setIsModalOpen(false)
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await softDeleteNotice(id)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('공지사항이 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['notices'] })
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
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-accent-navy">공지사항</h1>
            <p className="text-sm text-slate-500 font-medium">전체 학생 및 학부모 전달 사항을 관리하세요.</p>
          </div>
        </div>

        {profile?.role === 'admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/30"
          >
            <Plus className="w-5 h-5" />
            새 공지 작성
          </button>
        )}
      </div>

      <div className="space-y-4">
        {isPending ? (
          <div className="py-12 text-center text-slate-400">불러오는 중...</div>
        ) : notices?.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-100">등록된 공지사항이 없습니다.</div>
        ) : (
          notices?.map((notice: any) => (
            <div key={notice.id} id={notice.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 scroll-mt-24">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold text-accent-navy">{notice.title}</h2>
                {profile?.role === 'admin' && (
                  <button 
                    onClick={() => { if(confirm('정말 삭제하시겠습니까?')) deleteMutation.mutate(notice.id) }}
                    className="text-rose-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{notice.content}</p>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-4 text-xs text-slate-400 font-medium">
                <span>작성일: {format(new Date(notice.created_at), 'yyyy-MM-dd')}</span>
                <span>작성자: {notice.users?.name}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="공지사항 작성">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">제목</label>
            <input {...register('title')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" placeholder="공지 제목" />
            {errors.title && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">내용</label>
            <textarea {...register('content')} rows={8} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 resize-none" placeholder="공지 내용을 입력하세요" />
            {errors.content && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.content.message}</p>}
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">취소</button>
            <button type="submit" disabled={addMutation.isPending} className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/30">등록하기</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
