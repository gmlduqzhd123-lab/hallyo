'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(data: { name: string; password: string }) {
  const supabase = await createClient()
  const email = Buffer.from(data.name).toString('hex') + '@hallyoswim.com'

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: data.password,
  })

  if (error) {
    return { error: '이름 또는 비밀번호가 올바르지 않습니다.' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signup(data: { password: string; name: string; role: string }) {
  const supabase = await createClient()
  const email = Buffer.from(data.name).toString('hex') + '@hallyoswim.com'

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: data.password,
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { error: '이미 가입된 이름입니다.' }
    }
    return { error: authError.message }
  }

  if (authData.user) {
    // Insert into public.users
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        name: data.name,
        role: data.role,
        status: 'pending',
      })

    if (dbError) {
      return { error: dbError.message }
    }
  }

  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
