'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function login(data: { email: string; password: string }) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
}

export async function signup(data: { email: string; password: string; name: string }) {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  })

  if (authError) {
    throw new Error(authError.message)
  }

  if (authData.user) {
    // Insert into public.users
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: data.email,
        name: data.name,
        role: 'athlete',
        status: 'pending',
      })

    if (dbError) {
      // In a real app we might want to clean up auth user if DB insert fails
      throw new Error(dbError.message)
    }
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}
