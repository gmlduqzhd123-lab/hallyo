'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Video, Plus, Trash2, Loader2, Check } from 'lucide-react'
import { addVideo, softDeleteVideo, approveVideo } from '@/app/actions/videos'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'

type VideoData = {
  id: string
  url: string
  title: string
  description: string | null
  category: string
  created_at: string
}

const CATEGORIES = ['훈련 영상', '동기 유발', '수영 상식', '기타 수영 관련']

const getYoutubeVideoId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

function VideoItem({ video, userRole, userId, approveMutation, handleDelete }: any) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoId = getYoutubeVideoId(video.url);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;

  return (
    <div className="relative bg-white p-6 sm:p-8 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      {video.status === 'pending' && (
        <div className="absolute top-4 right-4 bg-rose-500 text-white px-3 py-1.5 text-sm font-bold rounded-xl z-10 flex items-center gap-2">
          승인 대기
          {['admin', 'developer', 'coach'].includes(userRole as string) && (
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
      
      {videoId ? (
        <div className={`aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow-sm border border-slate-200 ${video.status === 'pending' ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
          {!isPlaying ? (
            <div 
              className="w-full h-full relative cursor-pointer group"
              onClick={() => setIsPlaying(true)}
            >
              <img 
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`} 
                alt={video.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30 transition-transform group-hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6 ml-1"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              className="w-full h-full"
              src={embedUrl || undefined}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>
      ) : (
        <div className={`aspect-video w-full rounded-2xl bg-slate-50 flex flex-col items-center justify-center border border-slate-200 text-slate-400 ${video.status === 'pending' ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
          <Video className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">유효하지 않은 유튜브 링크입니다.</p>
        </div>
      )}
      
      <div className="mt-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-bold text-2xl text-slate-900 leading-tight">{video.title}</h3>
          {video.description && (
            <p className="text-slate-600 mt-3 leading-relaxed text-[15px] whitespace-pre-wrap">
              {video.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm text-slate-400 font-medium">
            <span>{new Date(video.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 hover:underline transition-all">
              유튜브에서 원본 보기
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start shrink-0">
          {(['admin', 'developer'].includes(userRole as string) || userRole === 'coach' || video.created_by === userId) && (
            <button 
              onClick={() => handleDelete(video.id)}
              className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group"
              title="이 영상 삭제하기"
            >
              <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TrainingVideosPage() {
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])
  const queryClient = useQueryClient()

  const { data: userProfile, isPending: rolePending } = useQuery({
    queryKey: ['user_role'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return null
      
      let userData = null;
      try {
        const { data } = await supabase.from('users').select('*').eq('id', authData.user.id).single()
        userData = data;
      } catch (e) {}
      
      return { ...userData, auth_id: authData.user.id }
    }
  })

  const userRole = userProfile?.role || 'user'
  const userId = userProfile?.auth_id || userProfile?.id

  const { data: videos, isPending } = useQuery({
    queryKey: ['training_videos'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('training_videos')
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
    
    const formData = new FormData(e.currentTarget)
    const result = await addVideo(formData)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('영상이 등록되었습니다.')
      setIsAdding(false)
      queryClient.invalidateQueries({ queryKey: ['training_videos'] })
    }
    setIsSubmitting(false)
  }

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await approveVideo(id)
      if (res.error) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      toast.success('영상이 승인되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['training_videos'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const visibleVideos = videos
    ?.filter(v => v.category === activeCategory)
    ?.filter(v => ['admin', 'developer', 'coach'].includes(userRole as string) || (v as any).status === 'approved') || []

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 영상을 삭제하시겠습니까?')) return
    
    const result = await softDeleteVideo(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('영상이 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['training_videos'] })
    }
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <PageHeader 
              title="수영 관련 영상 시청" 
              settingKey="desc_videos" 
              defaultDescription="유튜브 링크를 등록하여 수영 관련 영상을 공유하세요." 
            />
          </div>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>영상 등록</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        {CATEGORIES.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all flex-1 sm:flex-none text-sm whitespace-nowrap ${
              activeCategory === category 
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-bold text-slate-800 mb-4">새 영상 등록</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">카테고리</label>
              <select
                name="category"
                required
                defaultValue={activeCategory}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800 bg-white"
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">영상 제목</label>
              <input 
                name="title" 
                required 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800"
                placeholder="예: 5월 4일 자유형 폼 교정 훈련"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">유튜브 링크 (URL)</label>
              <input 
                name="url" 
                required 
                type="url"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-800 font-mono text-sm"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">영상 설명 (선택사항)</label>
              <textarea 
                name="description" 
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none text-slate-800"
                placeholder="영상에 대한 자세한 설명을 입력하세요."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-6 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
              >
                취소
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                등록 완료
              </button>
            </div>
          </form>
        </div>
      )}

      {isPending || rolePending ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">영상을 불러오는 중입니다...</p>
        </div>
      ) : visibleVideos.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-16 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Video className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">아직 등록된 수영 관련 영상이 없네요!</h3>
          <p className="text-slate-500 mb-6">첫 번째 유튜브 수영 관련 영상을 공유하여 선수들의 실력을 향상시켜보세요.</p>
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>첫 영상 등록하기</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {visibleVideos.map((video: any) => (
            <VideoItem 
              key={video.id} 
              video={video} 
              userRole={userRole} 
              userId={userId} 
              approveMutation={approveMutation} 
              handleDelete={handleDelete} 
            />
          ))}
        </div>
      )}
    </main>
  )
}
