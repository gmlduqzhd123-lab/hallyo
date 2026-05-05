'use server'

import { createClient } from '@/utils/supabase/server'
import { logAudit } from './audit'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const athleteSchema = z.object({
  category: z.string().nullable().optional(),
  gender: z.enum(['M', 'F']),
  name: z.string().min(2, { message: '이름은 2자 이상 입력해주세요.' }),
  hanja_name: z.string().nullable().optional(),
  is_registered: z.boolean().nullable().optional(),
  birth_date: z.string().nullable().optional(),
  attendance_start_date: z.string().nullable().optional(),
  attendance_end_date: z.string().nullable().optional(),
  join_date: z.string().nullable().optional(),
  grade: z.coerce.number().min(1).max(6).nullable().optional().or(z.literal(0)),
  class_number: z.string().nullable().optional(),
  student_number: z.coerce.number().nullable().optional().or(z.literal(0)),
  homeroom_teacher: z.string().nullable().optional(),
  student_phone: z.string().nullable().optional(),
  parent_name: z.string().nullable().optional(),
  parent_phone: z.string().nullable().optional(),
})

export async function addAthlete(formData: FormData) {
  const supabase = await createClient()
  
  const rawData = {
    category: formData.get('category'),
    gender: formData.get('gender'),
    name: formData.get('name'),
    hanja_name: formData.get('hanja_name'),
    is_registered: formData.get('is_registered') === 'true',
    birth_date: formData.get('birth_date') || null,
    attendance_start_date: formData.get('attendance_start_date') || null,
    attendance_end_date: formData.get('attendance_end_date') || null,
    join_date: formData.get('join_date') || null,
    grade: formData.get('grade') ? Number(formData.get('grade')) : 0,
    class_number: formData.get('class_number') || '',
    student_number: formData.get('student_number') ? Number(formData.get('student_number')) : 0,
    homeroom_teacher: formData.get('homeroom_teacher') || '',
    student_phone: formData.get('student_phone') || '',
    parent_name: formData.get('parent_name') || '',
    parent_phone: formData.get('parent_phone') || '',
  }

  const validatedFields = athleteSchema.safeParse(rawData)
  if (!validatedFields.success) {
    // @ts-expect-error: zod error typing
    return { error: validatedFields.error.errors[0].message }
  }

  const { error } = await supabase.from('athletes').insert([
    {
      category: validatedFields.data.category || null,
      gender: validatedFields.data.gender,
      name: validatedFields.data.name,
      hanja_name: validatedFields.data.hanja_name || null,
      is_registered: validatedFields.data.is_registered,
      birth_date: validatedFields.data.birth_date || null,
      attendance_start_date: validatedFields.data.attendance_start_date || null,
      attendance_end_date: validatedFields.data.attendance_end_date || null,
      join_date: validatedFields.data.join_date || null,
      grade: validatedFields.data.grade || null,
      class_number: validatedFields.data.class_number || null,
      student_number: validatedFields.data.student_number || null,
      homeroom_teacher: validatedFields.data.homeroom_teacher || null,
      student_phone: validatedFields.data.student_phone || null,
      parent_name: validatedFields.data.parent_name || null,
      parent_phone: validatedFields.data.parent_phone || null,
      is_deleted: false,
    }
  ])

  if (error) {
    return { error: '선수 등록에 실패했습니다: ' + error.message }
  }

  await logAudit('CREATE', 'athletes', { name: validatedFields.data.name, grade: validatedFields.data.grade })

  revalidatePath('/dashboard/athletes')
  return { success: true }
}

export async function softDeleteAthlete(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('athletes')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) {
    return { error: '선수 삭제에 실패했습니다: ' + error.message }
  }

  await logAudit('DELETE', 'athletes', { id })

  revalidatePath('/dashboard/athletes')
  return { success: true }
}

export async function bulkAddAthletes(athletes: Record<string, any>[]) {
  const supabase = await createClient()

  // Minimal validation: name and gender are required
  const cleanedRows = []
  for (const a of athletes) {
    const name = String(a.name || '').trim()
    const gender = String(a.gender || '').trim()

    if (!name || name.length < 1) continue           // skip rows without a name
    if (gender !== 'M' && gender !== 'F') continue    // skip rows without valid gender

    const toNullStr  = (v: any) => { const s = String(v ?? '').trim(); return s === '' || s === 'undefined' || s === 'null' ? null : s }
    const toNullDate = (v: any) => { const s = String(v ?? '').trim(); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null }
    const toNullInt  = (v: any) => { const n = Number(v); return isNaN(n) || n === 0 ? null : n }

    cleanedRows.push({
      name,
      gender,
      category: toNullStr(a.category),
      hanja_name: toNullStr(a.hanja_name),
      is_registered: a.is_registered === true,
      birth_date: toNullDate(a.birth_date),
      attendance_start_date: toNullDate(a.attendance_start_date),
      attendance_end_date: toNullDate(a.attendance_end_date),
      join_date: toNullDate(a.join_date),
      grade: toNullInt(a.grade),
      class_number: toNullStr(a.class_number),
      student_number: toNullInt(a.student_number),
      homeroom_teacher: toNullStr(a.homeroom_teacher),
      student_phone: toNullStr(a.student_phone),
      parent_name: toNullStr(a.parent_name),
      parent_phone: toNullStr(a.parent_phone),
      is_deleted: false,
    })
  }

  if (cleanedRows.length === 0) {
    return { error: '유효한 선수 데이터가 없습니다. 이름과 성별은 필수입니다.' }
  }

  const { error } = await supabase.from('athletes').insert(cleanedRows)

  if (error) {
    return { error: '일괄 등록에 실패했습니다: ' + error.message }
  }

  await logAudit('CREATE', 'athletes', { bulk: true, count: cleanedRows.length })

  revalidatePath('/dashboard/athletes')
  return { success: true }
}
