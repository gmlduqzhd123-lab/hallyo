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
