// 서버(Server Actions)에서만 쓰는 사진 파일 정리 도우미
import type { createClient } from '@/utils/supabase/server'
import { photoPath } from '@/lib/storage'

type SupabaseServer = Awaited<ReturnType<typeof createClient>>

// 'photos' 버킷 파일을 쓰는 곳: 활동 사진, 보도 기사, 명예의 전당, 개발자 소개
const PHOTO_REFS = [
  { table: 'photos', column: 'url' },
  { table: 'news_articles', column: 'photo_url' },
  { table: 'hall_of_fame', column: 'photo_url' },
  { table: 'developers', column: 'photo_url' },
] as const

// 지우지 않은(is_deleted = false) 글이 쓰는 파일 경로 모음
export async function livePhotoPaths(supabase: SupabaseServer) {
  const paths = new Set<string>()
  for (const { table, column } of PHOTO_REFS) {
    const { data, error } = await supabase.from(table).select(column).eq('is_deleted', false)
    if (error) throw error
    for (const row of (data ?? []) as unknown as Record<string, string | null>[]) {
      const path = photoPath(row[column])
      if (path) paths.add(path)
    }
  }
  return paths
}

// 글을 지운 뒤 호출: 그 사진 파일을 다른 글이 쓰지 않으면 저장소에서도 지웁니다.
// 파일 정리에 실패해도 글 삭제는 그대로 둡니다 (남은 파일은 환경 설정의 정리 버튼으로 지울 수 있음).
export async function removePhotoFileIfUnused(supabase: SupabaseServer, url: string | null | undefined) {
  const path = photoPath(url)
  if (!path) return
  try {
    const live = await livePhotoPaths(supabase)
    if (live.has(path)) return
    await supabase.storage.from('photos').remove([path])
  } catch {
    // 무시
  }
}
