'use server'

import { createClient } from '@/utils/supabase/server'
import { logAudit } from './audit'
import { revalidatePath } from 'next/cache'

export async function addPhotos(urls: string[]) {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { error: '인증에 실패했습니다. 다시 로그인해주세요.' }
  }

  const { data: roleData } = await supabase.from('users').select('role').eq('id', userData.user.id).single()
  const status = roleData?.role === 'admin' ? 'approved' : 'pending'

  const inserts = urls.map(url => ({
    url,
    created_by: userData.user.id,
    is_deleted: false,
    status
  }))

  const { error } = await supabase.from('photos').insert(inserts)

  if (error) {
    return { error: '사진 정보 저장에 실패했습니다: ' + error.message }
  }

  await logAudit('CREATE', 'photos', { count: urls.length })

  revalidatePath('/dashboard/photos')
  return { success: true }
}

export async function softDeletePhoto(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('photos')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) {
    return { error: '사진 삭제에 실패했습니다: ' + error.message }
  }

  await logAudit('DELETE', 'photos', { id })

  revalidatePath('/dashboard/photos')
  return { success: true }
}

export async function approvePhoto(id: string) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: '인증에 실패했습니다.' }
  
  const { data: roleData } = await supabase.from('users').select('role').eq('id', userData.user.id).single()
  if (roleData?.role !== 'admin') return { error: '권한이 없습니다.' }

  const { error } = await supabase
    .from('photos')
    .update({ status: 'approved' })
    .eq('id', id)

  if (error) {
    return { error: '사진 승인에 실패했습니다: ' + error.message }
  }

  await logAudit('UPDATE', 'photos_approve', { id })
  revalidatePath('/dashboard/photos')
  return { success: true }
}
