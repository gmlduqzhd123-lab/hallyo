'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { AddAthleteModal } from '@/components/athletes/add-athlete-modal'
import { DataTable, Athlete } from '@/components/athletes/data-table'
import { PbChartModal } from '@/components/athletes/pb-chart-modal'
import { UserPlus, Download, Upload, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import { bulkAddAthletes } from '@/app/actions/athletes'
import { toast } from 'sonner'

export default function AthletesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data: athletes, isPending, isError, error } = useQuery({
    queryKey: ['athletes'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('athletes')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return data as Athlete[]
    }
  })

  const bulkMutation = useMutation({
    mutationFn: async (parsedData: unknown[]) => {
      const res = await bulkAddAthletes(parsedData as { name: string, gender: 'M' | 'F', grade: number }[])
      if (res?.error) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      toast.success('엑셀 일괄 등록이 완료되었습니다.', {
        style: { background: '#0047AB', color: 'white', border: 'none' }
      })
      queryClient.invalidateQueries({ queryKey: ['athletes'] })
    },
    onError: (err: Error) => {
      toast.error(err.message, {
        style: { background: '#FFE4E6', color: '#E11D48', border: 'none' }
      })
    }
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

        // Mapping Korean headers to English keys
        const mappedData = data.map((row) => ({
          name: String(row['이름'] || row['name'] || ''),
          gender: row['성별'] === '남' ? 'M' : row['성별'] === '여' ? 'F' : row['gender'],
          grade: Number(row['학년'] || row['grade'])
        }))

        bulkMutation.mutate(mappedData)
      } catch {
        toast.error('엑셀 파일을 파싱하는데 실패했습니다. 템플릿 형식을 확인해주세요.')
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsBinaryString(file)
  }

  const handleExport = () => {
    if (!athletes || athletes.length === 0) {
      toast.error('내보낼 데이터가 없습니다.')
      return
    }

    const exportData = athletes.map(a => ({
      '이름': a.name,
      '성별': a.gender === 'M' ? '남' : '여',
      '학년': a.grade,
      '등록일': new Date(a.created_at).toLocaleDateString()
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '선수 명단')
    XLSX.writeFile(wb, '한려초_수영부_선수명단.xlsx')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-accent-navy">선수 명단</h1>
          <p className="text-slate-500 mt-1">등록된 선수를 관리하고 기록을 확인할 수 있습니다.</p>
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={bulkMutation.isPending}
            className="px-4 py-2.5 rounded-2xl bg-secondary/15 text-primary font-bold hover:bg-secondary/25 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">{bulkMutation.isPending ? '처리중...' : '일괄 등록'}</span>
          </button>
          
          <button 
            onClick={handleExport}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">엑셀 다운로드</span>
          </button>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-primary text-white font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-primary/30 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            선수 추가
          </button>
        </div>
      </div>

      {isPending ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-t-primary border-primary/20 rounded-full animate-spin"></div>
        </div>
      ) : isError ? (
         <div className="flex items-center justify-center gap-3 text-rose-500 bg-rose-50 p-6 rounded-3xl border border-rose-100">
           <AlertCircle className="w-6 h-6" />
           <p className="font-bold">선수 명단을 불러오는 중 오류가 발생했습니다: {error.message}</p>
         </div>
      ) : (
        <DataTable data={athletes || []} onRowClick={(athlete) => setSelectedAthlete(athlete)} />
      )}

      {/* Modals */}
      <AddAthleteModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
      
      <PbChartModal 
        isOpen={!!selectedAthlete} 
        onClose={() => setSelectedAthlete(null)}
        athleteId={selectedAthlete?.id || null}
        athleteName={selectedAthlete?.name || null}
      />
    </div>
  )
}
