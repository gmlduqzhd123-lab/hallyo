'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Trophy, Plus, Trash2, Edit2, Medal, Star, Upload, Loader2, X, Download, ZoomIn, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { addHallOfFameRecord, updateHallOfFameRecord, deleteHallOfFameRecord } from '@/app/actions/hall_of_fame'

type HallOfFameData = {
  id: string
  athlete_name: string
  achievement: string
  story: string | null
  photo_url: string | null
  article_url?: string | null
  created_at: string
}

export default function HallOfFamePage() {
  const [isAdding, setIsAdding] = useState(false)
  const [viewingRecord, setViewingRecord] = useState<HallOfFameData | null>(null)
  const [editingRecord, setEditingRecord] = useState<HallOfFameData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data: userRole } = useQuery({
    queryKey: ['userRole'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return 'viewer'
      const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
      return data?.role || 'viewer'
    }
  })

  const { data: records, isPending } = useQuery({
    queryKey: ['hall_of_fame'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hall_of_fame')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as HallOfFameData[]
    }
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `hall_of_fame_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      
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
      const athlete_name = formData.get('athlete_name') as string
      const achievement = formData.get('achievement') as string
      const story = formData.get('story') as string
      const article_url = formData.get('article_url') as string

      if (editingRecord) {
        const result = await updateHallOfFameRecord(editingRecord.id, { 
          athlete_name, achievement, story, photo_url: previewUrl || editingRecord.photo_url, article_url 
        })
        if (result.error) throw new Error(result.error)
        toast.success('기록이 성공적으로 수정되었습니다.')
      } else {
        const result = await addHallOfFameRecord({ 
          athlete_name, achievement, story, photo_url: previewUrl, article_url 
        })
        if (result.error) throw new Error(result.error)
        toast.success('명예의 전당에 성공적으로 등록되었습니다. 🎉')
      }

      setIsAdding(false)
      setEditingRecord(null)
      setPreviewUrl(null)
      queryClient.invalidateQueries({ queryKey: ['hall_of_fame'] })
    } catch (err: any) {
      toast.error(err.message || '오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (record: HallOfFameData) => {
    setEditingRecord(record)
    setIsAdding(false)
    setPreviewUrl(record.photo_url)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 기록을 삭제하시겠습니까?')) return
    
    const result = await deleteHallOfFameRecord(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('기록이 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['hall_of_fame'] })
    }
  }

  return (
    <main className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-400 p-8 rounded-[32px] shadow-lg shadow-amber-500/20 text-white relative overflow-hidden border border-white/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-10 w-40 h-40 bg-orange-300/30 rounded-full blur-2xl translate-y-1/2"></div>
        
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-inner">
            <Trophy className="w-8 h-8 text-yellow-100" />
          </div>
          <div>
            <h1 className="text-3xl font-black drop-shadow-md">명예의 전당</h1>
            <p className="text-amber-100 mt-1 font-medium text-lg">빛나는 영광의 순간들, 자랑스러운 우리 선수들 ✨</p>
          </div>
        </div>

        {userRole === 'admin' && (
          <button 
            onClick={() => { setIsAdding(!isAdding); setEditingRecord(null); setPreviewUrl(null); }}
            className="relative z-10 flex items-center gap-2 bg-white text-amber-600 hover:bg-amber-50 px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            <Plus className="w-5 h-5" />
            기록 등록
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingRecord) && userRole === 'admin' && (
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-amber-100 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Medal className="w-32 h-32" />
          </div>
          
          <h2 className="text-2xl font-black text-amber-900 mb-6 flex items-center gap-2 relative z-10">
            {editingRecord ? '명예의 전당 수정' : '새로운 전설 등록'} <Star className="w-6 h-6 text-amber-400" fill="currentColor" />
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-amber-900 ml-1">선수 이름 <span className="text-rose-500">*</span></label>
                <input 
                  name="athlete_name" 
                  required 
                  defaultValue={editingRecord?.athlete_name}
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white"
                  placeholder="예: 홍길동"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-amber-900 ml-1">달성 업적 <span className="text-rose-500">*</span></label>
                <input 
                  name="achievement" 
                  required 
                  defaultValue={editingRecord?.achievement}
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white"
                  placeholder="예: 2026 전국소년체육대회 자유형 50m 금메달"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-amber-900 ml-1">영광의 사진</label>
              <div className="flex items-start gap-6">
                <div 
                  className={`w-40 h-40 shrink-0 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${previewUrl ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-amber-300'} overflow-hidden relative group`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2 text-amber-500">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs font-bold">업로드 중...</span>
                    </div>
                  ) : previewUrl ? (
                    <>
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-30 blur-md scale-110" 
                        style={{ backgroundImage: `url(${previewUrl})` }}
                      ></div>
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-contain relative z-10 drop-shadow-md" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <span className="text-white font-bold text-sm bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">사진 변경</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-2 text-slate-400 group-hover:text-amber-500 transition-colors">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 group-hover:text-amber-600 transition-colors">클릭하여 사진 선택</span>
                    </>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500 leading-relaxed mb-3">
                    선수의 빛나는 순간이 담긴 사진을 업로드해주세요. 🏅<br/>사진이 없어도 등록 가능합니다.
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

            <div className="space-y-2">
              <label className="text-sm font-bold text-amber-900 ml-1">스토리 및 소감</label>
              <textarea 
                name="story" 
                rows={4}
                defaultValue={editingRecord?.story || ''}
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white resize-none"
                placeholder="치열했던 훈련 과정이나 영광의 순간에 대한 이야기를 자유롭게 적어주세요."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-amber-900 ml-1">관련 기사 링크 <span className="text-slate-400 font-normal">(선택)</span></label>
              <input 
                type="url"
                name="article_url" 
                defaultValue={editingRecord?.article_url || ''}
                className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 outline-none transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white"
                placeholder="예: https://www.news.com/article/..."
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
                className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? '저장 중...' : editingRecord ? '수정 내용 저장' : '명예의 전당 등록'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hall of Fame List */}
      {isPending ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
        </div>
      ) : records?.length === 0 ? (
        <div className="bg-white rounded-[32px] p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="w-24 h-24 bg-amber-50 text-amber-300 rounded-full flex items-center justify-center mb-6">
            <Trophy className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">아직 등록된 전설이 없습니다</h3>
          <p className="text-slate-500">앞으로 써 내려갈 우리 수영부의 새로운 역사를 기대합니다! 🏊‍♂️</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {records?.map((record) => (
            <div key={record.id} className="bg-white rounded-[32px] overflow-hidden border border-amber-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col">
              {record.photo_url ? (
                <div 
                  className="relative h-64 sm:h-80 overflow-hidden bg-slate-900 flex items-center justify-center cursor-pointer"
                  onClick={() => setViewingRecord(record)}
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl scale-125" 
                    style={{ backgroundImage: `url(${record.photo_url})` }}
                  ></div>
                  <img src={record.photo_url} alt={record.athlete_name} className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-105 relative z-10 drop-shadow-2xl" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-20 pointer-events-none"></div>
                  <div className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-30">
                    <Medal className="w-3 h-3" /> 영광의 얼굴
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-30 flex items-center gap-1">
                    <ZoomIn className="w-3 h-3" /> 클릭하여 보기
                  </div>
                </div>
              ) : (
                <div className="h-24 bg-gradient-to-r from-amber-400 to-orange-400 relative overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20">
                    <Trophy className="w-32 h-32" />
                  </div>
                </div>
              )}
              
              <div className="p-8 relative flex-1 flex flex-col">
                <div className={`absolute ${record.photo_url ? '-top-12' : '-top-10'} right-8 bg-white p-2 rounded-2xl shadow-xl`}>
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-yellow-50 rounded-xl flex items-center justify-center border border-amber-200">
                    <Trophy className="w-8 h-8 text-amber-500" />
                  </div>
                </div>

                <h3 className="text-2xl font-black text-slate-800 mb-1">{record.athlete_name}</h3>
                <h4 className="text-lg font-bold text-amber-600 mb-4">{record.achievement}</h4>
                
                {record.story && (
                  <div className="mt-2 bg-slate-50 p-5 rounded-2xl text-slate-600 text-sm leading-relaxed relative italic flex-1 border border-slate-100">
                    <span className="text-amber-200 text-4xl absolute top-2 left-2 font-serif leading-none">"</span>
                    <p className="relative z-10 px-4">{record.story}</p>
                  </div>
                )}

                {userRole === 'admin' && (
                  <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-6">
                    <button 
                      onClick={() => handleEditClick(record)}
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" /> 수정
                    </button>
                    <button 
                      onClick={() => handleDelete(record.id)}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> 삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Lightbox Viewer */}
      {viewingRecord && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setViewingRecord(null)}
        >
          {/* Close Button */}
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full transition-all z-50"
            onClick={() => setViewingRecord(null)}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Download Button */}
          {viewingRecord.photo_url && (
            <a
              href={viewingRecord.photo_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-6 right-20 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full transition-all z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <Download className="w-6 h-6" />
            </a>
          )}

          {/* Photo */}
          <div className="max-w-[90vw] max-h-[70vh] relative" onClick={(e) => e.stopPropagation()}>
            {viewingRecord.photo_url && (
              <img 
                src={viewingRecord.photo_url} 
                alt={viewingRecord.athlete_name}
                className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl"
              />
            )}
          </div>

          {/* Info Overlay */}
          <div 
            className="mt-6 max-w-lg w-full text-center" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-2xl font-black mb-2">{viewingRecord.athlete_name}</h3>
            <p className="text-amber-400 font-bold text-lg mb-3">{viewingRecord.achievement}</p>
            {viewingRecord.story && (
              <p className="text-white/70 text-sm leading-relaxed italic mb-4">"{viewingRecord.story}"</p>
            )}
            {viewingRecord.article_url && (
              <a 
                href={viewingRecord.article_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-5 rounded-full transition-all text-sm shadow-lg shadow-amber-500/20"
              >
                <ExternalLink className="w-4 h-4" />
                관련 기사 보기
              </a>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
