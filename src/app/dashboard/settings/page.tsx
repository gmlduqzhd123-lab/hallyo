'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Settings, UserCheck, Users, CheckCircle, Clock, Trash2, Edit2, Type, Key } from 'lucide-react'
import { approveUser, deleteUser, updateUserRole, resetUserPassword, updateUserName } from '@/app/actions/admin'
import { updateGlobalFont } from '@/app/actions/settings'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'approval' | 'users' | 'fonts'>('fonts')
  const supabase = createClient()
  const queryClient = useQueryClient()
  const router = useRouter()

  // Fetch current user role to restrict access
  const { data: currentUserRole, isPending: isRoleLoading } = useQuery({
    queryKey: ['user_role'],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) return null
      
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single()
        
      if (error) return null
      return data.role
    }
  })

  useEffect(() => {
    if (!isRoleLoading && currentUserRole !== 'developer') {
      router.push('/dashboard')
    }
  }, [isRoleLoading, currentUserRole, router])

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

  // Fetch all users
  const { data: allUsers, isPending: isLoadingAllUsers } = useQuery({
    queryKey: ['all_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
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
      queryClient.invalidateQueries({ queryKey: ['all_users'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await deleteUser(userId)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('사용자가 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['all_users'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string, role: string }) => {
      const result = await updateUserRole(userId, role)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('사용자 권한이 변경되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['all_users'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await resetUserPassword(userId)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: (data) => {
      toast.success(`비밀번호가 '${data.newPassword}'(으)로 초기화되었습니다.`, { duration: 5000 })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const updateNameMutation = useMutation({
    mutationFn: async ({ userId, name }: { userId: string, name: string }) => {
      const result = await updateUserName(userId, name)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('사용자 이름이 변경되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['all_users'] })
      queryClient.invalidateQueries({ queryKey: ['pending_users'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const handleEditName = (userId: string, currentName: string) => {
    const newName = window.prompt('수정할 이름을 입력하세요:', currentName)
    if (newName && newName.trim() !== '' && newName !== currentName) {
      updateNameMutation.mutate({ userId, name: newName.trim() })
    }
  }

  // Fetch current font
  const { data: currentFont } = useQuery({
    queryKey: ['global_font'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'global_font')
        .single()
      if (error) return 'MaplestoryL'
      return data.value
    }
  })

  const updateFontMutation = useMutation({
    mutationFn: async (fontFamily: string) => {
      const result = await updateGlobalFont(fontFamily)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('기본 폰트가 변경되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['global_font'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const availableFonts = [
    { name: '메이플스토리 L', family: 'MaplestoryL' },
    { name: '메이플스토리 B', family: 'MaplestoryB' },
    { name: '배달의민족 도현', family: 'BMDOHYEON' },
    { name: '배달의민족 주아', family: 'BMJUA' },
    { name: '강원교육모두 B', family: 'GangwonEduAllB' },
    { name: '잘난체', family: 'Jalnan' },
    { name: '교보 손글씨 2019', family: 'KyoboHandwriting2019' },
    { name: '학교안심 나드리 B', family: 'SchoolSafeNadeuriB' },
    { name: '학교안심 나드리 L', family: 'SchoolSafeNadeuriL' },
    { name: '스위트머핀', family: 'SweetMuffin' },
    { name: 'a바보', family: 'aBabo' },
  ]

  if (isRoleLoading || currentUserRole !== 'developer') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

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
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-4 text-center font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'users' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users className="w-5 h-5" /> 회원 관리
          </button>
          <button
            onClick={() => setActiveTab('fonts')}
            className={`flex-1 py-4 text-center font-bold flex justify-center items-center gap-2 transition-colors ${activeTab === 'fonts' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Type className="w-5 h-5" /> 폰트 설정
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

          {activeTab === 'users' && (
            <div className="space-y-4">
              {isLoadingAllUsers ? (
                <div className="animate-pulse flex space-x-4"><div className="h-24 bg-slate-200 rounded w-full"></div></div>
              ) : allUsers?.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  등록된 사용자가 없습니다.
                </div>
              ) : (
                <div className="grid gap-4">
                  {allUsers?.map(user => (
                    <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 border border-slate-100 rounded-2xl bg-white hover:border-primary/30 transition-colors shadow-sm">
                      <div className="mb-4 md:mb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex items-center gap-1">
                            <h3 className="font-bold text-lg text-accent-navy">{user.name}</h3>
                            <button onClick={() => handleEditName(user.id, user.name)} className="text-slate-300 hover:text-indigo-500 transition-colors p-1" title="이름 수정">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            user.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            {user.status === 'approved' ? '승인됨' : '대기중'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">{user.email || '이메일 없음'}</p>
                        <p className="text-xs text-slate-400 mt-1">가입일: {format(new Date(user.created_at || new Date()), 'yyyy-MM-dd')}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <label className="text-xs font-bold text-slate-400 mb-1 ml-1">권한 변경</label>
                          <select 
                            value={user.role}
                            onChange={(e) => updateRoleMutation.mutate({ userId: user.id, role: e.target.value })}
                            disabled={updateRoleMutation.isPending}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 outline-none focus:border-primary transition-colors disabled:opacity-50"
                          >
                            <option value="developer">개발자 (Developer)</option>
                            <option value="admin">관리자 (Admin)</option>
                            <option value="coach">지도자 (Coach)</option>
                            <option value="athlete">선수 (Athlete)</option>
                            <option value="parents">학부모 (Parents)</option>
                            <option value="guest">일반인 (Guest)</option>
                          </select>
                        </div>
                        
                        <div className="flex flex-col">
                          <label className="text-xs font-bold text-slate-400 mb-1 ml-1 opacity-0">초기화</label>
                          <button
                            onClick={() => resetPasswordMutation.mutate(user.id)}
                            disabled={resetPasswordMutation.isPending}
                            className="p-2.5 text-amber-500 hover:text-white hover:bg-amber-500 bg-amber-50 rounded-xl transition-colors disabled:opacity-50"
                            title="비밀번호 12341234로 초기화"
                          >
                            <Key className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="flex flex-col">
                          <label className="text-xs font-bold text-slate-400 mb-1 ml-1 opacity-0">삭제</label>
                          <button
                            onClick={() => deleteMutation.mutate(user.id)}
                            disabled={deleteMutation.isPending}
                            className="p-2.5 text-rose-400 hover:text-white hover:bg-rose-500 bg-rose-50 rounded-xl transition-colors disabled:opacity-50"
                            title="사용자 즉시 삭제"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'fonts' && (
            <div className="space-y-6">
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-6 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900">전역 폰트 설정</h4>
                  <p className="text-sm text-amber-700 mt-1">이곳에서 선택한 폰트는 시스템 전체(대시보드 등)에 실시간으로 반영됩니다.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableFonts.map(font => {
                  const isActive = currentFont === font.family
                  return (
                    <div 
                      key={font.family}
                      onClick={() => updateFontMutation.mutate(font.family)}
                      className={`cursor-pointer border-2 rounded-2xl p-6 transition-all ${isActive ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-slate-100 hover:border-primary/40 hover:shadow-sm bg-white'}`}
                      style={{ fontFamily: `'${font.family}', sans-serif` }}
                    >
                      <div className="flex justify-between items-center mb-4">
                        <span className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-slate-400 font-sans'}`}>
                          {font.name} {isActive && '(적용중)'}
                        </span>
                        {isActive && <CheckCircle className="w-5 h-5 text-primary" />}
                      </div>
                      <p className="text-xl">여수한려초 수영부</p>
                      <p className="text-sm text-slate-500 mt-2">1234567890 ABCabc</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
