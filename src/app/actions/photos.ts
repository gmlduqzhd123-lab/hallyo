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

  const inserts = urls.map(url => ({
    url,
    created_by: userData.user.id,
    is_deleted: false
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
