'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

/**
 * GlobalFontProvider — CSS 변수 `--global-font`만 제어하는 컴포넌트.
 * 
 * 핵심 원칙: font-family는 CSS가 결정한다. JS는 CSS 변수만 업데이트한다.
 * 이렇게 하면 React 리렌더링이 아무리 많이 일어나도 폰트가 깜빡이지 않는다.
 * CSS 규칙 `* { font-family: var(--global-font) !important }` 가 모든 요소에 적용됨.
 */
export function GlobalFontProvider({ initialFont = 'MaplestoryL' }: { initialFont?: string }) {
  const supabaseRef = useRef(createClient())
  const currentFontRef = useRef(initialFont)

  /**
   * CSS 변수만 업데이트. font-family를 직접 건드리지 않는다.
   * CSS 규칙이 var(--global-font)를 참조하므로 자동으로 모든 요소에 반영된다.
   */
  const applyFont = useCallback((fontName: string) => {
    if (!fontName || currentFontRef.current === fontName) return
    currentFontRef.current = fontName
    document.documentElement.style.setProperty('--global-font', `'${fontName}'`)
  }, [])

  useEffect(() => {
    const supabase = supabaseRef.current

    // DB에서 최신 폰트 확인 (SSR 캐시가 오래된 경우 방어)
    const fetchLatestFont = async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'global_font')
          .single()
        if (data?.value && data.value !== currentFontRef.current) {
          currentFontRef.current = '' // force apply
          applyFont(data.value)
        }
      } catch {
        // 네트워크 오류 시 기존 폰트 유지
      }
    }
    fetchLatestFont()

    // Realtime 구독으로 폰트 변경 즉시 반영
    const channel = supabase.channel('font_realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_settings',
          filter: 'key=eq.global_font'
        },
        (payload) => {
          const newFont = payload.new?.value
          if (newFont) {
            currentFontRef.current = '' // force apply
            applyFont(newFont)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [applyFont])

  return null
}
