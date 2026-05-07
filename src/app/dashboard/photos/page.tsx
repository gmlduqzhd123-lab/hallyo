'use client'

import { useState, useRef } from 'react'
import { Image as ImageIcon, Upload, Trash2, Maximize2, X, Download, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { addPhotos, softDeletePhoto, approvePhoto } from '@/app/actions/photos'

export default function PhotosPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const queryClient = useQueryClient()

  const handleDownload = async (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `photo-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('사진이 성공적으로 다운로드되었습니다.');
    } catch (error) {
      toast.error('사진 다운로드에 실패했습니다.');
    }
  };


  const { data: userRole, isPending: rolePending } = useQuery({
    queryKey: ['user_role'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return null
      const { data } = await supabase.from('users').select('role').eq('id', authData.user.id).single()
      return data?.role
    }
  })

  const { data: photos, isPending } = useQuery({
    queryKey: ['photos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const visiblePhotos = photos?.filter(p => userRole === 'admin' || p.status === 'approved') || []

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      setIsUploading(true)
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, file, { upsert: false })

        if (uploadError) {
          throw new Error(`이미지 업로드 실패: ${uploadError.message}`)
        }

        const { data } = supabase.storage.from('photos').getPublicUrl(filePath)
        uploadedUrls.push(data.publicUrl)
      }

      const res = await addPhotos(uploadedUrls)
      if (res.error) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      toast.success('사진이 성공적으로 업로드되었습니다.', { style: { background: '#0047AB', color: 'white' } })
      queryClient.invalidateQueries({ queryKey: ['photos'] })
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
    onSettled: () => {
      setIsUploading(false)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await softDeletePhoto(id)
      if (res.error) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      toast.success('사진이 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['photos'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await approvePhoto(id)
      if (res.error) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      toast.success('사진이 승인되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['photos'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadMutation.mutate(e.target.files)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-500 rounded-xl shrink-0">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-accent-navy">활동 사진</h1>
            <p className="text-sm text-slate-500 font-medium break-keep">선수들의 다양한 활동 사진을 갤러리 형태로 확인하세요.</p>
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple 
            accept="image/*"
            className="hidden"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full sm:w-auto flex justify-center items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/30 shrink-0 whitespace-nowrap"
          >
            <Upload className="w-5 h-5" />
            {isUploading ? '업로드 중...' : '사진 올리기'}
          </button>
        </div>
      </div>
      
      {isPending || rolePending ? (
        <div className="py-20 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-100">
          사진을 불러오는 중입니다...
        </div>
      ) : visiblePhotos.length === 0 ? (
        <div className="bg-white p-20 rounded-3xl shadow-sm border border-slate-100 text-center flex flex-col items-center gap-4">
          <div className="bg-slate-50 p-6 rounded-full inline-block">
            <ImageIcon className="w-12 h-12 text-slate-300" />
          </div>
          <p className="text-slate-400 font-medium">아직 등록된 활동 사진이 없습니다.<br/>위의 버튼을 눌러 멋진 사진들을 한 번에 여러 장 올려 보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {visiblePhotos.map((photo: any) => (
            <div key={photo.id} className="group relative aspect-square rounded-3xl overflow-hidden bg-slate-100 shadow-sm border border-slate-100">
              {photo.status === 'pending' && (
                <div className="absolute top-3 left-3 bg-rose-500 text-white px-2 py-1 text-xs font-bold rounded-lg z-10">
                  승인 대기
                </div>
              )}
              <img 
                src={photo.url} 
                alt="활동 사진" 
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${photo.status === 'pending' ? 'opacity-50 grayscale' : ''}`}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
                <button 
                  onClick={() => setSelectedPhoto(photo.url)}
                  className="p-3 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full transition-transform transform hover:scale-110 shadow-lg"
                  title="사진 크게 보기"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={(e) => handleDownload(photo.url, e)}
                  className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full transition-transform transform hover:scale-110 shadow-lg"
                  title="사진 다운로드"
                >
                  <Download className="w-5 h-5" />
                </button>
                {photo.status === 'pending' && userRole === 'admin' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); approveMutation.mutate(photo.id) }}
                    className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-transform transform hover:scale-110 shadow-lg"
                    title="사진 승인"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                )}
                {(userRole === 'admin' || userRole === 'coach') && (
                  <button 
                    onClick={() => { if(confirm('이 사진을 정말 삭제하시겠습니까?')) deleteMutation.mutate(photo.id) }}
                    className="p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition-transform transform hover:scale-110 shadow-lg"
                    title="사진 삭제"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="absolute top-6 right-6 flex items-center gap-3">
            <button 
              className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/30 rounded-full transition-all"
              onClick={(e) => handleDownload(selectedPhoto, e)}
              title="다운로드"
            >
              <Download className="w-6 h-6" />
            </button>
            <button 
              className="p-2 text-white/50 hover:text-white bg-white/10 hover:bg-white/30 rounded-full transition-all"
              onClick={() => setSelectedPhoto(null)}
              title="닫기"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <img 
            src={selectedPhoto} 
            alt="확대된 사진" 
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
