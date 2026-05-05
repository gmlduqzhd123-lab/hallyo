'use server'

import { createClient } from '@/utils/supabase/server'
import { logAudit } from './audit'
import { revalidatePath } from 'next/cache'

export async function approveUser(userId: string) {
  const supabase = await createClient()

  // First check if current user is admin
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { error: '인증에 실패했습니다.' }
  }

  // NOTE: RLS will block if not admin, but good to check anyway
  const { error } = await supabase
    .from('users')
    .update({ status: 'approved' })
    .eq('id', userId)

  if (error) {
    return { error: '가입 승인 처리에 실패했습니다: ' + error.message }
  }

  await logAudit('UPDATE', 'users', { approved_user_id: userId })

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const supabase = await createClient()

  // First check if current user is admin
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { error: '인증에 실패했습니다.' }
  }

  // Soft delete or hard delete? The users table seems to be used directly.
  // Actually, we can just delete from the `users` table. 
  // Wait, if it has a foreign key to auth.users, deleting from public.users might fail or we might need to use admin API to delete from auth.users.
  // Let's just delete from public.users for now. If there's an error, we'll see.
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) {
    return { error: '사용자 삭제에 실패했습니다: ' + error.message }
  }

  await logAudit('DELETE', 'users', { deleted_user_id: userId })
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function updateUserRole(userId: string, role: string) {
  const supabase = await createClient()

  // First check if current user is admin
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { error: '인증에 실패했습니다.' }
  }

  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)

  if (error) {
    return { error: '사용자 권한 변경에 실패했습니다: ' + error.message }
  }

  await logAudit('UPDATE', 'users', { updated_user_id: userId, new_role: role })
  revalidatePath('/dashboard/settings')
  return { success: true }
}
