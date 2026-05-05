'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Settings, UserCheck, Activity, CheckCircle, Clock } from 'lucide-react'
import { approveUser } from '@/app/actions/admin'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'approval' | 'audit'>('approval')
  const supabase = createClient()
  const queryClient = useQueryClient()

  // Fetch pending users
  const { data: pendingUsers, isPending: isLoadingUsers } = useQuery({
    queryKey: ['pending_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'pending')
      if (error) throw error
      return data
    }
  })

  // Fetch audit logs
  const { data: auditLogs, isPending: isLoadingAudit } = useQuery({
    queryKey: ['audit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          id, action, target_table, details, created_at,
          users ( name, email )
        `)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    }
  })

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await approveUser(userId)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('사용자 가입이 승인되었습니다.', { style: { background: '#0047AB', color: 'white' } })
      queryClient.invalidateQueries({ queryKey: ['pending_users'] })
      queryClient.invalidateQueries({ queryKey: ['audit_logs'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-secondary/20 text-primary rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-accent-navy">환경 설정</h1>
            <p className="text-sm text-slate-500 font-medium">관리자 전용 가입 승인 및 시스템 모니터링</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab('approval')}
            className={`flex-1 py-4 text-center font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'approval' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <UserCheck className="w-5 h-5" /> 가입 승인 대기열
            {pendingUsers && pendingUsers.length > 0 && (
              <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingUsers.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 py-4 text-center font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'audit' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Activity className="w-5 h-5" /> 활동 로그 (Audit)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'approval' && (
            <div className="space-y-4">
              {isLoadingUsers ? (
                <div className="animate-pulse flex space-x-4"><div className="h-10 bg-slate-200 rounded w-full"></div></div>
              ) : pendingUsers?.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400 opacity-50" />
                  현재 승인 대기 중인 사용자가 없습니다.
                </div>
              ) : (
                <div className="grid gap-4">
                  {pendingUsers?.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-slate-50">
                      <div>
                        <h3 className="font-bold text-accent-navy">{user.name}</h3>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                      <button
                        onClick={() => approveMutation.mutate(user.id)}
                        disabled={approveMutation.isPending}
                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-md shadow-primary/20 transition-colors disabled:opacity-50"
                      >
                        승인하기
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              {isLoadingAudit ? (
                <div className="animate-pulse flex space-x-4"><div className="h-24 bg-slate-200 rounded w-full"></div></div>
              ) : auditLogs?.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  기록된 활동 로그가 없습니다.
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-100 ml-4 space-y-6 pb-4">
                  {auditLogs?.map((log: any) => (
                    <div key={log.id} className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 border-2 border-white ring-2 ring-primary/20"></div>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold text-white ${
                              log.action === 'CREATE' ? 'bg-emerald-500' :
                              log.action === 'UPDATE' ? 'bg-amber-500' :
                              log.action === 'DELETE' ? 'bg-rose-500' : 'bg-slate-500'
                            }`}>
                              {log.action}
                            </span>
                            <span className="font-bold text-slate-700">{log.target_table}</span>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">
                            {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">
                          <span className="font-bold text-accent-navy">{log.users?.name}</span>님이 작업을 수행했습니다.
                        </p>
                        <pre className="text-xs bg-slate-800 text-slate-300 p-2 rounded-lg overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
