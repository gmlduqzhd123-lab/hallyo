'use server'

import { createClient } from '@/utils/supabase/server'
import { logAudit } from './audit'
import { livePhotoPaths } from '@/lib/photo-files'

// 개발자 전용: 어떤 글도 쓰지 않는 사진 파일을 한꺼번에 지웁니다.
// 방금 올리고 아직 저장하지 않은 파일을 지우지 않도록 하루 이상 지난 파일만 대상입니다.
export async function cleanupUnusedPhotoFiles() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return { error: '로그인이 필요합니다.' }

  const { data: me } = await supabase.from('users').select('role, status').eq('id', authData.user.id).single()
  if (me?.role !== 'developer' || me?.status !== 'approved') {
    return { error: '개발자만 사진 파일을 정리할 수 있습니다.' }
  }

  try {
    const live = await livePhotoPaths(supabase)
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    const unused: { name: string; size: number }[] = []

    for (let offset = 0; ; offset += 1000) {
      const { data: files, error } = await supabase.storage.from('photos').list('', { limit: 1000, offset })
      if (error) throw error
      for (const f of files ?? []) {
        if (!f.id) continue // 폴더
        if (live.has(f.name)) continue
        if (f.created_at && new Date(f.created_at).getTime() > cutoff) continue
        unused.push({ name: f.name, size: Number(f.metadata?.size ?? 0) })
      }
      if (!files || files.length < 1000) break
    }

    for (let i = 0; i < unused.length; i += 100) {
      const { error } = await supabase.storage.from('photos').remove(unused.slice(i, i + 100).map((f) => f.name))
      if (error) throw error
    }

    const bytes = unused.reduce((sum, f) => sum + f.size, 0)
    if (unused.length > 0) await logAudit('DELETE', 'storage_photos', { count: unused.length, bytes })
    return { success: true, count: unused.length, bytes }
  } catch (e) {
    return { error: '사진 파일 정리에 실패했습니다: ' + (e instanceof Error ? e.message : String(e)) }
  }
}
