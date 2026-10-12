import { createClient } from '@/utils/supabase/server'

// 비공개 'photos' 버킷의 사진을 승인된 로그인 사용자에게만 전달합니다.
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('로그인이 필요합니다.', { status: 401 })

  const { data: profile } = await supabase.from('users').select('status').eq('id', user.id).single()
  if (profile?.status !== 'approved') return new Response('승인된 사용자만 볼 수 있습니다.', { status: 403 })

  const { data, error } = await supabase.storage.from('photos').download(path.join('/'))
  if (error || !data) return new Response('사진을 찾을 수 없습니다.', { status: 404 })

  return new Response(data, {
    headers: {
      'Content-Type': data.type || 'application/octet-stream',
      // 사용자별 권한이 걸린 파일이라 공용 캐시(CDN)에는 저장하지 않습니다
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
