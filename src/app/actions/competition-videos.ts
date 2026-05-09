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

  const { data: roleData } = await supabase.from('users').select('role').eq('id', userData.user.id).single()
  const status = ['admin', 'developer'].includes(roleData?.role as string) ? 'approved' : 'pending'

  const { error } = await supabase
    .from('competition_videos')
    .insert([
      {
        title: data.title,
        url: data.url,
        description: data.description,
        created_by: userData.user.id,
        status
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
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: '인증에 실패했습니다.' }

  const { data: roleData } = await supabase.from('users').select('role').eq('id', userData.user.id).single()
  const { data: video } = await supabase.from('competition_videos').select('created_by').eq('id', id).single()

  if (!['admin', 'developer'].includes(roleData?.role as string) && video?.created_by !== userData.user.id) {
    return { error: '관리자, 개발자 또는 작성자 본인만 영상을 삭제할 수 있습니다.' }
  }

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

export async function updateCompetitionVideo(id: string, data: { title: string, url: string, description?: string }) {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { error: '인증에 실패했습니다. 다시 로그인해주세요.' }
  }

  const { data: roleData } = await supabase.from('users').select('role').eq('id', userData.user.id).single()
  const { data: video } = await supabase.from('competition_videos').select('created_by').eq('id', id).single()

  if (!['admin', 'developer'].includes(roleData?.role as string) && video?.created_by !== userData.user.id) {
    return { error: '관리자, 개발자 또는 작성자 본인만 영상을 수정할 수 있습니다.' }
  }

  const { error } = await supabase
    .from('competition_videos')
    .update({
      title: data.title,
      url: data.url,
      description: data.description,
    })
    .eq('id', id)

  if (error) {
    return { error: '영상 수정에 실패했습니다: ' + error.message }
  }

  await logAudit('UPDATE', 'competition_videos', { id, title: data.title })

  revalidatePath('/dashboard/competition-videos')
  return { success: true }
}

export async function approveCompetitionVideo(id: string) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: '인증에 실패했습니다.' }
  
  const { data: roleData } = await supabase.from('users').select('role').eq('id', userData.user.id).single()
  if (!['admin', 'developer'].includes(roleData?.role as string)) return { error: '권한이 없습니다.' }

  const { error } = await supabase
    .from('competition_videos')
    .update({ status: 'approved' })
    .eq('id', id)

  if (error) {
    return { error: '영상 승인에 실패했습니다: ' + error.message }
  }

  await logAudit('UPDATE', 'competition_videos_approve', { id })
  revalidatePath('/dashboard/competition-videos')
  return { success: true }
}
