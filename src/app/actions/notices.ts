'use server'

import { createClient } from '@/utils/supabase/server'
import { logAudit } from './audit'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const noticeSchema = z.object({
  title: z.string().min(2, { message: '제목은 2자 이상 입력해주세요.' }),
  content: z.string().min(2, { message: '내용을 입력해주세요.' }),
})

export async function addNotice(formData: FormData) {
  const supabase = await createClient()
  
  const rawData = {
    title: formData.get('title'),
    content: formData.get('content'),
  }

  const validatedFields = noticeSchema.safeParse(rawData)
  if (!validatedFields.success) {
    // @ts-expect-error: zod error typing
    return { error: validatedFields.error.errors[0].message }
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { error: '인증에 실패했습니다. 다시 로그인해주세요.' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: '관리자만 공지사항을 등록할 수 있습니다.' }
  }

  const { error } = await supabase.from('notices').insert([
    {
      ...validatedFields.data,
      created_by: userData.user.id,
      is_deleted: false,
    }
  ])

  if (error) {
    return { error: '공지사항 등록에 실패했습니다: ' + error.message }
  }

  await logAudit('CREATE', 'notices', { title: validatedFields.data.title })

  revalidatePath('/dashboard/notices')
  return { success: true }
}

export async function softDeleteNotice(id: string) {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { error: '인증에 실패했습니다. 다시 로그인해주세요.' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: '관리자만 공지사항을 삭제할 수 있습니다.' }
  }

  const { error } = await supabase
    .from('notices')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) {
    return { error: '공지사항 삭제에 실패했습니다: ' + error.message }
  }

  await logAudit('DELETE', 'notices', { id })

  revalidatePath('/dashboard/notices')
  return { success: true }
}
