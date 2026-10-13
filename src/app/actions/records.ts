'use server'

import { createClient } from '@/utils/supabase/server'
import { logAudit } from './audit'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const recordSchema = z.object({
  schedule_id: z.string().uuid().optional().nullable().or(z.literal('')),
  athlete_id: z.string().uuid(),
  event_name: z.string().min(1, { message: '종목을 입력해주세요.' }),
  record_time: z.coerce.number().positive({ message: '유효한 기록을 입력해주세요 (초 단위).' }),
  record_date: z.string().min(10, { message: '기록일을 선택해주세요.' }),
  rank: z.coerce.number().nullable().optional(),
  match_type: z.string().nullable().optional(),
})

export async function addRecord(formData: FormData) {
  const supabase = await createClient()
  
  const rawData = {
    schedule_id: formData.get('schedule_id'),
    athlete_id: formData.get('athlete_id'),
    event_name: formData.get('event_name'),
    record_time: formData.get('record_time'),
    record_date: formData.get('record_date'),
    rank: formData.get('rank') || null,
    match_type: formData.get('match_type') || null,
  }

  const validatedFields = recordSchema.safeParse(rawData)
  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message }
  }

  const { error } = await supabase.from('records').insert([
    {
      schedule_id: validatedFields.data.schedule_id || null,
      athlete_id: validatedFields.data.athlete_id,
      event_name: validatedFields.data.event_name,
      record_time: validatedFields.data.record_time,
      record_date: validatedFields.data.record_date,
      rank: validatedFields.data.rank,
      match_type: validatedFields.data.match_type,
      is_deleted: false,
    }
  ])

  if (error) {
    return { error: '기록 등록에 실패했습니다: ' + error.message }
  }

  await logAudit('CREATE', 'records', { event_name: validatedFields.data.event_name })

  if (validatedFields.data.schedule_id) {
    revalidatePath(`/dashboard/competitions/${validatedFields.data.schedule_id}`)
  }
  revalidatePath('/dashboard/athletes')
  revalidatePath(`/dashboard/records/${validatedFields.data.athlete_id}`)
  return { success: true }
}

export type BulkRecordRow = {
  athlete_id: string
  event_name: string
  record_time: number
  record_date: string
  rank?: number | null
  match_type?: string | null
}

// 대회 기록 한꺼번에 등록 (대회 화면의 '기록 한꺼번에 입력', 엑셀 업로드)
export async function addRecordsBulk(scheduleId: string | null, rows: BulkRecordRow[]) {
  if (rows.length === 0) return { error: '등록할 기록이 없습니다.' }
  if (rows.length > 500) return { error: '한 번에 500건까지 등록할 수 있습니다.' }

  const valid = []
  for (const [i, row] of rows.entries()) {
    const parsed = recordSchema.safeParse({ ...row, schedule_id: scheduleId })
    if (!parsed.success) {
      return { error: `${i + 1}번째 기록: ${parsed.error.issues[0].message}` }
    }
    valid.push({
      schedule_id: scheduleId || null,
      athlete_id: parsed.data.athlete_id,
      event_name: parsed.data.event_name,
      record_time: parsed.data.record_time,
      record_date: parsed.data.record_date,
      rank: parsed.data.rank ?? null,
      match_type: parsed.data.match_type || null,
      is_deleted: false,
    })
  }

  const supabase = await createClient()
  const { error } = await supabase.from('records').insert(valid)
  if (error) return { error: '기록 등록에 실패했습니다: ' + error.message }

  await logAudit('CREATE', 'records', { bulk: true, count: valid.length, schedule_id: scheduleId })

  if (scheduleId) revalidatePath(`/dashboard/competitions/${scheduleId}`)
  revalidatePath('/dashboard/athletes')
  return { success: true, count: valid.length }
}

export async function updateRecord(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const rawData = {
    schedule_id: formData.get('schedule_id'),
    athlete_id: formData.get('athlete_id'),
    event_name: formData.get('event_name'),
    record_time: formData.get('record_time'),
    record_date: formData.get('record_date'),
    rank: formData.get('rank') || null,
    match_type: formData.get('match_type') || null,
  }

  const validatedFields = recordSchema.safeParse(rawData)
  if (!validatedFields.success) {
    return { error: validatedFields.error.issues[0].message }
  }

  const { error } = await supabase.from('records').update({
    event_name: validatedFields.data.event_name,
    record_time: validatedFields.data.record_time,
    record_date: validatedFields.data.record_date,
    rank: validatedFields.data.rank,
    match_type: validatedFields.data.match_type,
  }).eq('id', id)

  if (error) {
    return { error: '기록 수정에 실패했습니다: ' + error.message }
  }

  await logAudit('UPDATE', 'records', { id, event_name: validatedFields.data.event_name })

  if (validatedFields.data.schedule_id) {
    revalidatePath(`/dashboard/competitions/${validatedFields.data.schedule_id}`)
  }
  revalidatePath('/dashboard/athletes')
  revalidatePath(`/dashboard/records/${validatedFields.data.athlete_id}`)
  return { success: true }
}

export async function deleteRecord(id: string, schedule_id?: string | null) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('records')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) {
    return { error: '기록 삭제에 실패했습니다: ' + error.message }
  }

  await logAudit('DELETE', 'records', { id })

  if (schedule_id) {
    revalidatePath(`/dashboard/competitions/${schedule_id}`)
  }
  revalidatePath('/dashboard/athletes')
  return { success: true }
}
