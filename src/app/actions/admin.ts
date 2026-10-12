'use server'

import { createClient } from '@/utils/supabase/server'
import { logAudit } from './audit'
import { revalidatePath } from 'next/cache'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

// 사용자 승인·역할 변경·삭제 등 회원 관리는 승인된 개발자만 할 수 있습니다.
// (DB 권한 규칙도 같은 기준이라, 여기서 먼저 확인해 분명한 오류 메시지를 돌려줍니다)
async function requireDeveloper(supabase: SupabaseServerClient, userId: string) {
  const { data } = await supabase.from('users').select('role, status').eq('id', userId).single()
  if (data?.role !== 'developer' || data?.status !== 'approved') {
    return { error: '회원 관리는 개발자만 할 수 있습니다.' }
  }
  return null
}

export async function approveUser(userId: string) {
  const supabase = await createClient()

  // 사용자 관리는 승인된 개발자만 할 수 있습니다
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { error: '인증에 실패했습니다.' }
  }

  const denied = await requireDeveloper(supabase, userData.user.id)
  if (denied) return { error: denied.error }

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

  // 사용자 관리는 승인된 개발자만 할 수 있습니다
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { error: '인증에 실패했습니다.' }
  }

  const denied = await requireDeveloper(supabase, userData.user.id)
  if (denied) return { error: denied.error }

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

  // 사용자 관리는 승인된 개발자만 할 수 있습니다
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { error: '인증에 실패했습니다.' }
  }

  const denied = await requireDeveloper(supabase, userData.user.id)
  if (denied) return { error: denied.error }

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

  // 사용자 관리는 승인된 개발자만 할 수 있습니다
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { error: '인증에 실패했습니다.' }
  }

  const denied = await requireDeveloper(supabase, userData.user.id)
  if (denied) return { error: denied.error }

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

export async function updateUserName(userId: string, newName: string) {
  const supabase = await createClient()

  // 사용자 관리는 승인된 개발자만 할 수 있습니다
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { error: '인증에 실패했습니다.' }
  }

  const denied = await requireDeveloper(supabase, userData.user.id)
  if (denied) return { error: denied.error }

  const { error } = await supabase
    .from('users')
    .update({ name: newName })
    .eq('id', userId)

  if (error) {
    return { error: '이름 변경에 실패했습니다: ' + error.message }
  }

  await logAudit('UPDATE', 'users', { updated_user_id: userId, new_name: newName })
  revalidatePath('/dashboard/settings')
  return { success: true }
}
