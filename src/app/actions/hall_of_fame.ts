'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addHallOfFameRecord(data: { athlete_name: string; achievement: string; story?: string | null; photo_url?: string | null; article_url?: string | null }) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('hall_of_fame')
    .insert([{
      athlete_name: data.athlete_name,
      achievement: data.achievement,
      story: data.story || null,
      photo_url: data.photo_url || null,
      article_url: data.article_url || null,
      is_deleted: false,
    }])

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard/hall-of-fame')
  return { success: true }
}

export async function updateHallOfFameRecord(id: string, data: { athlete_name: string; achievement: string; story?: string | null; photo_url?: string | null; article_url?: string | null }) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('hall_of_fame')
    .update({
      athlete_name: data.athlete_name,
      achievement: data.achievement,
      story: data.story || null,
      photo_url: data.photo_url || null,
      article_url: data.article_url || null,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/hall-of-fame')
  return { success: true }
}

export async function deleteHallOfFameRecord(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('hall_of_fame')
    .update({ is_deleted: true })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/hall-of-fame')
  return { success: true }
}
