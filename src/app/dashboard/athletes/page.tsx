'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { AddAthleteModal } from '@/components/athletes/add-athlete-modal'
import { EditAthleteModal } from '@/components/athletes/edit-athlete-modal'
import { DataTable, Athlete } from '@/components/athletes/data-table'
import { PbChartModal } from '@/components/athletes/pb-chart-modal'
import { UserPlus, Download, Upload, AlertCircle, Trash2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { bulkAddAthletes, bulkDeleteAllAthletes } from '@/app/actions/athletes'
import { toast } from 'sonner'

export default function AthletesPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null)
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
      const res = await bulkAddAthletes(parsedData as Record<string, any>[])
      if (res?.error) throw new Error(res.error)
      return res
    },
    onSuccess: (res: any) => {
      const msg = res?.inserted != null && res?.updated != null
        ? `신규 ${res.inserted}명 등록, 기존 ${res.updated}명 업데이트 완료!`
        : '엑셀 일괄 등록이 완료되었습니다.'
      toast.success(msg, {
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

        const parseExcelDate = (val: unknown): string => {
          if (!val) return ''
          if (typeof val === 'number') {
            const date = new Date(Math.round((val - 25569) * 86400 * 1000))
            return date.toISOString().split('T')[0]
          }
          
          const strVal = String(val).trim()
          const numMatches = strVal.match(/\d+/g)
          
          if (numMatches && numMatches.length >= 3) {
             const y = numMatches[0]
             const m = numMatches[1]
             const d = numMatches[2]
             
             if (y.length === 4 && Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
                 return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
             }
          }
          
          return ''
        }

        // Mapping Korean headers to English keys
        const mappedData = data.map((row) => ({
          category: String(row['종별'] || row['category'] || ''),
          gender: row['성별'] === '남' ? 'M' : row['성별'] === '여' ? 'F' : row['gender'],
          name: String(row['이름'] || row['name'] || ''),
          hanja_name: String(row['한자 이름'] || row['한자이름'] || ''),
          is_registered: String(row['선수 등록 여부'] || row['선수등록'] || '').toUpperCase() === 'O',
          birth_date: parseExcelDate(row['생년 월일'] || row['생년월일']),
          attendance_start_date: parseExcelDate(row['재학 기간(시작)'] || row['재학 시작일']),
          attendance_end_date: parseExcelDate(row['재학 기간(종료)'] || row['재학 종료일']),
          join_date: parseExcelDate(row['입단 날짜'] || row['입단일']),
          grade: Number(row['학년'] || row['grade'] || 0),
          class_number: String(row['반'] || row['학급'] || row['class'] || ''),
          student_number: Number(row['번호'] || row['student_number'] || 0),
          homeroom_teacher: String(row['담임교사 성명'] || row['담임교사'] || row['담임선생님'] || ''),
          student_phone: String(row['학생 연락처'] || row['학생연락처'] || ''),
          parent_name: String(row['학부모 성함'] || row['학부모성함'] || ''),
          parent_phone: String(row['학부모 연락처'] || row['학부모연락처'] || ''),
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

  const handleDeleteAll = async () => {
    if (!athletes || athletes.length === 0) {
      toast.error('삭제할 선수가 없습니다.')
      return
    }
    if (!confirm(`등록된 선수 ${athletes.length}명을 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return
    if (!confirm('정말로 전체 삭제하시겠습니까? 한 번 더 확인합니다.')) return

    const result = await bulkDeleteAllAthletes()
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${result.count}명의 선수가 모두 삭제되었습니다.`, {
        style: { background: '#E11D48', color: 'white', border: 'none' }
      })
      queryClient.invalidateQueries({ queryKey: ['athletes'] })
    }
  }

  const handleExport = () => {
    if (!athletes || athletes.length === 0) {
      toast.error('내보낼 데이터가 없습니다.')
      return
    }

    const exportData = athletes.map(a => ({
      '종별': a.category || '-',
      '성별': a.gender === 'M' ? '남' : '여',
      '이름': a.name,
      '한자 이름': a.hanja_name || '-',
      '선수 등록 여부': a.is_registered ? 'O' : 'X',
      '생년 월일': a.birth_date || '-',
      '재학 기간 (시작일)': a.attendance_start_date || '-',
      '재학 기간 (종료일)': a.attendance_end_date || '-',
      '입단 날짜': a.join_date || '-',
      '학년': a.grade || '-',
      '반': a.class_number || '-',
      '번호': a.student_number || '-',
      '담임교사 성명': a.homeroom_teacher || '-',
      '학생 연락처': a.student_phone || '-',
      '학부모 성함': a.parent_name || '-',
      '학부모 연락처': a.parent_phone || '-',
      '등록일': new Date(a.created_at).toLocaleDateString()
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '선수 명단')
    XLSX.writeFile(wb, '여수한려초_수영부_선수명단.xlsx')
  }

  const handleDownloadTemplate = () => {
    const templateData = [
      { '종별': '남초', '성별': '남', '이름': '홍길동', '한자 이름': '洪吉童', '선수 등록 여부': 'O', '생년 월일': '2013-01-01', '재학 기간 (시작일)': '2020-03-02', '재학 기간 (종료일)': '2026-02-28', '입단 날짜': '2022-05-01', '학년': 5, '반': '3', '번호': 15, '담임교사 성명': '이몽룡', '학생 연락처': '010-1111-2222', '학부모 성함': '홍판서', '학부모 연락처': '010-3333-4444' },
      { '종별': '여초', '성별': '여', '이름': '심청이', '한자 이름': '沈淸', '선수 등록 여부': 'X', '생년 월일': '2014-05-05', '재학 기간 (시작일)': '2021-03-02', '재학 기간 (종료일)': '2027-02-28', '입단 날짜': '2023-01-01', '학년': 4, '반': '1', '번호': 10, '담임교사 성명': '성춘향', '학생 연락처': '010-5555-6666', '학부모 성함': '심봉사', '학부모 연락처': '010-7777-8888' }
    ]
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '양식')
    XLSX.writeFile(wb, '선수_일괄등록_양식.xlsx')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-accent-navy">선수 명단</h1>
          <p className="text-slate-500 mt-1">등록된 선수를 관리하고 기록을 확인할 수 있습니다.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={handleDownloadTemplate}
            className="px-4 py-2.5 rounded-2xl bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">양식 다운로드</span>
          </button>

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

          <button 
            onClick={handleDeleteAll}
            className="px-4 py-2.5 rounded-2xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">전체 삭제</span>
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
        <DataTable 
          data={athletes || []} 
          onRowClick={(athlete) => setSelectedAthlete(athlete)}
          onEdit={(athlete) => setEditingAthlete(athlete)}
        />
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

      <EditAthleteModal
        isOpen={!!editingAthlete}
        onClose={() => setEditingAthlete(null)}
        athlete={editingAthlete}
      />
    </div>
  )
}
