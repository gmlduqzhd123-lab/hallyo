'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { User, Activity, LogOut, Shield, CheckCircle, Clock } from 'lucide-react'
import { logout } from '@/app/actions/auth'

export default function MyPage() {
  const supabase = createClient()

  const { data: userProfile, isPending: isProfilePending } = useQuery({
    queryKey: ['my_profile'],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return null
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()
        
      if (error) throw error
      return data
    }
  })

  const { data: auditLogs, isPending: isLogsPending } = useQuery({
    queryKey: ['my_activities'],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return []

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', authData.user.id)
        .order('created_at', { ascending: false })
        .limit(20)
        
      if (error) throw error
      return data
    }
  })

  const roleText = {
    admin: '관리자',
    coach: '코치',
    athlete: '선수',
    parent: '학부모'
  }[userProfile?.role as string] || userProfile?.role

  const actionText = (action: string, table: string) => {
    const tableText = {
      athletes: '선수 명단',
      schedules: '일정',
      videos: '영상',
      competitions: '대회',
      photos: '사진'
    }[table] || table

    switch(action) {
      case 'CREATE': return `${tableText} 추가`
      case 'UPDATE': return `${tableText} 수정`
      case 'DELETE': return `${tableText} 삭제`
      default: return `${tableText} ${action}`
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-500 rounded-xl">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-accent-navy">마이 페이지</h1>
            <p className="text-sm text-slate-500 font-medium">내 정보와 최근 활동을 확인하세요.</p>
          </div>
        </div>
        
        <button 
          onClick={() => logout()}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-3 rounded-2xl font-bold transition-all"
        >
          <LogOut className="w-5 h-5" />
          로그아웃
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 md:col-span-1 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <Shield className="w-5 h-5 text-indigo-500" />
            내 프로필
          </h2>
          
          {isProfilePending ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            </div>
          ) : userProfile ? (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-xs text-slate-500 font-bold mb-1">이름</p>
                <p className="text-lg font-black text-slate-800">{userProfile.name}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-xs text-slate-500 font-bold mb-1">역할</p>
                <p className="text-md font-bold text-indigo-600 bg-indigo-100 inline-block px-3 py-1 rounded-full">{roleText}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-xs text-slate-500 font-bold mb-1">상태</p>
                <div className="flex items-center gap-1 mt-1">
                  {userProfile.status === 'approved' ? (
                    <span className="text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> 승인 완료
                    </span>
                  ) : (
                    <span className="text-amber-600 bg-amber-100 px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1">
                      <Clock className="w-4 h-4" /> 대기 중
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
             <p className="text-slate-500">프로필을 불러올 수 없습니다.</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 md:col-span-2 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <Activity className="w-5 h-5 text-indigo-500" />
            최근 내 활동
          </h2>

          {isLogsPending ? (
            <div className="animate-pulse space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl"></div>
              ))}
            </div>
          ) : auditLogs && auditLogs.length > 0 ? (
            <div className="space-y-3">
              {auditLogs.map((log: any) => (
                <div key={log.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg font-bold text-xs ${
                      log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-600' :
                      log.action === 'DELETE' ? 'bg-rose-100 text-rose-600' :
                      'bg-sky-100 text-sky-600'
                    }`}>
                      {log.action}
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{actionText(log.action, log.target_table)}</p>
                      {log.details && log.details.title && (
                        <p className="text-xs text-slate-500 mt-0.5">대상: {log.details.title}</p>
                      )}
                      {log.details && log.details.name && (
                        <p className="text-xs text-slate-500 mt-0.5">대상: {log.details.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-slate-400 shrink-0">
                    {new Date(log.created_at).toLocaleDateString('ko-KR', { 
                      month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
              <p className="text-slate-400 font-bold mb-1">최근 활동이 없습니다.</p>
              <p className="text-sm text-slate-400">시스템에서 수행한 활동이 이곳에 기록됩니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
