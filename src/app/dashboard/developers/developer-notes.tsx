'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { addDeveloperNote, updateDeveloperNote, deleteDeveloperNote } from '@/app/actions/developer_notes'
import { Plus, Trash2, Edit2, Loader2, Save, X, Calendar, PenTool } from 'lucide-react'
import { toast } from 'sonner'

type DeveloperNote = {
  id: string
  content: string
  created_at: string
  updated_at: string
  created_by: string
  users: {
    name: string
  }
}

export default function DeveloperNotes({ userRole }: { userRole: string }) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [noteContent, setNoteContent] = useState('')

  const canEdit = ['admin', 'developer'].includes(userRole)

  const { data: notes, isPending } = useQuery({
    queryKey: ['developer_notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('developer_notes')
        .select(`
          *,
          users ( name )
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as DeveloperNote[]
    }
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) {
        return updateDeveloperNote(editingId, noteContent)
      } else {
        return addDeveloperNote(noteContent)
      }
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(editingId ? '노트가 수정되었습니다.' : '새 노트가 등록되었습니다.')
        queryClient.invalidateQueries({ queryKey: ['developer_notes'] })
        resetForm()
      }
    },
    onError: () => toast.error('오류가 발생했습니다.')
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteDeveloperNote(id),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('노트가 삭제되었습니다.')
        queryClient.invalidateQueries({ queryKey: ['developer_notes'] })
      }
    }
  })

  const resetForm = () => {
    setIsAdding(false)
    setEditingId(null)
    setNoteContent('')
  }

  const startAdding = () => {
    resetForm()
    setIsAdding(true)
  }

  const startEditing = (note: DeveloperNote) => {
    setEditingId(note.id)
    setNoteContent(note.content)
    setIsAdding(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isPending) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-purple-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">개발자 노트</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">업데이트 소식이나 개발 과정을 기록합니다.</p>
          </div>
        </div>
        {canEdit && !isAdding && (
          <button
            onClick={startAdding}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-purple-500/20"
          >
            <Plus className="w-4 h-4" /> 노트 작성
          </button>
        )}
      </div>

      {isAdding && canEdit && (
        <div className="bg-white p-6 rounded-3xl shadow-md border border-purple-200 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800">{editingId ? '노트 수정' : '새 노트 작성'}</h3>
            <button onClick={resetForm} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={6}
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-400/10 outline-none transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white resize-none mb-4"
            placeholder="마크다운 문법을 사용할 수 있습니다..."
          />
          <div className="flex justify-end gap-3">
            <button onClick={resetForm} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
              취소
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!noteContent.trim() || saveMutation.isPending}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              저장
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {notes?.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center">
            <div className="w-20 h-20 bg-purple-50 text-purple-300 rounded-full flex items-center justify-center mb-4">
              <PenTool className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">작성된 노트가 없습니다</h3>
            <p className="text-sm text-slate-500">첫 번째 개발자 노트를 작성해보세요.</p>
          </div>
        ) : (
          notes?.map((note) => (
            <div key={note.id} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-fuchsia-100 rounded-full flex items-center justify-center border border-purple-200">
                    <span className="font-bold text-purple-700 text-sm">{note.users?.name?.substring(0, 1) || 'D'}</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{note.users?.name || '개발자'}</p>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(note.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={() => startEditing(note)}
                      className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('이 노트를 삭제하시겠습니까?')) {
                          deleteMutation.mutate(note.id)
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="prose prose-purple max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                {note.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
