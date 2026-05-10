'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

/**
 * GlobalFontProvider — 전역 글꼴을 확실하게 적용하는 컴포넌트.
 * 
 * 전략:
 * 1. 서버에서 전달받은 initialFont를 즉시 적용 (SSR 단계에서 이미 적용됨)
 * 2. 클라이언트 마운트 시 DB에서 최신 폰트를 직접 조회하여 적용 (캐시/stale 방어)
 * 3. Realtime 구독으로 실시간 폰트 변경 반영
 * 4. CSS 변수 + body.style.fontFamily 모두 직접 설정 (이중 보장)
 */
export function GlobalFontProvider({ initialFont = 'MaplestoryL' }: { initialFont?: string }) {
  // supabase 인스턴스를 ref로 유지하여 재렌더링에 의한 재생성 방지
  const supabaseRef = useRef(createClient())
  const currentFontRef = useRef(initialFont)

  /**
   * 폰트를 DOM에 직접 적용하는 함수.
   * CSS 변수와 body fontFamily를 모두 갱신하여 어떤 환경에서도 동작하도록 보장.
   */
  const applyFont = useCallback((fontName: string) => {
    if (!fontName || currentFontRef.current === fontName) return
    currentFontRef.current = fontName

    // 1. CSS 변수 설정 (html 요소)
    document.documentElement.style.setProperty('--global-font', fontName)
    
    // 2. body의 font-family를 직접 설정 (CSS 변수 미해석 방어)
    document.body.style.fontFamily = `'${fontName}', sans-serif`
    
    // 3. html 요소의 inline style에도 반영 (일부 브라우저/WebView 호환)
    document.documentElement.style.fontFamily = `'${fontName}', sans-serif`
  }, [])

  // 마운트 시: initialFont 즉시 적용 + DB에서 최신 값 fetch + Realtime 구독
  useEffect(() => {
    const supabase = supabaseRef.current

    // 서버에서 받은 initialFont를 DOM에 즉시 적용
    if (initialFont) {
      currentFontRef.current = '' // force apply
      applyFont(initialFont)
    }

    // DB에서 최신 폰트 확인 (SSR 캐시가 오래된 경우 방어)
    const fetchLatestFont = async () => {
      try {
        const { data } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'global_font')
          .single()
        if (data?.value) {
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
            applyFont(newFont)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialFont, applyFont])

  // visibilitychange: 탭이 다시 보일 때 폰트 재적용 (앱 전환 후 복귀 시 방어)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentFontRef.current) {
        // 강제 재적용
        const font = currentFontRef.current
        document.documentElement.style.setProperty('--global-font', font)
        document.body.style.fontFamily = `'${font}', sans-serif`
        document.documentElement.style.fontFamily = `'${font}', sans-serif`
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return null
}
