'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export function GlobalFontProvider() {
  const [fontFamily, setFontFamily] = useState('MaplestoryL')
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    const fetchFont = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'global_font')
        .single()
      
      if (data) {
        setFontFamily(data.value)
      }
    }
    fetchFont()

    // Realtime subscription
    const channel = supabase.channel('system_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings',
          filter: 'key=eq.global_font'
        },
        (payload) => {
          setFontFamily(payload.new.value)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--global-font', `'${fontFamily}', sans-serif`)
  }, [fontFamily])

  return null
}
