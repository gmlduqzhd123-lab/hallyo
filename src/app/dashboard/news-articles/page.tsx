'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Newspaper, Plus, Trash2, Edit2, ExternalLink, Calendar, Loader2, Upload, Star } from 'lucide-react'
import { toast } from 'sonner'
import { addNewsArticle, updateNewsArticle, deleteNewsArticle } from '@/app/actions/news_articles'
import { format } from 'date-fns'

type NewsArticle = {
  id: string
  title: string
  content: string
  article_url: string
  publisher: string | null
  publish_date: string | null
  photo_url: string | null
  created_at: string
}

export default function NewsArticlesPage() {
  const [isAdding, setIsAdding] = useState(false)
  const [editingRecord, setEditingRecord] = useState<NewsArticle | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      return data
    }
  })

  const userRole = userProfile?.role || 'viewer'
  const userId = userProfile?.id

  const { data: articles, isPending } = useQuery({
    queryKey: ['news_articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('is_deleted', false)
        .order('publish_date', { ascending: false })
      
      if (error) throw error
      return data as NewsArticle[]
    }
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `news_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('photos').getPublicUrl(fileName)
      setPreviewUrl(data.publicUrl)
    } catch (err: any) {
      toast.error('사진 업로드에 실패했습니다.')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      const title = formData.get('title') as string
      const content = formData.get('content') as string
      const article_url = formData.get('article_url') as string
      const publisher = formData.get('publisher') as string
      const publish_date = formData.get('publish_date') as string

      if (editingRecord) {
        const result = await updateNewsArticle(editingRecord.id, { 
          title, content, article_url, publisher, publish_date, photo_url: previewUrl || editingRecord.photo_url
        })
        if (result.error) throw new Error(result.error)
        toast.success('기사가 성공적으로 수정되었습니다.')
      } else {
        const result = await addNewsArticle({ 
          title, content, article_url, publisher, publish_date, photo_url: previewUrl
        })
        if (result.error) throw new Error(result.error)
        toast.success('보도 기사가 성공적으로 등록되었습니다.')
      }

      setIsAdding(false)
      setEditingRecord(null)
      setPreviewUrl(null)
      queryClient.invalidateQueries({ queryKey: ['news_articles'] })
    } catch (err: any) {
      toast.error(err.message || '오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (article: NewsArticle) => {
    setEditingRecord(article)
    setIsAdding(false)
    setPreviewUrl(article.photo_url)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 기사를 삭제하시겠습니까?')) return
    
    const result = await deleteNewsArticle(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('기사가 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['news_articles'] })
    }
  }

  return (
    <main className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 md:p-8 rounded-[32px] shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden border border-white/20">
        <div className="hidden md:block absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="hidden md:block absolute bottom-0 left-10 w-40 h-40 bg-blue-300/30 rounded-full blur-2xl translate-y-1/2"></div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-inner shrink-0">
            <Newspaper className="w-8 h-8 text-blue-100" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black drop-shadow-md break-keep">보도 기사</h1>
            <p className="text-blue-100 mt-1 font-medium text-base md:text-lg break-keep">여수한려초 수영부의 언론 보도 소식을 한눈에 확인하세요 📰</p>
          </div>
        </div>

        {['admin', 'developer'].includes(userRole as string) && (
          <button 
            onClick={() => { setIsAdding(!isAdding); setEditingRecord(null); setPreviewUrl(null); }}
            className="relative z-10 flex items-center justify-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 shrink-0 whitespace-nowrap w-full md:w-auto"
          >
            <Plus className="w-5 h-5" />
            기사 등록
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingRecord) && ['admin', 'developer'].includes(userRole as string) && (
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-indigo-100 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Newspaper className="w-32 h-32" />
          </div>
          
          <h2 className="text-2xl font-black text-indigo-900 mb-6 flex items-center gap-2 relative z-10">
            {editingRecord ? '기사 내용 수정' : '새 기사 등록'} <Star className="w-6 h-6 text-indigo-400" fill="currentColor" />
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-sm font-bold text-indigo-900 ml-1">기사 제목 <span className="text-rose-500">*</span></label>
              <input 
                name="title" 
                required 
                defaultValue={editingRecord?.title}
                className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 outline-none transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white"
                placeholder="예: 여수한려초 수영부, 전국대회 메달 휩쓸어"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-indigo-900 ml-1">언론사명 <span className="text-slate-400 font-normal">(선택)</span></label>
                <input 
                  name="publisher" 
                  defaultValue={editingRecord?.publisher || ''}
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 outline-none transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white"
                  placeholder="예: 스포츠서울"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-indigo-900 ml-1">보도 일자 <span className="text-slate-400 font-normal">(선택)</span></label>
                <input 
                  type="date"
                  name="publish_date" 
                  defaultValue={editingRecord?.publish_date || ''}
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 outline-none transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-indigo-900 ml-1">기사 내용 요약 <span className="text-rose-500">*</span></label>
              <textarea 
                name="content" 
                required
                rows={4}
                defaultValue={editingRecord?.content}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 outline-none transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white resize-none"
                placeholder="기사의 핵심 내용이나 인상 깊은 부분을 간략하게 요약해주세요."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-indigo-900 ml-1">관련 기사 링크 <span className="text-rose-500">*</span></label>
              <input 
                type="url"
                name="article_url" 
                required
                defaultValue={editingRecord?.article_url}
                className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 outline-none transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white"
                placeholder="예: https://www.news.com/article/..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-indigo-900 ml-1">썸네일 사진 <span className="text-slate-400 font-normal">(선택)</span></label>
              <div className="flex items-start gap-6">
                <div 
                  className={`w-40 h-40 shrink-0 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${previewUrl ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300'} overflow-hidden relative group`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2 text-indigo-500">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs font-bold">업로드 중...</span>
                    </div>
                  ) : previewUrl ? (
                    <>
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30 blur-md scale-110" 
                        style={{ backgroundImage: `url(${previewUrl})` }}
                      ></div>
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover relative z-10 drop-shadow-md" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <span className="text-white font-bold text-sm bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">사진 변경</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-2 text-slate-400 group-hover:text-indigo-500 transition-colors">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">클릭하여 사진 선택</span>
                    </>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500 leading-relaxed mb-3">
                    기사의 대표 이미지를 업로드해주세요.<br/>사진이 없어도 등록 가능합니다.
                  </p>
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); }}
                      className="text-sm text-rose-500 font-bold hover:text-rose-600 px-3 py-1.5 bg-rose-50 rounded-lg transition-colors"
                    >
                      사진 제거하기
                    </button>
                  )}
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button"
                onClick={() => { setIsAdding(false); setEditingRecord(null); setPreviewUrl(null); }}
                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                취소
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting || uploadingImage}
                className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? '저장 중...' : editingRecord ? '수정 내용 저장' : '기사 등록'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Articles List */}
      {isPending ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : articles?.length === 0 ? (
        <div className="bg-white rounded-[32px] p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="w-24 h-24 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mb-6">
            <Newspaper className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">아직 등록된 보도 기사가 없습니다</h3>
          <p className="text-slate-500">우리 수영부의 멋진 활약을 담은 기사들을 이곳에 기록하세요! 🏊‍♀️</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles?.map((article) => (
            <div key={article.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full hover:-translate-y-1">
              <a href={article.article_url} target="_blank" rel="noopener noreferrer" className="block relative h-48 bg-slate-100 overflow-hidden shrink-0">
                {article.photo_url ? (
                  <img src={article.photo_url} alt={article.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-indigo-50/50">
                    <Newspaper className="w-16 h-16 text-indigo-200" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </a>
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-400">
                  {article.publisher && (
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{article.publisher}</span>
                  )}
                  {article.publish_date && (
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(article.publish_date), 'yyyy.MM.dd')}</span>
                  )}
                </div>
                
                <h3 className="text-lg font-black text-slate-800 mb-3 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                  <a href={article.article_url} target="_blank" rel="noopener noreferrer">
                    {article.title}
                  </a>
                </h3>
                
                <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-6 flex-1">
                  {article.content}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                  <a 
                    href={article.article_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-indigo-500 hover:text-indigo-600 font-bold text-sm transition-colors"
                  >
                    기사 원문 보기 <ExternalLink className="w-4 h-4" />
                  </a>

                  {(['admin', 'developer'].includes(userRole as string) || (article as any).created_by === userId) && (
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.preventDefault(); handleEditClick(article); }}
                        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleDelete(article.id); }}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
