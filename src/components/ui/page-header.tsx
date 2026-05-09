'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { updateSystemSetting } from '@/app/actions/settings'

interface PageHeaderProps {
  title: React.ReactNode
  settingKey: string
  defaultDescription: string
  icon?: React.ReactNode
}

export function PageHeader({ title, settingKey, defaultDescription, icon }: PageHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: userRole } = useQuery({
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

  const canEdit = userRole === 'admin' || userRole === 'developer'

  const { data: description, isPending } = useQuery({
    queryKey: ['page_description', settingKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', settingKey)
        .single()
      
      if (error || !data) {
        return defaultDescription
      }
      return data.value
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (newValue: string) => {
      const res = await updateSystemSetting(settingKey, newValue)
      if (res?.error) throw new Error(res.error)
      return newValue
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['page_description', settingKey] })
      setIsEditing(false)
      toast.success('설명이 업데이트되었습니다.')
    },
    onError: (error: Error) => {
      toast.error('업데이트 실패: ' + error.message)
    }
  })

  const handleEdit = () => {
    setEditValue(description || defaultDescription)
    setIsEditing(true)
  }

  const handleSave = () => {
    if (!editValue.trim()) return
    updateMutation.mutate(editValue.trim())
  }

  const displayDescription = isPending ? defaultDescription : (description || defaultDescription)

  return (
    <div className="group relative">
      <h1 className="text-2xl md:text-3xl font-bold text-accent-navy flex items-center gap-2">
        {icon}
        {title}
      </h1>
      
      {isEditing ? (
        <div className="mt-2 flex items-center gap-2 max-w-2xl">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setIsEditing(false)
            }}
            className="flex-1 px-3 py-1.5 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsEditing(false)}
            className="p-1.5 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-1 min-h-[24px]">
          <p className="text-slate-500">{displayDescription}</p>
          {canEdit && (
            <button
              onClick={handleEdit}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all flex-shrink-0"
              title="설명 수정"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
