import { createClient } from '@/utils/supabase/server'

// 비공개 'photos' 버킷의 사진을 전달합니다. 누가 어떤 파일을 볼 수 있는지는 저장소 권한 규칙이 정합니다.
// - 승인된 회원: 모든 사진
// - 비회원: 공개 글(보도 기사·명예의 전당·개발자 소개)에 붙은 사진만 (supabase/manual/2026-10-13_guest_browsing.sql)
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.storage.from('photos').download(path.join('/'))
  if (error || !data) return new Response('사진을 찾을 수 없거나 볼 수 있는 권한이 없습니다.', { status: 404 })

  return new Response(data, {
    headers: {
      'Content-Type': data.type || 'application/octet-stream',
      // 사용자별 권한이 걸린 파일이라 공용 캐시(CDN)에는 저장하지 않습니다
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
