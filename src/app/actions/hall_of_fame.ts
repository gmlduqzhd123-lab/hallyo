'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addHallOfFameRecord(data: { 
  athlete_name: string; 
  achievement: string; 
  story?: string | null; 
  photo_url?: string | null; 
  article_url?: string | null;
  principal?: string | null;
  vice_principal?: string | null;
  supervisor?: string | null;
  coach?: string | null;
  assistant_coach?: string | null;
  parent_president?: string | null;
  captain?: string | null;
  vice_captain?: string | null;
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('hall_of_fame')
    .insert([{
      athlete_name: data.athlete_name,
      achievement: data.achievement,
      story: data.story || null,
      photo_url: data.photo_url || null,
      article_url: data.article_url || null,
      principal: data.principal || null,
      vice_principal: data.vice_principal || null,
      supervisor: data.supervisor || null,
      coach: data.coach || null,
      assistant_coach: data.assistant_coach || null,
      parent_president: data.parent_president || null,
      captain: data.captain || null,
      vice_captain: data.vice_captain || null,
      is_deleted: false,
    }])

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard/hall-of-fame')
  return { success: true }
}

export async function updateHallOfFameRecord(id: string, data: { 
  athlete_name: string; 
  achievement: string; 
  story?: string | null; 
  photo_url?: string | null; 
  article_url?: string | null;
  principal?: string | null;
  vice_principal?: string | null;
  supervisor?: string | null;
  coach?: string | null;
  assistant_coach?: string | null;
  parent_president?: string | null;
  captain?: string | null;
  vice_captain?: string | null;
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('hall_of_fame')
    .update({
      athlete_name: data.athlete_name,
      achievement: data.achievement,
      story: data.story || null,
      photo_url: data.photo_url || null,
      article_url: data.article_url || null,
      principal: data.principal || null,
      vice_principal: data.vice_principal || null,
      supervisor: data.supervisor || null,
      coach: data.coach || null,
      assistant_coach: data.assistant_coach || null,
      parent_president: data.parent_president || null,
      captain: data.captain || null,
      vice_captain: data.vice_captain || null,
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
