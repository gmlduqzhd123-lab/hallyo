'use server'

import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const videoSchema = z.object({
  url: z.string().url({ message: '올바른 URL을 입력해주세요.' }),
  title: z.string().min(1, { message: '제목을 입력해주세요.' }),
  description: z.string().optional(),
  category: z.enum(['훈련 영상', '동기 유발', '수영 상식', '기타 수영 관련'], { message: '올바른 카테고리를 선택해주세요.' }),
  sub_category: z.string().optional(),
})

export async function addVideo(formData: FormData) {
  const supabase = await createClient()
  
  const rawData = {
    url: formData.get('url'),
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    sub_category: formData.get('sub_category'),
  }

  const validatedFields = videoSchema.safeParse(rawData)
  if (!validatedFields.success) {
    // @ts-expect-error: zod error typing
    return { error: validatedFields.error.errors[0].message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: roleData } = await supabase.from('users').select('role').eq('id', user?.id).single()
  const status = ['admin', 'developer', 'coach'].includes(roleData?.role as string) ? 'approved' : 'pending'

  const { error } = await supabase.from('training_videos').insert([
    {
      url: validatedFields.data.url,
      title: validatedFields.data.title,
      description: validatedFields.data.description,
      category: validatedFields.data.category,
      sub_category: validatedFields.data.category === '훈련 영상' ? (validatedFields.data.sub_category || '기타 영상') : null,
      is_deleted: false,
      created_by: user?.id,
      status
    }
  ])

  if (error) {
    return { error: '영상 등록에 실패했습니다: ' + error.message }
  }

  revalidatePath('/dashboard/videos')
  return { success: true }
}

export async function softDeleteVideo(id: string) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: '인증에 실패했습니다.' }

  const { data: roleData } = await supabase.from('users').select('role').eq('id', userData.user.id).single()
  const { data: video } = await supabase.from('training_videos').select('created_by').eq('id', id).single()

  if (!['admin', 'developer', 'coach'].includes(roleData?.role as string) && video?.created_by !== userData.user.id) {
    return { error: '관리자, 개발자, 코치 또는 작성자 본인만 영상을 삭제할 수 있습니다.' }
  }

  const { error } = await supabase
    .from('training_videos')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) {
    return { error: '영상 삭제에 실패했습니다: ' + error.message }
  }

  // audit logging added for training videos
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { logAudit } = await import('./audit')
    await logAudit('DELETE', 'training_videos', { id })
  }

  revalidatePath('/dashboard/videos')
  return { success: true }
}

export async function approveVideo(id: string) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: '인증에 실패했습니다.' }
  
  const { data: roleData } = await supabase.from('users').select('role').eq('id', userData.user.id).single()
  if (!['admin', 'developer', 'coach'].includes(roleData?.role as string)) return { error: '권한이 없습니다.' }

  const { error } = await supabase
    .from('training_videos')
    .update({ status: 'approved' })
    .eq('id', id)

  if (error) {
    return { error: '영상 승인에 실패했습니다: ' + error.message }
  }

  revalidatePath('/dashboard/videos')
  return { success: true }
}
