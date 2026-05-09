'use client'

import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Code2, Plus, Trash2, Edit2, Upload, Loader2, Video, Globe, Camera, Code, Mail, User, Briefcase, X, ExternalLink, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { addDeveloper, updateDeveloper, deleteDeveloper } from '@/app/actions/developers'

type DeveloperData = {
  id: string
  name: string
  role: string | null
  bio: string | null
  introduction: string | null
  photo_url: string | null
  youtube_url: string | null
  blog_url: string | null
  instagram_url: string | null
  github_url: string | null
  email: string | null
  created_at: string
}

export default function DevelopersPage() {
  const [isAdding, setIsAdding] = useState(false)
  const [editingDev, setEditingDev] = useState<DeveloperData | null>(null)
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

  const { data: developers, isPending } = useQuery({
    queryKey: ['developers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .eq('is_deleted', false)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as DeveloperData[]
    }
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `developer_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('photos').getPublicUrl(fileName)
      setPreviewUrl(data.publicUrl)
    } catch {
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
      const fd = new FormData(e.currentTarget)
      const payload = {
        name: fd.get('name') as string,
        role: (fd.get('role') as string) || null,
        bio: (fd.get('bio') as string) || null,
        introduction: (fd.get('introduction') as string) || null,
        photo_url: previewUrl || editingDev?.photo_url || null,
        youtube_url: (fd.get('youtube_url') as string) || null,
        blog_url: (fd.get('blog_url') as string) || null,
        instagram_url: (fd.get('instagram_url') as string) || null,
        github_url: (fd.get('github_url') as string) || null,
        email: (fd.get('email') as string) || null,
      }

      if (editingDev) {
        const result = await updateDeveloper(editingDev.id, payload)
        if (result.error) throw new Error(result.error)
        toast.success('개발자 정보가 수정되었습니다.')
      } else {
        const result = await addDeveloper(payload)
        if (result.error) throw new Error(result.error)
        toast.success('개발자가 등록되었습니다! 🎉')
      }

      setIsAdding(false)
      setEditingDev(null)
      setPreviewUrl(null)
      queryClient.invalidateQueries({ queryKey: ['developers'] })
    } catch (err: any) {
      toast.error(err.message || '오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (dev: DeveloperData) => {
    setEditingDev(dev)
    setIsAdding(false)
    setPreviewUrl(dev.photo_url)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 개발자를 삭제하시겠습니까?')) return

    const result = await deleteDeveloper(id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('개발자가 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['developers'] })
    }
  }

  const socialLinks = (dev: DeveloperData) => {
    const links = []
    if (dev.youtube_url) links.push({ icon: Video, url: dev.youtube_url, label: 'YouTube', color: 'text-red-500 bg-red-50 hover:bg-red-100' })
    if (dev.blog_url) links.push({ icon: Globe, url: dev.blog_url, label: '블로그', color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' })
    if (dev.instagram_url) links.push({ icon: Camera, url: dev.instagram_url, label: 'Instagram', color: 'text-pink-500 bg-pink-50 hover:bg-pink-100' })
    if (dev.github_url) links.push({ icon: Code, url: dev.github_url, label: 'GitHub', color: 'text-slate-700 bg-slate-100 hover:bg-slate-200' })
    if (dev.email) links.push({ icon: Mail, url: `mailto:${dev.email}`, label: dev.email, color: 'text-blue-500 bg-blue-50 hover:bg-blue-100' })
    return links
  }

  return (
    <main className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 p-6 md:p-8 rounded-[32px] shadow-lg shadow-purple-500/20 text-white relative overflow-hidden border border-white/20">
        <div className="hidden md:block absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="hidden md:block absolute bottom-0 left-10 w-40 h-40 bg-fuchsia-300/30 rounded-full blur-2xl translate-y-1/2"></div>
        <div className="absolute top-10 right-1/4 w-20 h-20 bg-pink-300/20 rounded-full blur-xl"></div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-inner shrink-0">
            <Code2 className="w-8 h-8 text-purple-100" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black drop-shadow-md break-keep">개발자 소개</h1>
            <p className="text-purple-100 mt-1 font-medium text-base md:text-lg break-keep">이 서비스를 만든 사람들을 소개합니다 💜</p>
          </div>
        </div>

        {['admin', 'developer'].includes(userRole as string) && (
          <button
            onClick={() => { setIsAdding(!isAdding); setEditingDev(null); setPreviewUrl(null); }}
            className="relative z-10 flex items-center justify-center gap-2 bg-white text-purple-600 hover:bg-purple-50 px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 shrink-0 whitespace-nowrap w-full md:w-auto"
          >
            <Plus className="w-5 h-5" />
            개발자 등록
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {(isAdding || editingDev) && ['admin', 'developer'].includes(userRole as string) && (
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-purple-100 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Code2 className="w-32 h-32" />
          </div>

          <div className="flex justify-between items-center mb-6 relative z-10">
            <h2 className="text-2xl font-black text-purple-900 flex items-center gap-2">
              {editingDev ? '개발자 정보 수정' : '새로운 개발자 등록'} <Code2 className="w-6 h-6 text-purple-400" />
            </h2>
            <button onClick={() => { setIsAdding(false); setEditingDev(null); setPreviewUrl(null) }} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Row 1: Photo + Basic Info */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Photo Upload */}
              <div className="shrink-0">
                <label className="text-sm font-bold text-purple-900 ml-1 mb-2 block">프로필 사진</label>
                <div
                  className={`w-40 h-40 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${previewUrl ? 'border-purple-400 bg-purple-50/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-purple-300'} overflow-hidden relative group`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2 text-purple-500">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs font-bold">업로드 중...</span>
                    </div>
                  ) : previewUrl ? (
                    <>
                      <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-md scale-110" style={{ backgroundImage: `url(${previewUrl})` }}></div>
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-contain relative z-10" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <span className="text-white font-bold text-sm bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">사진 변경</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-2 text-slate-400 group-hover:text-purple-500 transition-colors">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 group-hover:text-purple-600 transition-colors">클릭하여 사진 선택</span>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                {previewUrl && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); }} className="mt-2 text-xs text-rose-500 font-bold hover:text-rose-600 px-3 py-1 bg-rose-50 rounded-lg transition-colors w-full text-center">
                    사진 제거
                  </button>
                )}
              </div>

              {/* Name + Role */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-purple-900 ml-1">이름 <span className="text-rose-500">*</span></label>
                    <input name="name" required defaultValue={editingDev?.name} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-400/10 outline-none transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white" placeholder="예: 홍길동" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-purple-900 ml-1">역할 / 직책</label>
                    <input name="role" defaultValue={editingDev?.role || ''} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-400/10 outline-none transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white" placeholder="예: 풀스택 개발자" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-purple-900 ml-1">한 줄 소개</label>
                  <input name="bio" defaultValue={editingDev?.bio || ''} className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-400/10 outline-none transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white" placeholder="예: 수영을 사랑하는 개발자 🏊‍♂️" />
                </div>
              </div>
            </div>

            {/* Introduction */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-purple-900 ml-1">상세 소개 / 약력</label>
              <textarea name="introduction" rows={4} defaultValue={editingDev?.introduction || ''} className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-400/10 outline-none transition-all font-medium text-slate-700 bg-slate-50 focus:bg-white resize-none" placeholder="개발자의 약력, 경력, 관심분야 등을 자유롭게 작성해주세요." />
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-purple-900 ml-1">소셜 링크</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200 focus-within:border-red-300 focus-within:ring-4 focus-within:ring-red-100 transition-all">
                  <Video className="w-5 h-5 text-red-500 shrink-0" />
                  <input name="youtube_url" defaultValue={editingDev?.youtube_url || ''} className="flex-1 bg-transparent outline-none font-medium text-slate-700 text-sm" placeholder="유튜브 채널 URL" />
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200 focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-100 transition-all">
                  <Globe className="w-5 h-5 text-emerald-600 shrink-0" />
                  <input name="blog_url" defaultValue={editingDev?.blog_url || ''} className="flex-1 bg-transparent outline-none font-medium text-slate-700 text-sm" placeholder="블로그 URL" />
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200 focus-within:border-pink-300 focus-within:ring-4 focus-within:ring-pink-100 transition-all">
                  <Camera className="w-5 h-5 text-pink-500 shrink-0" />
                  <input name="instagram_url" defaultValue={editingDev?.instagram_url || ''} className="flex-1 bg-transparent outline-none font-medium text-slate-700 text-sm" placeholder="인스타그램 URL" />
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200 focus-within:border-slate-400 focus-within:ring-4 focus-within:ring-slate-100 transition-all">
                  <Code className="w-5 h-5 text-slate-700 shrink-0" />
                  <input name="github_url" defaultValue={editingDev?.github_url || ''} className="flex-1 bg-transparent outline-none font-medium text-slate-700 text-sm" placeholder="GitHub URL" />
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100 transition-all max-w-md">
                <Mail className="w-5 h-5 text-blue-500 shrink-0" />
                <input name="email" type="email" defaultValue={editingDev?.email || ''} className="flex-1 bg-transparent outline-none font-medium text-slate-700 text-sm" placeholder="이메일 주소" />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setIsAdding(false); setEditingDev(null); setPreviewUrl(null) }} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                취소
              </button>
              <button type="submit" disabled={isSubmitting || uploadingImage} className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 shadow-md shadow-purple-500/20 transition-all disabled:opacity-50">
                {isSubmitting ? '저장 중...' : editingDev ? '수정 내용 저장' : '개발자 등록'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Developer Cards */}
      {isPending ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      ) : developers?.length === 0 ? (
        <div className="bg-white rounded-[32px] p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="w-24 h-24 bg-purple-50 text-purple-300 rounded-full flex items-center justify-center mb-6">
            <Code2 className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">아직 등록된 개발자가 없습니다</h3>
          <p className="text-slate-500">이 서비스를 만든 멋진 개발자들을 소개해보세요! 💻</p>
        </div>
      ) : (
        <div className="space-y-8">
          {developers?.map((dev, index) => (
            <div key={dev.id} className="bg-white rounded-[32px] overflow-hidden border border-purple-100/50 shadow-sm hover:shadow-xl transition-all duration-500 group">
              <div className="flex flex-col md:flex-row">
                {/* Photo Section */}
                <div className="md:w-72 shrink-0 relative overflow-hidden bg-gradient-to-br from-violet-100 to-fuchsia-100">
                  {dev.photo_url ? (
                    <div className="h-64 md:h-full min-h-[280px] relative flex items-center justify-center bg-slate-900">
                      <div className="hidden md:block absolute inset-0 bg-cover bg-center opacity-40 blur-2xl scale-125" style={{ backgroundImage: `url(${dev.photo_url})` }}></div>
                      <img src={dev.photo_url} alt={dev.name} className="max-w-full max-h-full object-contain relative z-10 drop-shadow-2xl" />
                    </div>
                  ) : (
                    <div className="h-64 md:h-full min-h-[280px] flex items-center justify-center">
                      <div className="w-28 h-28 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center shadow-inner border border-white">
                        <User className="w-14 h-14 text-purple-300" />
                      </div>
                    </div>
                  )}
                  {/* Order Badge */}
                  <div className="absolute top-4 left-4 bg-purple-500 text-white text-xs font-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg z-20">
                    {index + 1}
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 p-8 flex flex-col">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 break-keep">{dev.name}</h3>
                      {dev.role && (
                        <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 bg-purple-50 text-purple-600 text-sm font-bold rounded-full whitespace-nowrap">
                          <Briefcase className="w-3.5 h-3.5" />
                          {dev.role}
                        </div>
                      )}
                    </div>
                  </div>

                  {dev.bio && (
                    <p className="text-lg font-medium text-slate-600 mb-4 leading-relaxed">{dev.bio}</p>
                  )}

                  {dev.introduction && (
                    <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100 flex-1">
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{dev.introduction}</p>
                    </div>
                  )}

                  {/* Social Links */}
                  {socialLinks(dev).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {socialLinks(dev).map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-md ${link.color}`}
                        >
                          <link.icon className="w-4 h-4" />
                          {link.label}
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Admin Actions */}
                  {['admin', 'developer'].includes(userRole as string) && (
                    <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-6">
                      <button
                        onClick={() => handleEditClick(dev)}
                        className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> 수정
                      </button>
                      <button
                        onClick={() => handleDelete(dev.id)}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> 삭제
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
