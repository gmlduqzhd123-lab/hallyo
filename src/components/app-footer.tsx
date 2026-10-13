'use client'

import { useState } from 'react'

// 엽쌤의 다른 앱과 같은 하단: 앱 설치 · QR로 접속 · 링크 복사 · 저작권 · 다른 앱 보기
// 앱 설치와 QR 창은 public/ys-install.js, public/ys-qr.js 가 [data-ys-install], [data-qr] 버튼에 연결합니다.
const APP_URL = 'https://hallyo.vercel.app/'
const HUB_URL = 'https://gmlduqzhd123-lab.github.io/YScode/'

export function AppFooter({ className = '' }: { className?: string }) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(APP_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('아래 주소를 복사해 주세요.', APP_URL)
    }
  }

  const chip = 'inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold shadow-sm transition-colors'

  return (
    <footer className={`text-center text-slate-400 text-xs sm:text-sm font-medium space-y-3 ${className}`}>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" data-ys-install="" className={chip}>📲 앱 설치</button>
        <button type="button" data-qr="" aria-label="QR 코드로 접속" className={chip}>📱 QR로 접속</button>
        <button type="button" onClick={copyLink} className={chip}>{copied ? '✅ 복사했어요' : '🔗 링크 복사'}</button>
      </div>
      <p className="break-keep">
        © 2026 엽쌤 · 달디단. All rights reserved. ·{' '}
        <a href={HUB_URL} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-slate-600">
          엽쌤의 다른 앱 보기 →
        </a>
      </p>
    </footer>
  )
}
