'use server'

import { createClient } from '@/utils/supabase/server'
import { logAudit } from './audit'
import { revalidatePath } from 'next/cache'

export async function addCompetitionVideo(data: { title: string, url: string, description?: string }) {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { error: '인증에 실패했습니다. 다시 로그인해주세요.' }
  }

  const { error } = await supabase
    .from('competition_videos')
    .insert([
      {
        title: data.title,
        url: data.url,
        description: data.description,
        created_by: userData.user.id
      }
    ])

  if (error) {
    return { error: '영상 등록에 실패했습니다: ' + error.message }
  }

  await logAudit('CREATE', 'competition_videos', { title: data.title })

  revalidatePath('/dashboard/competition-videos')
  return { success: true }
}

export async function softDeleteCompetitionVideo(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('competition_videos')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) {
    return { error: '영상 삭제에 실패했습니다: ' + error.message }
  }

  await logAudit('DELETE', 'competition_videos', { id })

  revalidatePath('/dashboard/competition-videos')
  return { success: true }
}
