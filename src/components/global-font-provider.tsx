'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export function GlobalFontProvider({ initialFont = 'MaplestoryL' }: { initialFont?: string }) {
  const [fontFamily, setFontFamily] = useState(initialFont)
  const supabase = createClient()

  // Sync with server-provided initialFont (e.g. after a router.refresh() from login)
  useEffect(() => {
    if (initialFont) {
      setFontFamily(initialFont)
    }
  }, [initialFont])

  useEffect(() => {
    // Fetch directly on mount to handle cases where the SSR font might be stale or 
    // the user logged in and cached HTML was served.
    const fetchFont = async () => {
      try {
        const { data } = await supabase.from('system_settings').select('value').eq('key', 'global_font').single()
        if (data?.value) {
          setFontFamily(data.value)
        }
      } catch (e) {
        // Ignore errors
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
          if (payload.new && payload.new.value) {
            setFontFamily(payload.new.value)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  useEffect(() => {
    document.documentElement.style.setProperty('--global-font', fontFamily)
  }, [fontFamily])

  return null
}
