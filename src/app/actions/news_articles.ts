'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addNewsArticle(data: any) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { error: '권한이 없습니다.' }

  const { data: roleData } = await supabase.from('users').select('role').eq('id', userData.user.id).single()
  if (!['admin', 'developer'].includes(roleData?.role)) {
    return { error: '기사를 등록할 권한이 없습니다.' }
  }

  const { error } = await supabase.from('news_articles').insert([
    {
      title: data.title,
      content: data.content,
      article_url: data.article_url,
      publisher: data.publisher,
      publish_date: data.publish_date || null,
      photo_url: data.photo_url || null,
      created_by: userData.user.id,
    }
  ])

  if (error) return { error: '기사 등록에 실패했습니다: ' + error.message }
  
  revalidatePath('/dashboard/news-articles')
  return { success: true }
}

export async function updateNewsArticle(id: string, data: any) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { error: '권한이 없습니다.' }

  const { data: roleData } = await supabase.from('users').select('role').eq('id', userData.user.id).single()
  const { data: article } = await supabase.from('news_articles').select('created_by').eq('id', id).single()

  if (!['admin', 'developer'].includes(roleData?.role) && article?.created_by !== userData.user.id) {
    return { error: '관리자, 개발자 또는 작성자 본인만 기사를 수정할 수 있습니다.' }
  }

  const { error } = await supabase.from('news_articles').update({
    title: data.title,
    content: data.content,
    article_url: data.article_url,
    publisher: data.publisher,
    publish_date: data.publish_date || null,
    photo_url: data.photo_url || null,
  }).eq('id', id)

  if (error) return { error: '기사 수정에 실패했습니다: ' + error.message }
  
  revalidatePath('/dashboard/news-articles')
  return { success: true }
}

export async function deleteNewsArticle(id: string) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { error: '권한이 없습니다.' }

  const { data: roleData } = await supabase.from('users').select('role').eq('id', userData.user.id).single()
  const { data: article } = await supabase.from('news_articles').select('created_by').eq('id', id).single()

  if (!['admin', 'developer'].includes(roleData?.role) && article?.created_by !== userData.user.id) {
    return { error: '관리자, 개발자 또는 작성자 본인만 기사를 삭제할 수 있습니다.' }
  }

  const { error } = await supabase.from('news_articles').update({ is_deleted: true }).eq('id', id)

  if (error) return { error: '기사 삭제에 실패했습니다: ' + error.message }
  
  revalidatePath('/dashboard/news-articles')
  return { success: true }
}
