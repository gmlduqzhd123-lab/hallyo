'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Film, Plus, Trash2, Loader2, Upload, Link2, Edit2, Check } from 'lucide-react'
import { addCompetitionVideo, softDeleteCompetitionVideo, updateCompetitionVideo, approveCompetitionVideo } from '@/app/actions/competition-videos'
import { toast } from 'sonner'

type VideoData = {
  id: string
  url: string
  title: string
  description: string | null
  created_at: string
}

const getEmbedUrl = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
};

export default function CompetitionVideosPage() {
  const [isAdding, setIsAdding] = useState(false)
  const [editingVideo, setEditingVideo] = useState<VideoData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadType, setUploadType] = useState<'youtube' | 'gdrive'>('youtube')
  
  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data: userRole, isPending: rolePending } = useQuery({
    queryKey: ['user_role'],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return null
      const { data } = await supabase.from('users').select('role').eq('id', authData.user.id).single()
      return data?.role
    }
  })

  const { data: videos, isPending } = useQuery({
    queryKey: ['competition_videos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_videos')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as VideoData[]
    }
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      const title = formData.get('title') as string
      const description = formData.get('description') as string
      let finalUrl = ''

      if (uploadType === 'youtube') {
        finalUrl = formData.get('url') as string
      } else {
        finalUrl = formData.get('gdriveUrl') as string
      }
      
      if (editingVideo) {
        const result = await updateCompetitionVideo(editingVideo.id, { title, description, url: finalUrl })
        if (result.error) {
          throw new Error(result.error)
        } else {
          toast.success('영상이 성공적으로 수정되었습니다.')
          setEditingVideo(null)
          queryClient.invalidateQueries({ queryKey: ['competition_videos'] })
        }
      } else {
        const result = await addCompetitionVideo({ title, description, url: finalUrl })
        if (result.error) {
          throw new Error(result.error)
        } else {
          toast.success('영상이 성공적으로 등록되었습니다.')
          setIsAdding(false)
          queryClient.invalidateQueries({ queryKey: ['competition_videos'] })
        }
      }
    } catch (err: any) {
      toast.error(err.message || '오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (video: VideoData) => {
    setEditingVideo(video)
    setIsAdding(false)
    if (video.url.includes('drive.google.com')) {
      setUploadType('gdrive')
    } else {
      setUploadType('youtube')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 영상을 삭제하시겠습니까?')) return
    
    const result = await softDeleteCompetitionVideo(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('영상이 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['competition_videos'] })
    }
  }

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await approveCompetitionVideo(id)
      if (res.error) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      toast.success('영상이 승인되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['competition_videos'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const visibleVideos = videos?.filter(v => ['admin', 'developer'].includes(userRole) || (v as any).status === 'approved') || []

  return (
    <main className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-500 rounded-xl shrink-0">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-accent-navy">대회 영상</h1>
            <p className="text-sm text-slate-500 font-medium break-keep">유튜브 링크 또는 구글 드라이브 링크를 등록하여 대회 영상을 공유하세요.</p>
          </div>
        </div>

        <button 
          onClick={() => { setIsAdding(!isAdding); setEditingVideo(null); }}
          className="w-full sm:w-auto flex justify-center items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-purple-500/30 shrink-0 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          새 영상 등록
        </button>
      </div>

      {(isAdding || editingVideo) && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-slate-800 mb-6">{editingVideo ? '영상 수정하기' : '새 영상 등록하기'}</h2>
          
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setUploadType('youtube')}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                uploadType === 'youtube' ? 'bg-red-50 text-red-600 border-2 border-red-200' : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100'
              }`}
            >
              <Link2 className="w-5 h-5" />
              유튜브 링크
            </button>
            <button
              type="button"
              onClick={() => setUploadType('gdrive')}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                uploadType === 'gdrive' ? 'bg-purple-50 text-purple-600 border-2 border-purple-200' : 'bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100'
              }`}
            >
              <Link2 className="w-5 h-5" />
              구글 드라이브 링크
            </button>
          </div>

          <form key={editingVideo ? editingVideo.id : 'add'} onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">영상 제목</label>
              <input 
                name="title" 
                defaultValue={editingVideo?.title || ''}
                required 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-slate-800"
                placeholder="예: 제55회 전국소년체육대회 자유형 결승"
              />
            </div>
            
            {uploadType === 'youtube' ? (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">유튜브 링크 (URL)</label>
                <input 
                  name="url" 
                  defaultValue={editingVideo && !editingVideo.url.includes('drive.google.com') ? editingVideo.url : ''}
                  required 
                  type="url"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-slate-800 font-mono text-sm"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">구글 드라이브 링크 (URL)</label>
                <input 
                  name="gdriveUrl" 
                  defaultValue={editingVideo && editingVideo.url.includes('drive.google.com') ? editingVideo.url : ''}
                  required 
                  type="url"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all text-slate-800 font-mono text-sm"
                  placeholder="https://drive.google.com/file/d/.../view"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">영상 설명 (선택사항)</label>
              <textarea 
                name="description" 
                defaultValue={editingVideo?.description || ''}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-none text-slate-800"
                placeholder="영상에 대한 설명이나 피드백을 입력하세요."
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => { setIsAdding(false); setEditingVideo(null); }}
                className="px-6 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
              >
                취소
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 shadow-lg shadow-purple-500/30"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : editingVideo ? (
                  <Edit2 className="w-5 h-5" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                {isSubmitting ? '진행 중...' : (editingVideo ? '수정 완료' : '등록 완료')}
              </button>
            </div>
          </form>
        </div>
      )}

      {isPending || rolePending ? (
        <div className="py-20 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-100">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-4" />
          영상을 불러오는 중입니다...
        </div>
      ) : visibleVideos.length === 0 ? (
        <div className="bg-white p-20 rounded-3xl shadow-sm border border-slate-100 text-center flex flex-col items-center gap-4">
          <div className="bg-purple-50 p-6 rounded-full inline-block">
            <Film className="w-12 h-12 text-purple-300" />
          </div>
          <p className="text-slate-400 font-medium">아직 등록된 대회 영상이 없습니다.<br/>유튜브 링크나 구글 드라이브 링크를 올려보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {visibleVideos.map((video: any) => {
            const embedUrl = getEmbedUrl(video.url)
            
            return (
              <div key={video.id} className="relative bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                {video.status === 'pending' && (
                  <div className="absolute top-4 right-4 bg-rose-500 text-white px-3 py-1.5 text-sm font-bold rounded-xl z-10 flex items-center gap-2">
                    승인 대기
                    {['admin', 'developer'].includes(userRole) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); approveMutation.mutate(video.id) }}
                        className="ml-2 p-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
                        title="영상 승인"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                {embedUrl ? (
                  <div className={`aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-sm ${video.status === 'pending' ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    <iframe
                      className="w-full h-full"
                      src={embedUrl}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : video.url.includes('drive.google.com') ? (
                  <div className={`aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-sm ${video.status === 'pending' ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    <iframe
                      className="w-full h-full"
                      src={video.url.replace(/\/view.*$/, '/preview')}
                      title={video.title}
                      allow="autoplay"
                    />
                  </div>
                ) : (
                  <div className={`aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-sm flex items-center justify-center ${video.status === 'pending' ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    <a href={video.url} target="_blank" rel="noreferrer" className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-2">
                      <Link2 className="w-5 h-5" />
                      영상 링크 열기
                    </a>
                  </div>
                )}
                
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 line-clamp-2">{video.title}</h3>
                    {video.description && (
                      <p className="text-slate-500 mt-2 text-sm whitespace-pre-wrap line-clamp-3">
                        {video.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center">
                    {(['admin', 'developer'].includes(userRole) || userRole === 'coach') && (
                      <>
                        <button
                          onClick={() => handleEditClick(video)}
                          className="p-2.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded-xl transition-colors shrink-0"
                          title="수정"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(video.id)}
                          className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                          title="삭제"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
