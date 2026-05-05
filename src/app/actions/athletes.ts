'use server'

import { createClient } from '@/utils/supabase/server'
import { logAudit } from './audit'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const athleteSchema = z.object({
  name: z.string().min(2, { message: '이름은 2자 이상 입력해주세요.' }),
  gender: z.enum(['M', 'F']),
  grade: z.coerce.number().min(1).max(6),
})

export async function addAthlete(formData: FormData) {
  const supabase = await createClient()
  
  const rawData = {
    name: formData.get('name'),
    gender: formData.get('gender'),
    grade: formData.get('grade'),
  }

  const validatedFields = athleteSchema.safeParse(rawData)
  if (!validatedFields.success) {
    // @ts-expect-error: zod error typing
    return { error: validatedFields.error.errors[0].message }
  }

  const { error } = await supabase.from('athletes').insert([
    {
      name: validatedFields.data.name,
      gender: validatedFields.data.gender,
      grade: validatedFields.data.grade,
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

export async function bulkAddAthletes(athletes: { name: string, gender: 'M' | 'F', grade: number }[]) {
  const supabase = await createClient()
  
  // Zod array validation
  const arraySchema = z.array(athleteSchema)
  const validated = arraySchema.safeParse(athletes)
  
  if (!validated.success) {
    return { error: '엑셀 데이터 형식이 올바르지 않습니다.' }
  }

  const { error } = await supabase.from('athletes').insert(
    validated.data.map(a => ({ ...a, is_deleted: false }))
  )

  if (error) {
    return { error: '일괄 등록에 실패했습니다: ' + error.message }
  }

  await logAudit('CREATE', 'athletes', { bulk: true, count: validated.data.length })

  revalidatePath('/dashboard/athletes')
  return { success: true }
}
