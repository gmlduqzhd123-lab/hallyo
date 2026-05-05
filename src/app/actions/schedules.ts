'use server'

import { createClient } from '@/utils/supabase/server'
import { logAudit } from './audit'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const scheduleSchema = z.object({
  type: z.enum(['training', 'competition']),
  title: z.string().min(2, { message: '제목은 2자 이상 입력해주세요.' }),
  date: z.string().min(10, { message: '올바른 시작일을 선택해주세요.' }),
  end_date: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
})

export async function addSchedule(formData: FormData) {
  const supabase = await createClient()
  
  const rawData = {
    type: formData.get('type'),
    title: formData.get('title'),
    date: formData.get('date'),
    end_date: formData.get('end_date') ? formData.get('end_date') : undefined,
    description: formData.get('description') || '',
    location: formData.get('location') || '',
  }

  const validatedFields = scheduleSchema.safeParse(rawData)
  if (!validatedFields.success) {
    // @ts-expect-error: zod error typing
    return { error: validatedFields.error.errors[0].message }
  }

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    return { error: '인증에 실패했습니다. 다시 로그인해주세요.' }
  }

  const { error } = await supabase.from('schedules').insert([
    {
      ...validatedFields.data,
      created_by: userData.user.id,
      is_deleted: false,
    }
  ])

  if (error) {
    return { error: '일정 등록에 실패했습니다: ' + error.message }
  }

  await logAudit('CREATE', 'schedules', { title: validatedFields.data.title, date: validatedFields.data.date })

  revalidatePath('/dashboard/training')
  return { success: true }
}

export async function softDeleteSchedule(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('schedules')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) {
    return { error: '일정 삭제에 실패했습니다: ' + error.message }
  }

  await logAudit('DELETE', 'schedules', { id })

  revalidatePath('/dashboard/training')
  return { success: true }
}
