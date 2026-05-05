'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addHistory(formData: FormData) {
  const supabase = await createClient()
  
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return { error: '로그인이 필요합니다.' }

  const date = formData.get('date') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string

  if (!date || !title) {
    return { error: '날짜와 내용은 필수입니다.' }
  }

  const { error } = await supabase
    .from('history')
    .insert([
      { date, title, description }
    ])

  if (error) {
    return { error: '연혁 추가에 실패했습니다: ' + error.message }
  }

  revalidatePath('/dashboard/history')
  return { success: true }
}

export async function updateHistory(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return { error: '로그인이 필요합니다.' }

  const date = formData.get('date') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string

  if (!date || !title) {
    return { error: '날짜와 내용은 필수입니다.' }
  }

  const { error } = await supabase
    .from('history')
    .update({ date, title, description })
    .eq('id', id)

  if (error) {
    return { error: '연혁 수정에 실패했습니다: ' + error.message }
  }

  revalidatePath('/dashboard/history')
  return { success: true }
}

export async function deleteHistory(id: string) {
  const supabase = await createClient()
  
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase
    .from('history')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) {
    return { error: '연혁 삭제에 실패했습니다: ' + error.message }
  }

  revalidatePath('/dashboard/history')
  return { success: true }
}
