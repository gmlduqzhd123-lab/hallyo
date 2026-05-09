'use server'

import { createClient } from '@/utils/supabase/server'
import { logAudit } from './audit'

export async function updateGlobalFont(fontFamily: string) {
  const supabase = await createClient()
  
  // check if admin
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return { error: '권한이 없습니다.' }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()
    
  if (!['admin', 'developer'].includes(userData?.role as string)) {
    return { error: '관리자만 폰트를 변경할 수 있습니다.' }
  }

  const { error } = await supabase
    .from('system_settings')
    .upsert({ key: 'global_font', value: fontFamily, updated_at: new Date().toISOString() })
    
  if (error) return { error: error.message }
  
  await logAudit('UPDATE', 'system_settings', { key: 'global_font', value: fontFamily })
  
  return { success: true }
}

export async function updateSystemSetting(key: string, value: string) {
  const supabase = await createClient()
  
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return { error: '권한이 없습니다.' }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()
    
  if (!['admin', 'developer'].includes(userData?.role as string)) {
    return { error: '관리자만 설정을 변경할 수 있습니다.' }
  }

  const { error } = await supabase
    .from('system_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
    
  if (error) return { error: error.message }
  
  await logAudit('UPDATE', 'system_settings', { key, value })
  
  return { success: true }
}

export async function updateCompetitionChecklist(checklistItems: any[]) {
  const supabase = await createClient()
  
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) return { error: '권한이 없습니다.' }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single()
    
  if (!['admin', 'developer', 'coach'].includes(userData?.role as string)) {
    return { error: '권한이 부족합니다.' }
  }

  const { error } = await supabase
    .from('system_settings')
    .upsert({ key: 'competition_checklist', value: JSON.stringify(checklistItems), updated_at: new Date().toISOString() })
    
  if (error) return { error: error.message }
  
  await logAudit('UPDATE', 'system_settings_checklist', { count: checklistItems.length })
  
  return { success: true }
}
