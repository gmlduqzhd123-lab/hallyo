'use client'

import { FallbackProps } from 'react-error-boundary'
import { Waves, RefreshCw } from 'lucide-react'

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,71,171,0.12)] p-8 text-center relative overflow-hidden border-2 border-rose-100">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="mx-auto bg-rose-50 w-24 h-24 rounded-full flex items-center justify-center mb-6 relative z-10 border border-rose-200">
          <Waves className="w-12 h-12 text-rose-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-accent-navy mb-3 relative z-10">앗! 문제가 발생했어요.</h2>
        <p className="text-slate-500 mb-6 font-medium text-sm relative z-10 break-words">
          {(error instanceof Error ? error.message : String(error)) || '예상치 못한 오류가 발생하여 화면을 불러오지 못했습니다.'}
        </p>

        <button 
          onClick={resetErrorBoundary}
          className="bg-[#0047AB] hover:bg-[#003685] text-white font-bold py-3.5 px-6 rounded-full shadow-lg shadow-[#0047AB]/30 transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 relative z-10 w-full"
        >
          <RefreshCw className="w-5 h-5" />
          다시 시도하기
        </button>
      </div>
    </div>
  )
}
