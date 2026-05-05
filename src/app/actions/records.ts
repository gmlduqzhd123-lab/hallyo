'use server'

import { createClient } from '@/utils/supabase/server'
import { logAudit } from './audit'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const recordSchema = z.object({
  schedule_id: z.string().uuid(),
  athlete_id: z.string().uuid(),
  event_name: z.string().min(1, { message: '종목을 입력해주세요.' }),
  record_time: z.coerce.number().positive({ message: '유효한 기록을 입력해주세요 (초 단위).' }),
  record_date: z.string().min(10, { message: '기록일을 선택해주세요.' }),
})

export async function addRecord(formData: FormData) {
  const supabase = await createClient()
  
  const rawData = {
    schedule_id: formData.get('schedule_id'),
    athlete_id: formData.get('athlete_id'),
    event_name: formData.get('event_name'),
    record_time: formData.get('record_time'),
    record_date: formData.get('record_date'),
  }

  const validatedFields = recordSchema.safeParse(rawData)
  if (!validatedFields.success) {
    // @ts-expect-error: zod error typing
    return { error: validatedFields.error.errors[0].message }
  }

  const { error } = await supabase.from('records').insert([
    {
      schedule_id: validatedFields.data.schedule_id,
      athlete_id: validatedFields.data.athlete_id,
      event_name: validatedFields.data.event_name,
      record_time: validatedFields.data.record_time,
      record_date: validatedFields.data.record_date,
      is_deleted: false,
    }
  ])

  if (error) {
    return { error: '기록 등록에 실패했습니다: ' + error.message }
  }

  await logAudit('CREATE', 'records', { event_name: validatedFields.data.event_name })

  revalidatePath(`/dashboard/competitions/${validatedFields.data.schedule_id}`)
  return { success: true }
}

export async function deleteRecord(id: string, schedule_id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('records')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) {
    return { error: '기록 삭제에 실패했습니다: ' + error.message }
  }

  await logAudit('DELETE', 'records', { id })

  revalidatePath(`/dashboard/competitions/${schedule_id}`)
  return { success: true }
}
