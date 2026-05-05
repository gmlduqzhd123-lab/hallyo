import { createClient } from '@/utils/supabase/server'

export async function logAudit(action: 'CREATE' | 'UPDATE' | 'DELETE', target_table: string, details: Record<string, unknown> = {}) {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData?.user) {
    console.error('Failed to log audit: User not authenticated', userError)
    return
  }

  const { error } = await supabase.from('audit_logs').insert([
    {
      user_id: userData.user.id,
      action,
      target_table,
      details
    }
  ])

  if (error) {
    console.error(`Failed to log audit for ${action} on ${target_table}:`, error)
  }
}
