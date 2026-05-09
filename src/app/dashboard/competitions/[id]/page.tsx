'use client'

import { useState, use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Trophy, Plus, Trash2, MapPin, Calendar as CalendarIcon, Users, UserPlus, Check, Building, Utensils, ExternalLink, Edit2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addRecord, deleteRecord, updateRecord } from '@/app/actions/records'
import { updateSchedule, updateScheduleParticipants, updateSchedulePlaces } from '@/app/actions/schedules'
import { toast } from 'sonner'
import { format } from 'date-fns'
import Link from 'next/link'
import { formatTimeSeconds, parseTimeInput } from '@/utils/time'

const editSchema = z.object({
  title: z.string().min(2, '대회명을 입력해주세요.'),
  date: z.string().min(10, '시작일을 선택해주세요.'),
  end_date: z.string().optional().or(z.literal('')),
  location: z.string().min(2, '장소를 입력해주세요.'),
  description: z.string().optional()
})

type EditFormValues = z.infer<typeof editSchema>

const schema = z.object({
  athlete_id: z.string().min(1, '선수를 선택해주세요.'),
  event_name: z.string().min(1, '종목을 선택해주세요.'),
  record_time: z.string().min(1, '기록을 입력해주세요.'),
  record_date: z.string().min(10, '기록일을 선택해주세요.'),
  match_type: z.string().optional().nullable(),
  rank: z.string().optional().nullable(),
})

type FormValues = z.infer<typeof schema>

interface Place {
  id: string
  name: string
  address: string
  contact?: string
  link?: string
}

const placeSchema = z.object({
  name: z.string().min(1, '명칭을 입력해주세요.'),
  address: z.string().min(1, '주소를 입력해주세요.'),
  contact: z.string().optional(),
  link: z.string().url('유효한 링크(URL)를 입력해주세요.').or(z.literal('')).optional(),
})

export default function CompetitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false)
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  
  const [infoTab, setInfoTab] = useState<'accommodations' | 'restaurants'>('accommodations')
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false)
  const [isEditCompModalOpen, setIsEditCompModalOpen] = useState(false)
  const [editingPlace, setEditingPlace] = useState<Place | null>(null)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [isEditRecordModalOpen, setIsEditRecordModalOpen] = useState(false)
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: competition, isPending: compPending } = useQuery({
    queryKey: ['competition', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    }
  })

  const { data: records, isPending: recordsPending } = useQuery({
    queryKey: ['records', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('records')
        .select('*, athletes(name)')
        .eq('schedule_id', id)
        .eq('is_deleted', false)
        .order('record_date', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const { data: athletes } = useQuery({
    queryKey: ['athletes-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('id, name, grade')
        .eq('is_deleted', false)
        .order('grade', { ascending: false })
        .order('name', { ascending: true })
      if (error) throw error
      return data
    }
  })

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
  
  const canEdit = ['admin', 'developer'].includes(userRole as string) || userRole === 'coach'

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const { register: registerPlace, handleSubmit: handleSubmitPlace, formState: { errors: placeErrors }, reset: resetPlace, setValue: setPlaceValue } = useForm<z.infer<typeof placeSchema>>({
    resolver: zodResolver(placeSchema),
  })

  const { register: registerEditComp, handleSubmit: handleSubmitEditComp, formState: { errors: editCompErrors }, reset: resetEditComp, setValue: setEditCompValue } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  })

  const selectedEventName = watch('event_name')

  const EVENT_OPTIONS = [
    { key: '자유형50M', label: '자유형 50M' },
    { key: '자유형100M', label: '자유형 100M' },
    { key: '자유형200M', label: '자유형 200M' },
    { key: '배영50M', label: '배영 50M' },
    { key: '평영50M', label: '평영 50M' },
    { key: '평영100M', label: '평영 100M' },
    { key: '접영50M', label: '접영 50M' },
    { key: '접영100M', label: '접영 100M' },
  ]

  const addMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const formData = new FormData()
      formData.append('schedule_id', id)
      formData.append('athlete_id', data.athlete_id)
      formData.append('event_name', data.event_name)
      formData.append('record_time', data.record_time.toString())
      formData.append('record_date', data.record_date)
      if (data.match_type) formData.append('match_type', data.match_type)
      if (data.rank) formData.append('rank', data.rank)
      
      const result = await addRecord(formData)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('기록이 등록되었습니다.', { style: { background: '#0047AB', color: 'white' } })
      queryClient.invalidateQueries({ queryKey: ['records', id] })
      reset()
      setIsModalOpen(false)
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const delMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const result = await deleteRecord(recordId, id)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('기록이 삭제되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['records', id] })
    }
  })

  const editRecordMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!editingRecord) return
      const formData = new FormData()
      formData.append('schedule_id', id)
      formData.append('athlete_id', data.athlete_id)
      formData.append('event_name', data.event_name)
      formData.append('record_time', data.record_time.toString())
      formData.append('record_date', data.record_date)
      if (data.match_type) formData.append('match_type', data.match_type)
      if (data.rank) formData.append('rank', data.rank)
      
      const result = await updateRecord(editingRecord.id, formData)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('기록이 수정되었습니다.', { style: { background: '#0047AB', color: 'white' } })
      queryClient.invalidateQueries({ queryKey: ['records', id] })
      reset()
      setIsEditRecordModalOpen(false)
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const editCompMutation = useMutation({
    mutationFn: async (data: EditFormValues) => {
      const formData = new FormData()
      formData.append('type', 'competition')
      formData.append('title', data.title)
      formData.append('date', data.date)
      if (data.end_date) formData.append('end_date', data.end_date)
      if (data.location) formData.append('location', data.location)
      if (data.description) formData.append('description', data.description)
      
      const result = await updateSchedule(id, formData)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('대회 정보가 수정되었습니다.', { style: { background: '#0047AB', color: 'white' } })
      queryClient.invalidateQueries({ queryKey: ['competition', id] })
      queryClient.invalidateQueries({ queryKey: ['competitions'] })
      setIsEditCompModalOpen(false)
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const updateParticipantsMutation = useMutation({
    mutationFn: async (participants: string[]) => {
      const result = await updateScheduleParticipants(id, participants)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('참여 선수가 수정되었습니다.', { style: { background: '#0047AB', color: 'white' } })
      queryClient.invalidateQueries({ queryKey: ['competition', id] })
      setIsParticipantsModalOpen(false)
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const updatePlacesMutation = useMutation({
    mutationFn: async ({ type, places }: { type: 'accommodations' | 'restaurants', places: any[] }) => {
      const result = await updateSchedulePlaces(id, type, places)
      if (result?.error) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      toast.success('정보가 업데이트 되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['competition', id] })
      setIsPlaceModalOpen(false)
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const handleToggleParticipant = (athleteId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(athleteId) 
        ? prev.filter(id => id !== athleteId)
        : [...prev, athleteId]
    )
  }

  const handleUpdateParticipants = () => {
    updateParticipantsMutation.mutate(selectedParticipants)
  }

  const onSubmit = (data: FormValues) => {
    const parsedData = { ...data, record_time: parseTimeInput(data.record_time) }
    addMutation.mutate(parsedData)
  }

  const handleOpenEditRecordModal = (record: any) => {
    setEditingRecord(record)
    setValue('athlete_id', record.athlete_id)
    setValue('event_name', record.event_name)
    setValue('record_time', formatTimeSeconds(record.record_time))
    setValue('record_date', record.record_date)
    setValue('match_type', record.match_type || '')
    setValue('rank', record.rank ? record.rank.toString() : '')
    setIsEditRecordModalOpen(true)
  }

  const onSubmitEditRecord = (data: FormValues) => {
    const parsedData = { ...data, record_time: parseTimeInput(data.record_time) }
    editRecordMutation.mutate(parsedData)
  }

  const handleOpenEditCompModal = () => {
    if (competition) {
      setEditCompValue('title', competition.title)
      setEditCompValue('date', competition.date)
      setEditCompValue('end_date', competition.end_date || '')
      setEditCompValue('location', competition.location || '')
      setEditCompValue('description', competition.description || '')
    }
    setIsEditCompModalOpen(true)
  }

  const onSubmitEditComp = (data: EditFormValues) => {
    editCompMutation.mutate(data)
  }

  const handleOpenPlaceModal = (place?: Place) => {
    if (place) {
      setEditingPlace(place)
      setPlaceValue('name', place.name)
      setPlaceValue('address', place.address)
      setPlaceValue('contact', place.contact || '')
      setPlaceValue('link', place.link || '')
    } else {
      setEditingPlace(null)
      resetPlace({ name: '', address: '', contact: '', link: '' })
    }
    setIsPlaceModalOpen(true)
  }

  const onSubmitPlace = (data: any) => {
    const currentPlaces = infoTab === 'accommodations' 
      ? (competition?.accommodations || []) 
      : (competition?.restaurants || [])
      
    let newPlaces
    if (editingPlace) {
      newPlaces = currentPlaces.map((p: any) => p.id === editingPlace.id ? { ...data, id: editingPlace.id } : p)
    } else {
      newPlaces = [...currentPlaces, { ...data, id: Math.random().toString(36).substring(7) }]
    }
    
    updatePlacesMutation.mutate({ type: infoTab, places: newPlaces })
  }

  const handleDeletePlace = (placeId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const currentPlaces = infoTab === 'accommodations' 
      ? (competition?.accommodations || []) 
      : (competition?.restaurants || [])
    
    const newPlaces = currentPlaces.filter((p: any) => p.id !== placeId)
    updatePlacesMutation.mutate({ type: infoTab, places: newPlaces })
  }

  // Set default date when opening modal
  const handleOpenModal = () => {
    reset()
    if (competition?.date) {
      setValue('record_date', competition.date)
    }
    setIsModalOpen(true)
  }

  if (compPending) {
    return <div className="py-12 text-center text-slate-400">대회 정보를 불러오는 중...</div>
  }

  if (!competition) {
    return <div className="py-12 text-center text-slate-400">대회 정보를 찾을 수 없습니다.</div>
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/competitions" className="inline-flex items-center text-slate-500 hover:text-accent-navy transition-colors font-bold gap-2">
        <ArrowLeft className="w-5 h-5" />
        목록으로 돌아가기
      </Link>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
        {canEdit && (
          <button 
            onClick={handleOpenEditCompModal}
            className="absolute top-6 right-6 z-20 p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm"
            title="대회 정보 수정"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        )}
        <div className="absolute top-0 right-0 p-8 opacity-5 z-0">
          <Trophy className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="bg-rose-100 text-rose-600 px-4 py-1.5 rounded-full text-sm font-black border border-rose-200 whitespace-nowrap">
              {format(new Date(competition.date), 'yyyy년 MM월 dd일')}
              {competition.end_date ? ` ~ ${format(new Date(competition.end_date), 'yyyy년 MM월 dd일')}` : ''}
            </span>
            {competition.location && (
              <div className="flex items-center gap-1.5 text-slate-600 text-sm font-bold bg-slate-100 px-4 py-1.5 rounded-full whitespace-nowrap">
                <MapPin className="w-4 h-4" />
                {competition.location}
              </div>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-accent-navy mb-3 break-keep leading-tight">{competition.title}</h1>
          {competition.description && <p className="text-slate-500 text-base md:text-lg break-keep leading-relaxed">{competition.description}</p>}
        </div>
      </div>

      <div className="flex justify-between items-center mt-12 mb-6">
        <h2 className="text-2xl font-black text-accent-navy flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-500" />
          참여 선수
        </h2>
        {canEdit && (
          <button 
            onClick={() => {
              setSelectedParticipants(competition.participants || [])
              setIsParticipantsModalOpen(true)
            }}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2.5 rounded-xl font-bold transition-all"
          >
            <UserPlus className="w-4 h-4" />
            참여 선수 수정
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
         {(competition.participants && competition.participants.length > 0) ? (
           <div className="flex flex-wrap gap-2">
             {athletes?.filter((a: any) => competition.participants.includes(a.id)).map((a: any) => (
               <Link 
                 key={a.id} 
                 href={`/dashboard/record-analysis?athleteId=${a.id}`}
                 className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 px-4 py-2 rounded-xl text-sm font-bold border border-indigo-100 flex items-center gap-1 transition-colors cursor-pointer"
               >
                 {a.name} <span className="text-xs font-normal opacity-75">({a.grade}학년)</span>
               </Link>
             ))}
           </div>
         ) : (
           <p className="text-slate-400 text-sm font-medium">등록된 참여 선수가 없습니다.</p>
         )}
      </div>

      <div className="flex justify-between items-center mt-12 mb-6">
        <h2 className="text-2xl font-black text-accent-navy flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          대회 결과
        </h2>
        {canEdit && (
          <button 
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-accent-navy hover:bg-blue-900 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            기록 등록
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm mb-12">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm font-bold">
            <tr>
              <th className="px-6 py-4">선수명</th>
              <th className="px-6 py-4">종목</th>
              <th className="px-6 py-4 text-center">경기 구분</th>
              <th className="px-6 py-4 text-center">순위</th>
              <th className="px-6 py-4">기록 (초)</th>
              <th className="px-6 py-4">기록일</th>
              {canEdit && <th className="px-6 py-4 text-right">관리</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {recordsPending ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">결과를 불러오는 중...</td>
              </tr>
            ) : records?.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">등록된 결과가 없습니다.</td>
              </tr>
            ) : (
              records?.map((record: any) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-accent-navy">{record.athletes?.name}</td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{record.event_name}</td>
                  <td className="px-6 py-4 text-center">
                    {record.match_type ? (
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        record.match_type === '결승' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {record.match_type}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {record.rank ? (
                      <div className="flex justify-center">
                        <span className={`flex items-center justify-center w-7 h-7 rounded-full font-black text-xs ${
                          record.rank === 1 ? 'bg-yellow-100 text-yellow-600 border-2 border-yellow-200 shadow-sm' :
                          record.rank === 2 ? 'bg-slate-100 text-slate-500 border-2 border-slate-200' :
                          record.rank === 3 ? 'bg-orange-50 text-orange-600 border-2 border-orange-200' :
                          'text-slate-500'
                        }`}>
                          {record.rank}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-blue-600 font-black">{formatTimeSeconds(record.record_time)}</td>
                  <td className="px-6 py-4 text-slate-500">{format(new Date(record.record_date), 'yyyy.MM.dd')}</td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleOpenEditRecordModal(record)}
                          className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors inline-flex"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { if(confirm('기록을 삭제하시겠습니까?')) delMutation.mutate(record.id) }}
                          className="text-rose-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors inline-flex"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Places Information Tabs */}
      <div className="mt-12 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setInfoTab('accommodations')}
            className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${
              infoTab === 'accommodations' 
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Building className="w-5 h-5" />
            숙소 정보
          </button>
          <button
            onClick={() => setInfoTab('restaurants')}
            className={`flex-1 py-4 font-bold flex items-center justify-center gap-2 transition-colors ${
              infoTab === 'restaurants' 
                ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Utensils className="w-5 h-5" />
            식당 정보
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-accent-navy">
              {infoTab === 'accommodations' ? '등록된 숙소' : '등록된 식당'}
            </h3>
            {canEdit && (
              <button 
                onClick={() => handleOpenPlaceModal()}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                {infoTab === 'accommodations' ? '숙소 추가' : '식당 추가'}
              </button>
            )}
          </div>

          {infoTab === 'accommodations' ? (
            <div className="grid md:grid-cols-2 gap-4">
              {(!competition.accommodations || competition.accommodations.length === 0) ? (
                <p className="text-slate-400 text-center py-8 col-span-full">등록된 숙소 정보가 없습니다.</p>
              ) : (
                competition.accommodations.map((place: Place) => (
                  <div key={place.id} className="border border-slate-100 rounded-2xl p-5 hover:border-indigo-100 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-black text-lg text-slate-800">{place.name}</h4>
                      {canEdit && (
                        <div className="flex gap-2 opacity-0 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenPlaceModal(place)} className="text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 p-1.5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeletePlace(place.id)} className="text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 p-1.5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-start gap-2 text-slate-600">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{place.address}</span>
                      </p>
                      {place.contact && (
                        <p className="text-slate-600">
                          <span className="font-bold text-slate-400 mr-2">연락처</span>{place.contact}
                        </p>
                      )}
                      {place.link && (
                        <a href={place.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-700 font-bold mt-2">
                          네이버 지도 보기 <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {(!competition.restaurants || competition.restaurants.length === 0) ? (
                <p className="text-slate-400 text-center py-8 col-span-full">등록된 식당 정보가 없습니다.</p>
              ) : (
                competition.restaurants.map((place: Place) => (
                  <div key={place.id} className="border border-slate-100 rounded-2xl p-5 hover:border-orange-100 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-black text-lg text-slate-800">{place.name}</h4>
                      {canEdit && (
                        <div className="flex gap-2 opacity-0 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenPlaceModal(place)} className="text-slate-400 hover:text-orange-600 bg-slate-50 hover:bg-orange-50 p-1.5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeletePlace(place.id)} className="text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 p-1.5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-start gap-2 text-slate-600">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{place.address}</span>
                      </p>
                      {place.contact && (
                        <p className="text-slate-600">
                          <span className="font-bold text-slate-400 mr-2">연락처</span>{place.contact}
                        </p>
                      )}
                      {place.link && (
                        <a href={place.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-orange-500 hover:text-orange-700 font-bold mt-2">
                          네이버 지도 보기 <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="대회 기록 등록">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">선수 선택</label>
            <select {...register('athlete_id')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 text-slate-700">
              <option value="">선수를 선택하세요</option>
              {athletes?.map((athlete: any) => (
                <option key={athlete.id} value={athlete.id}>{athlete.name} ({athlete.grade}학년)</option>
              ))}
            </select>
            {errors.athlete_id && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.athlete_id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-2">종목 선택</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_OPTIONS.map(event => (
                <button
                  key={event.key}
                  type="button"
                  onClick={() => setValue('event_name', event.key, { shouldValidate: true })}
                  className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
                    selectedEventName === event.key
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {event.label}
                </button>
              ))}
            </div>
            <input type="hidden" {...register('event_name')} />
            {errors.event_name && <p className="text-rose-500 text-xs font-bold mt-2 ml-1">{errors.event_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">기록</label>
              <input 
                type="text" 
                {...register('record_time')} 
                className="w-full px-4 py-3 rounded-2xl border bg-slate-50" 
                placeholder="예: 1:02.09 또는 25.43" 
              />
              {errors.record_time && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.record_time.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">기록일</label>
              <input type="date" {...register('record_date')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" />
              {errors.record_date && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.record_date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">경기 구분 <span className="text-slate-400 text-xs font-normal ml-1">(선택)</span></label>
              <select {...register('match_type')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50">
                <option value="">선택 안함</option>
                <option value="예선">예선</option>
                <option value="결승">결승</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">순위 <span className="text-slate-400 text-xs font-normal ml-1">(선택)</span></label>
              <input type="number" {...register('rank')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" placeholder="예: 1" />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">취소</button>
            <button type="submit" disabled={addMutation.isPending} className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-accent-navy hover:bg-blue-900 shadow-lg shadow-blue-900/30">등록하기</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditRecordModalOpen} onClose={() => setIsEditRecordModalOpen(false)} title="대회 기록 수정">
        <form onSubmit={handleSubmit(onSubmitEditRecord)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">선수 선택</label>
            <select {...register('athlete_id')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 text-slate-700" disabled>
              <option value="">선수를 선택하세요</option>
              {athletes?.map((athlete: any) => (
                <option key={athlete.id} value={athlete.id}>{athlete.name} ({athlete.grade}학년)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-2">종목 선택</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_OPTIONS.map(event => (
                <button
                  key={event.key}
                  type="button"
                  onClick={() => setValue('event_name', event.key, { shouldValidate: true })}
                  className={`px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
                    selectedEventName === event.key
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {event.label}
                </button>
              ))}
            </div>
            <input type="hidden" {...register('event_name')} />
            {errors.event_name && <p className="text-rose-500 text-xs font-bold mt-2 ml-1">{errors.event_name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">기록 (초)</label>
              <input 
                type="text" 
                {...register('record_time')} 
                className="w-full px-4 py-3 rounded-2xl border bg-slate-50" 
                placeholder="예: 1:02.09 또는 25.43" 
              />
              {errors.record_time && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.record_time.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">기록일</label>
              <input type="date" {...register('record_date')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" />
              {errors.record_date && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{errors.record_date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">경기 구분 <span className="text-slate-400 text-xs font-normal ml-1">(선택)</span></label>
              <select {...register('match_type')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50">
                <option value="">선택 안함</option>
                <option value="예선">예선</option>
                <option value="결승">결승</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">순위 <span className="text-slate-400 text-xs font-normal ml-1">(선택)</span></label>
              <input type="number" {...register('rank')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" placeholder="예: 1" />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsEditRecordModalOpen(false)} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">취소</button>
            <button type="submit" disabled={editRecordMutation.isPending} className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30">수정하기</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isParticipantsModalOpen} onClose={() => setIsParticipantsModalOpen(false)} title="참여 선수 수정">
        <div className="space-y-4">
          <p className="text-sm font-bold text-accent-navy mb-4">대회에 참여할 선수를 선택해주세요.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-2">
            {athletes?.map((athlete: any) => {
              const isSelected = selectedParticipants.includes(athlete.id)
              return (
                <button
                  key={athlete.id}
                  onClick={() => handleToggleParticipant(athlete.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                      : 'border-slate-100 hover:border-indigo-200 text-slate-600'
                  }`}
                >
                  <span className="font-bold">
                    {athlete.name} <span className="text-xs font-normal opacity-70 ml-1">({athlete.grade}학년)</span>
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-indigo-500" />}
                </button>
              )
            })}
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={() => setIsParticipantsModalOpen(false)}
              className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
            <button 
              onClick={handleUpdateParticipants}
              disabled={updateParticipantsMutation.isPending}
              className="flex-1 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {updateParticipantsMutation.isPending ? '수정 중...' : '수정 완료'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isPlaceModalOpen} onClose={() => setIsPlaceModalOpen(false)} title={infoTab === 'accommodations' ? '숙소 정보 등록' : '식당 정보 등록'}>
        <form onSubmit={handleSubmitPlace(onSubmitPlace)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">
              {infoTab === 'accommodations' ? '숙소 명칭' : '식당 명칭'}
            </label>
            <input 
              type="text" 
              {...registerPlace('name')} 
              className="w-full px-4 py-3 rounded-2xl border bg-slate-50" 
              placeholder={infoTab === 'accommodations' ? '예: 한려 호텔' : '예: 맛있는 식당'} 
            />
            {placeErrors.name && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{placeErrors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">주소</label>
            <input 
              type="text" 
              {...registerPlace('address')} 
              className="w-full px-4 py-3 rounded-2xl border bg-slate-50" 
              placeholder="예: 부산광역시 해운대구..." 
            />
            {placeErrors.address && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{placeErrors.address.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">연락처 <span className="text-slate-400 text-xs font-normal ml-1">(선택)</span></label>
            <input 
              type="text" 
              {...registerPlace('contact')} 
              className="w-full px-4 py-3 rounded-2xl border bg-slate-50" 
              placeholder="예: 051-123-4567" 
            />
            {placeErrors.contact && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{placeErrors.contact.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">네이버 지도 링크 <span className="text-slate-400 text-xs font-normal ml-1">(선택)</span></label>
            <input 
              type="text" 
              {...registerPlace('link')} 
              className="w-full px-4 py-3 rounded-2xl border bg-slate-50" 
              placeholder="예: https://map.naver.com/..." 
            />
            {placeErrors.link && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{placeErrors.link.message}</p>}
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsPlaceModalOpen(false)} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">취소</button>
            <button type="submit" disabled={updatePlacesMutation.isPending} className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-accent-navy hover:bg-blue-900 shadow-lg shadow-blue-900/30">
              {editingPlace ? '수정하기' : '등록하기'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditCompModalOpen} onClose={() => setIsEditCompModalOpen(false)} title="대회 정보 수정">
        <form onSubmit={handleSubmitEditComp(onSubmitEditComp)} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">대회명</label>
            <input {...registerEditComp('title')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" placeholder="예: 전라남도 소년체전" />
            {editCompErrors.title && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{editCompErrors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">시작일</label>
              <input type="date" {...registerEditComp('date')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" />
              {editCompErrors.date && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{editCompErrors.date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-1">종료일</label>
              <input type="date" {...registerEditComp('end_date')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" />
              {editCompErrors.end_date && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{editCompErrors.end_date.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-bold text-accent-navy mb-1">장소</label>
              <input {...registerEditComp('location')} className="w-full px-4 py-3 rounded-2xl border bg-slate-50" placeholder="개최 수영장" />
              {editCompErrors.location && <p className="text-rose-500 text-xs font-bold mt-1 ml-1">{editCompErrors.location.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-accent-navy mb-1">대회 목표/설명</label>
            <textarea {...registerEditComp('description')} rows={3} className="w-full px-4 py-3 rounded-2xl border bg-slate-50 resize-none" placeholder="비고를 입력하세요" />
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsEditCompModalOpen(false)} className="flex-1 py-3.5 rounded-2xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200">취소</button>
            <button type="submit" disabled={editCompMutation.isPending} className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30">수정하기</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
