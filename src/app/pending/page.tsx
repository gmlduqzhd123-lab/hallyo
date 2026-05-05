'use client'

import { Clock, LogOut } from 'lucide-react'
import { logout } from '../actions/auth'

export default function PendingPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,71,171,0.12)] p-8 text-center relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-pink/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="mx-auto bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mb-6 relative z-10 border border-slate-100">
          <Clock className="w-12 h-12 text-slate-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-accent-navy mb-3 relative z-10">승인 대기 중입니다</h2>
        <p className="text-slate-500 mb-8 font-medium text-sm relative z-10 leading-relaxed">
          관리자(감독/교사)가 계정을 승인해야<br/>서비스를 이용할 수 있습니다.
        </p>

        <button 
          onClick={() => logout()}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 px-6 rounded-full transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 relative z-10 w-full"
        >
          <LogOut className="w-5 h-5" />
          로그아웃
        </button>
      </div>
    </div>
  )
}
