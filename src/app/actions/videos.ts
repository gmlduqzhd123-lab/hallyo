'use server'

import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const videoSchema = z.object({
  url: z.string().url({ message: '올바른 URL을 입력해주세요.' }),
  title: z.string().min(1, { message: '제목을 입력해주세요.' }),
  description: z.string().optional(),
})

export async function addVideo(formData: FormData) {
  const supabase = await createClient()
  
  const rawData = {
    url: formData.get('url'),
    title: formData.get('title'),
    description: formData.get('description'),
  }

  const validatedFields = videoSchema.safeParse(rawData)
  if (!validatedFields.success) {
    // @ts-expect-error: zod error typing
    return { error: validatedFields.error.errors[0].message }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from('training_videos').insert([
    {
      url: validatedFields.data.url,
      title: validatedFields.data.title,
      description: validatedFields.data.description,
      is_deleted: false,
      created_by: user?.id,
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
  
  const { error } = await supabase
    .from('training_videos')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) {
    return { error: '영상 삭제에 실패했습니다: ' + error.message }
  }

  revalidatePath('/dashboard/videos')
  return { success: true }
}
