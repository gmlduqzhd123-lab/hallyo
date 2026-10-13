'use server'

import { createClient } from '@/utils/supabase/server'
import { logAudit } from './audit'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const noticeSchema = z.object({
  title: z.string().min(2, { message: '제목은 2자 이상 입력해주세요.' }),
  content: z.string().min(2, { message: '내용을 입력해주세요.' }),
  // 전체 공개: 로그인하지 않은 방문자(둘러보기)에게도 보임
  is_public: z.boolean(),
})

export async function addNotice(formData: FormData) {
  const supabase = await createClient()
  
  const rawData = {
    title: formData.get('title'),
    content: formData.get('content'),
    is_public: formData.get('is_public') === 'true',
  }

  const validatedFields = noticeSchema.safeParse(rawData)
  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message }
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

  if (!['admin', 'coach', 'developer'].includes(profile?.role as string)) {
    return { error: '관리자, 코치 또는 개발자만 공지사항을 등록할 수 있습니다.' }
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

  const { data: notice } = await supabase.from('notices').select('created_by').eq('id', id).single()

  if (!['developer'].includes(profile?.role as string) && notice?.created_by !== userData.user.id) {
    return { error: '개발자 또는 작성자 본인만 공지사항을 삭제할 수 있습니다.' }
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

// 공지를 전체 공개 / 회원 전용으로 바꿈 (관리자·코치·개발자)
export async function setNoticePublic(id: string, isPublic: boolean) {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: '인증에 실패했습니다.' }

  const { data: profile } = await supabase.from('users').select('role').eq('id', userData.user.id).single()
  if (!['admin', 'coach', 'developer'].includes(profile?.role as string)) {
    return { error: '관리자, 코치 또는 개발자만 바꿀 수 있습니다.' }
  }

  const { error } = await supabase.from('notices').update({ is_public: isPublic }).eq('id', id)
  if (error) return { error: '공개 설정을 바꾸지 못했습니다: ' + error.message }

  await logAudit('UPDATE', 'notices', { id, is_public: isPublic })
  revalidatePath('/dashboard/notices')
  return { success: true }
}
