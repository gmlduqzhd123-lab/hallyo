'use server'

import { createClient } from '@/utils/supabase/server'
import { logAudit } from './audit'
import { revalidatePath } from 'next/cache'

export async function addDeveloper(data: {
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
}) {
  const supabase = await createClient()

  const { error } = await supabase.from('developers').insert([{
    ...data,
    is_deleted: false,
  }])

  if (error) {
    return { error: '개발자 등록에 실패했습니다: ' + error.message }
  }

  await logAudit('CREATE', 'developers', { name: data.name })
  revalidatePath('/dashboard/developers')
  return { success: true }
}

export async function updateDeveloper(id: string, data: {
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
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('developers')
    .update(data)
    .eq('id', id)

  if (error) {
    return { error: '개발자 수정에 실패했습니다: ' + error.message }
  }

  await logAudit('UPDATE', 'developers', { id, name: data.name })
  revalidatePath('/dashboard/developers')
  return { success: true }
}

export async function deleteDeveloper(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('developers')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) {
    return { error: '개발자 삭제에 실패했습니다: ' + error.message }
  }

  await logAudit('DELETE', 'developers', { id })
  revalidatePath('/dashboard/developers')
  return { success: true }
}
