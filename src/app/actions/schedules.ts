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
  participants: z.array(z.string()).optional(),
})

export async function addSchedule(formData: FormData) {
  const supabase = await createClient()
  
  // Get participants (if passed as JSON or multiple values)
  const participantsStr = formData.get('participants')
  let participants: string[] = []
  if (participantsStr && typeof participantsStr === 'string') {
    try {
      participants = JSON.parse(participantsStr)
    } catch(e) {
      // In case it's comma separated or just single id
    }
  }

  const rawData = {
    type: formData.get('type'),
    title: formData.get('title'),
    date: formData.get('date'),
    end_date: formData.get('end_date') ? formData.get('end_date') : undefined,
    description: formData.get('description') || '',
    location: formData.get('location') || '',
    participants,
  }

  const validatedFields = scheduleSchema.safeParse(rawData)
  if (!validatedFields.success) {
    // @ts-expect-error: zod error typing
    return { error: validatedFields.error.errors[0].message }
  }

  const { data: authData, error: userError } = await supabase.auth.getUser()
  if (userError || !authData?.user) {
    return { error: '인증에 실패했습니다. 다시 로그인해주세요.' }
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (!['admin', 'developer'].includes(userRecord?.role as string) && userRecord?.role !== 'coach') {
    return { error: '관리자 또는 코치만 훈련 일정을 수정할 수 있습니다.' }
  }

  const { error } = await supabase.from('schedules').insert([
    {
      ...validatedFields.data,
      created_by: authData.user.id,
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

export async function updateSchedule(id: string, formData: FormData) {
  const supabase = await createClient()

  const rawData = {
    type: formData.get('type'),
    title: formData.get('title'),
    date: formData.get('date'),
    end_date: formData.get('end_date') ? formData.get('end_date') : undefined,
    description: formData.get('description') || '',
    location: formData.get('location') || '',
  }

  // Reuse scheduleSchema but omit participants if not updating them here
  const validatedFields = scheduleSchema.safeParse(rawData)
  if (!validatedFields.success) {
    // @ts-expect-error: zod error typing
    return { error: validatedFields.error.errors[0].message }
  }

  const { data: authData, error: userError } = await supabase.auth.getUser()
  if (userError || !authData?.user) {
    return { error: '인증에 실패했습니다. 다시 로그인해주세요.' }
  }

  const { data: userRecord } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()

  if (!['admin', 'developer'].includes(userRecord?.role as string) && userRecord?.role !== 'coach') {
    return { error: '관리자 또는 코치만 일정을 수정할 수 있습니다.' }
  }

  const { data, error } = await supabase
    .from('schedules')
    .update({
      ...validatedFields.data,
    })
    .eq('id', id)
    .select()

  if (error) {
    return { error: '일정 수정에 실패했습니다: ' + error.message }
  }

  if (!data || data.length === 0) {
    return { error: '권한이 부족하거나 존재하지 않는 일정입니다.' }
  }

  await logAudit('UPDATE', 'schedules', { id, title: validatedFields.data.title })

  revalidatePath('/dashboard/training')
  revalidatePath('/dashboard/competitions')
  revalidatePath(`/dashboard/competitions/${id}`)
  return { success: true }
}

export async function softDeleteSchedule(id: string) {
  const supabase = await createClient()
  
  const { data: authData, error: userError } = await supabase.auth.getUser()
  if (userError || !authData?.user) return { error: '인증에 실패했습니다.' }

  const { data: userRecord } = await supabase.from('users').select('role').eq('id', authData.user.id).single()
  if (!['admin', 'developer'].includes(userRecord?.role as string) && userRecord?.role !== 'coach') {
    return { error: '권한이 없습니다.' }
  }

  const { data, error } = await supabase
    .from('schedules')
    .update({ is_deleted: true })
    .eq('id', id)
    .select()

  if (error) {
    return { error: '일정 삭제에 실패했습니다: ' + error.message }
  }

  if (!data || data.length === 0) {
    return { error: '권한이 부족하거나 존재하지 않는 일정입니다.' }
  }

  await logAudit('DELETE', 'schedules', { id })

  revalidatePath('/dashboard/training')
  return { success: true }
}

export async function updateScheduleParticipants(id: string, participants: string[]) {
  const supabase = await createClient()
  
  const { data: authData, error: userError } = await supabase.auth.getUser()
  if (userError || !authData?.user) return { error: '인증에 실패했습니다.' }

  const { data: userRecord } = await supabase.from('users').select('role').eq('id', authData.user.id).single()
  if (!['admin', 'developer'].includes(userRecord?.role as string) && userRecord?.role !== 'coach') {
    return { error: '권한이 없습니다.' }
  }

  const { data, error } = await supabase
    .from('schedules')
    .update({ participants })
    .eq('id', id)
    .select()

  if (error) {
    return { error: '참여 선수 수정에 실패했습니다: ' + error.message }
  }

  if (!data || data.length === 0) {
    return { error: '권한이 부족하거나 존재하지 않는 일정입니다.' }
  }

  await logAudit('UPDATE', 'schedules', { id, action: 'update_participants' })

  revalidatePath('/dashboard/competitions')
  revalidatePath(`/dashboard/competitions/${id}`)
  return { success: true }
}

export async function updateScheduleLocation(id: string, location: string) {
  const supabase = await createClient()
  
  const { data: authData, error: userError } = await supabase.auth.getUser()
  if (userError || !authData?.user) return { error: '인증에 실패했습니다.' }

  const { data: userRecord } = await supabase.from('users').select('role').eq('id', authData.user.id).single()
  if (!['admin', 'developer'].includes(userRecord?.role as string) && userRecord?.role !== 'coach') {
    return { error: '권한이 없습니다.' }
  }

  const { data, error } = await supabase
    .from('schedules')
    .update({ location })
    .eq('id', id)
    .select()

  if (error) {
    return { error: '장소 수정에 실패했습니다: ' + error.message }
  }

  if (!data || data.length === 0) {
    return { error: '권한이 부족하거나 존재하지 않는 일정입니다.' }
  }

  await logAudit('UPDATE', 'schedules', { id, action: 'update_location', location })

  revalidatePath('/dashboard/competitions')
  revalidatePath(`/dashboard/competitions/${id}`)
  return { success: true }
}

export async function updateSchedulePlaces(id: string, type: 'accommodations' | 'restaurants', places: any[]) {
  const supabase = await createClient()
  
  const { data: authData, error: userError } = await supabase.auth.getUser()
  if (userError || !authData?.user) return { error: '인증에 실패했습니다.' }

  const { data: userRecord } = await supabase.from('users').select('role').eq('id', authData.user.id).single()
  if (!['admin', 'developer'].includes(userRecord?.role as string) && userRecord?.role !== 'coach') {
    return { error: '권한이 없습니다.' }
  }

  const updateData = type === 'accommodations' ? { accommodations: places } : { restaurants: places }

  const { data, error } = await supabase
    .from('schedules')
    .update(updateData)
    .eq('id', id)
    .select()

  if (error) {
    return { error: `${type === 'accommodations' ? '숙소' : '식당'} 정보 수정에 실패했습니다: ` + error.message }
  }

  if (!data || data.length === 0) {
    return { error: '권한이 부족하거나 존재하지 않는 일정입니다.' }
  }

  await logAudit('UPDATE', 'schedules', { id, action: `update_${type}` })

  revalidatePath(`/dashboard/competitions/${id}`)
  return { success: true }
}
