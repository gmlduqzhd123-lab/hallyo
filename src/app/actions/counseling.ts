'use server'

import { createClient } from '@/utils/supabase/server'
import { logAudit } from './audit'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const counselingSchema = z.object({
  athlete_id: z.string().min(1, { message: '선수를 선택해주세요.' }),
  date: z.string().min(10, { message: '올바른 날짜를 선택해주세요.' }),
  summary: z.string().min(2, { message: '상담 내용을 입력해주세요.' }),
})

export async function addCounselingLog(formData: FormData) {
  const supabase = await createClient()
  
  const rawData = {
    athlete_id: formData.get('athlete_id'),
    date: formData.get('date'),
    summary: formData.get('summary'),
  }

  const validatedFields = counselingSchema.safeParse(rawData)
  if (!validatedFields.success) {
    // @ts-expect-error: zod error typing
    return { error: validatedFields.error.errors[0].message }
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { error: '인증에 실패했습니다. 다시 로그인해주세요.' }
  }

  const { error } = await supabase.from('counseling_logs').insert([
    {
      ...validatedFields.data,
      created_by: userData.user.id,
      is_deleted: false,
    }
  ])

  if (error) {
    return { error: '상담 일지 등록에 실패했습니다: ' + error.message }
  }

  await logAudit('CREATE', 'counseling_logs', { athlete_id: validatedFields.data.athlete_id })

  revalidatePath('/dashboard/counseling')
  return { success: true }
}

export async function softDeleteCounselingLog(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('counseling_logs')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) {
    return { error: '상담 일지 삭제에 실패했습니다: ' + error.message }
  }

  await logAudit('DELETE', 'counseling_logs', { id })

  revalidatePath('/dashboard/counseling')
  return { success: true }
}
