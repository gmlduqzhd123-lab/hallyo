'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addDeveloperNote(content: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (!userData || !['admin', 'developer'].includes(userData.role)) {
    return { error: '개발자 권한이 필요합니다.' }
  }
  
  const { data, error } = await supabase
    .from('developer_notes')
    .insert([{ content, created_by: user.id }])
    .select()
    .single()
    
  if (error) {
    console.error('Add note error:', error)
    return { error: '개발 노트 등록에 실패했습니다.' }
  }
  
  revalidatePath('/dashboard/developers')
  return { data }
}

export async function updateDeveloperNote(id: string, content: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (!userData || !['admin', 'developer'].includes(userData.role)) {
    return { error: '개발자 권한이 필요합니다.' }
  }
  
  const { data, error } = await supabase
    .from('developer_notes')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
    
  if (error) {
    console.error('Update note error:', error)
    return { error: '개발 노트 수정에 실패했습니다.' }
  }
  
  revalidatePath('/dashboard/developers')
  return { data }
}

export async function deleteDeveloperNote(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
    
  if (!userData || !['admin', 'developer'].includes(userData.role)) {
    return { error: '개발자 권한이 필요합니다.' }
  }
  
  const { error } = await supabase
    .from('developer_notes')
    .update({ is_deleted: true })
    .eq('id', id)
    
  if (error) {
    console.error('Delete note error:', error)
    return { error: '개발 노트 삭제에 실패했습니다.' }
  }
  
  revalidatePath('/dashboard/developers')
  return { success: true }
}
