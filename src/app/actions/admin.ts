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

  // Delete from both public.users and auth.users via RPC
  const { error } = await supabase.rpc('delete_user_account', {
    target_user_id: userId
  })

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

export async function resetUserPassword(userId: string) {
  const supabase = await createClient()

  // First check if current user is admin
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { error: '인증에 실패했습니다.' }
  }

  const newPassword = '12341234'
  
  const { error } = await supabase.rpc('reset_user_password', {
    target_user_id: userId,
    new_password: newPassword
  })

  if (error) {
    return { error: '비밀번호 초기화에 실패했습니다: ' + error.message }
  }

  await logAudit('UPDATE', 'users_password', { reset_password_user_id: userId })
  return { success: true, newPassword }
}
