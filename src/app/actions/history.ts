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
      { date, title, description, created_by: authData.user.id }
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

  const { data: roleData } = await supabase.from('users').select('role').eq('id', authData.user.id).single()
  const { data: historyItem } = await supabase.from('history').select('created_by').eq('id', id).single()

  if (!['admin', 'developer'].includes(roleData?.role as string) && historyItem?.created_by !== authData.user.id) {
    return { error: '관리자, 개발자 또는 작성자 본인만 연혁을 수정할 수 있습니다.' }
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

  const { data: roleData } = await supabase.from('users').select('role').eq('id', authData.user.id).single()
  const { data: historyItem } = await supabase.from('history').select('created_by').eq('id', id).single()

  if (!['admin', 'developer'].includes(roleData?.role as string) && historyItem?.created_by !== authData.user.id) {
    return { error: '관리자, 개발자 또는 작성자 본인만 연혁을 삭제할 수 있습니다.' }
  }

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
