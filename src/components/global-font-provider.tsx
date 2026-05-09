'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export function GlobalFontProvider({ initialFont = 'MaplestoryL' }: { initialFont?: string }) {
  const [fontFamily, setFontFamily] = useState(initialFont)
  const supabase = createClient()

  useEffect(() => {
    // We already have the initial font from the server.
    // If we wanted to ensure it's up-to-date we could fetch it here,
    // but the server render will handle the initial load.
    
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
  }, [supabase])

  useEffect(() => {
    document.documentElement.style.setProperty('--global-font', fontFamily)
  }, [fontFamily])

  return null
}
