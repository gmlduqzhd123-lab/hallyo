'use client'

import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Download, Upload } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { addRecordsBulk, type BulkRecordRow } from '@/app/actions/records'
import { normalizeEventName, parseDateCell, parseRecordTime } from '@/lib/record-import'
import type { AthleteSummary } from '@/types/database'

type EventOption = { key: string; label: string }

// 엑셀에서 읽은 한 줄 (저장할 수 있으면 row, 아니면 problem)
type PreviewRow = { line: number; name: string; event: string; time: string; row?: BulkRecordRow; problem?: string }

interface BulkRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  scheduleId: string
  defaultDate: string
  athletes: AthleteSummary[]
  participantIds: string[]
  eventOptions: EventOption[]
}

// 대회 기록 한꺼번에 입력: 종목 하나를 고르고 참가 선수 기록을 표에 한 번에 적거나, 엑셀 파일로 올립니다.
export function BulkRecordModal({ isOpen, onClose, onSaved, scheduleId, defaultDate, athletes, participantIds, eventOptions }: BulkRecordModalProps) {
  const [tab, setTab] = useState<'table' | 'excel'>('table')
  const [eventName, setEventName] = useState('')
  const [matchType, setMatchType] = useState('')
  const [recordDate, setRecordDate] = useState(defaultDate)
  const [showAll, setShowAll] = useState(participantIds.length === 0)
  const [times, setTimes] = useState<Record<string, string>>({})
  const [ranks, setRanks] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const rowsAthletes = showAll ? athletes : athletes.filter((a) => participantIds.includes(a.id))

  const saveMutation = useMutation({
    mutationFn: async (rows: BulkRecordRow[]) => {
      const res = await addRecordsBulk(scheduleId, rows)
      if ('error' in res && res.error) throw new Error(res.error)
      return rows.length
    },
    onSuccess: (count) => {
      toast.success(`기록 ${count}건을 등록했습니다.`, { style: { background: '#0047AB', color: 'white' } })
      setTimes({})
      setRanks({})
      setPreview([])
      onSaved()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleSaveTable = () => {
    if (!eventName) return toast.error('종목을 선택해 주세요.')
    if (!recordDate) return toast.error('기록일을 선택해 주세요.')
    const rows: BulkRecordRow[] = []
    for (const a of rowsAthletes) {
      const raw = times[a.id]?.trim()
      if (!raw) continue
      const seconds = parseRecordTime(raw)
      if (seconds === null) return toast.error(`${a.name} 선수의 기록(${raw})을 알아볼 수 없습니다. 예: 25.43 또는 1:02.09`)
      const rank = ranks[a.id]?.trim()
      rows.push({
        athlete_id: a.id,
        event_name: eventName,
        record_time: seconds,
        record_date: recordDate,
        rank: rank ? Number(rank) : null,
        match_type: matchType || null,
      })
    }
    if (rows.length === 0) return toast.error('기록을 하나 이상 입력해 주세요.')
    saveMutation.mutate(rows)
  }

  const handleDownloadTemplate = () => {
    const sample = rowsAthletes.slice(0, 2).map((a, i) => ({
      '이름': a.name, '종목': i === 0 ? '자유형 50M' : '평영 100M', '기록': i === 0 ? '32.15' : '1:35.40',
      '순위': i === 0 ? 3 : '', '경기구분': '결승', '기록일': defaultDate,
    }))
    const ws = XLSX.utils.json_to_sheet(sample.length ? sample : [{ '이름': '', '종목': '', '기록': '', '순위': '', '경기구분': '', '기록일': defaultDate }])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '기록')
    XLSX.writeFile(wb, '대회기록_일괄등록_양식.xlsx')
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'array' })
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]])
        const eventKeys = new Set(eventOptions.map((o) => o.key))
        const rows: PreviewRow[] = data.map((r, i) => {
          const name = String(r['이름'] ?? '').trim()
          const event = normalizeEventName(r['종목'])
          const timeRaw = r['기록']
          const base = { line: i + 2, name, event, time: String(timeRaw ?? '') }
          if (!name) return { ...base, problem: '이름 없음' }
          const matches = athletes.filter((a) => a.name === name)
          if (matches.length === 0) return { ...base, problem: '명단에 없는 이름' }
          if (matches.length > 1) return { ...base, problem: '같은 이름이 둘 이상' }
          if (!event) return { ...base, problem: '종목 없음' }
          if (!eventKeys.has(event)) return { ...base, problem: `알 수 없는 종목` }
          const seconds = parseRecordTime(timeRaw)
          if (seconds === null) return { ...base, problem: '기록을 알아볼 수 없음' }
          const date = parseDateCell(r['기록일']) || defaultDate
          const rank = Number(r['순위'])
          const match = String(r['경기구분'] ?? '').trim()
          return {
            ...base,
            time: String(seconds),
            row: {
              athlete_id: matches[0].id,
              event_name: event,
              record_time: seconds,
              record_date: date,
              rank: Number.isFinite(rank) && rank > 0 ? rank : null,
              match_type: match === '예선' || match === '결승' ? match : null,
            },
          }
        })
        setPreview(rows)
        if (rows.length === 0) toast.error('엑셀에 기록이 없습니다.')
      } catch {
        toast.error('엑셀 파일을 읽지 못했습니다. 양식을 확인해 주세요.')
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const validPreview = preview.filter((p) => p.row).map((p) => p.row as BulkRecordRow)
  const tabClass = (active: boolean) =>
    `py-2 rounded-xl font-bold text-sm transition-colors ${active ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="기록 한꺼번에 입력">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
          <button type="button" className={tabClass(tab === 'table')} onClick={() => setTab('table')}>표에 입력</button>
          <button type="button" className={tabClass(tab === 'excel')} onClick={() => setTab('excel')}>엑셀 업로드</button>
        </div>

        {tab === 'table' ? (
          <>
            <div>
              <label className="block text-sm font-bold text-accent-navy mb-2">종목</label>
              <div className="flex flex-wrap gap-2">
                {eventOptions.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setEventName(o.key)}
                    className={`px-3 py-1.5 rounded-2xl text-sm font-bold transition-all ${eventName === o.key ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm font-bold text-accent-navy mb-1">기록일</span>
                <input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} className="w-full px-3 py-2.5 rounded-2xl border bg-slate-50" />
              </label>
              <label className="block">
                <span className="block text-sm font-bold text-accent-navy mb-1">경기 구분</span>
                <select value={matchType} onChange={(e) => setMatchType(e.target.value)} className="w-full px-3 py-2.5 rounded-2xl border bg-slate-50">
                  <option value="">선택 안함</option>
                  <option value="예선">예선</option>
                  <option value="결승">결승</option>
                </select>
              </label>
            </div>

            {participantIds.length > 0 && (
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
                참여 선수 말고 다른 선수도 보기
              </label>
            )}

            <div className="border rounded-2xl overflow-hidden">
              <div className="grid grid-cols-[1fr_7rem_4rem] gap-2 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                <span>선수</span><span>기록</span><span>순위</span>
              </div>
              <div className="divide-y max-h-[40vh] overflow-y-auto">
                {rowsAthletes.map((a) => (
                  <div key={a.id} className="grid grid-cols-[1fr_7rem_4rem] gap-2 items-center px-3 py-2">
                    <span className="font-bold text-slate-700 truncate">{a.name} <span className="text-xs text-slate-400">{a.grade}학년</span></span>
                    <input
                      value={times[a.id] ?? ''}
                      onChange={(e) => setTimes({ ...times, [a.id]: e.target.value })}
                      inputMode="decimal"
                      placeholder="25.43"
                      className="w-full px-2 py-1.5 rounded-xl border bg-white text-sm"
                    />
                    <input
                      value={ranks[a.id] ?? ''}
                      onChange={(e) => setRanks({ ...ranks, [a.id]: e.target.value.replace(/[^0-9]/g, '') })}
                      inputMode="numeric"
                      className="w-full px-2 py-1.5 rounded-xl border bg-white text-sm"
                    />
                  </div>
                ))}
                {rowsAthletes.length === 0 && <p className="px-3 py-6 text-center text-sm text-slate-400 font-bold">선수가 없습니다.</p>}
              </div>
            </div>
            <p className="text-xs text-slate-500">기록을 적은 선수만 등록됩니다. 1분이 넘으면 1:02.09 처럼 적어 주세요. 저장한 뒤 다른 종목을 골라 이어서 입력할 수 있습니다.</p>

            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={handleSaveTable}
              className="w-full py-3.5 rounded-2xl font-bold text-white bg-accent-navy hover:bg-blue-900 disabled:opacity-50"
            >
              {saveMutation.isPending ? '저장 중…' : '이 종목 기록 저장'}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              칸 이름: <b>이름, 종목, 기록, 순위, 경기구분, 기록일</b>. 순위·경기구분·기록일은 비워도 되고, 기록일을 비우면 대회 시작일로 들어갑니다.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={handleDownloadTemplate} className="py-2.5 rounded-2xl bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100 flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> 양식 받기
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="py-2.5 rounded-2xl bg-secondary/15 text-primary font-bold hover:bg-secondary/25 flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" /> 파일 올리기
              </button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
            </div>

            {preview.length > 0 && (
              <>
                <div className="border rounded-2xl divide-y max-h-[40vh] overflow-y-auto text-sm">
                  {preview.map((p) => (
                    <div key={p.line} className={`px-3 py-2 flex gap-2 ${p.problem ? 'bg-rose-50' : ''}`}>
                      <span className="text-slate-400 w-8 shrink-0">{p.line}</span>
                      <span className="font-bold text-slate-700 flex-1 min-w-0 truncate">{p.name || '-'} · {p.event || '-'} · {p.time || '-'}</span>
                      {p.problem && <span className="text-rose-600 font-bold shrink-0">{p.problem}</span>}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  {validPreview.length}건 저장 가능{preview.length - validPreview.length > 0 ? `, ${preview.length - validPreview.length}건은 빨간 줄의 이유로 건너뜁니다.` : '.'}
                </p>
                <button
                  type="button"
                  disabled={saveMutation.isPending || validPreview.length === 0}
                  onClick={() => saveMutation.mutate(validPreview)}
                  className="w-full py-3.5 rounded-2xl font-bold text-white bg-accent-navy hover:bg-blue-900 disabled:opacity-50"
                >
                  {saveMutation.isPending ? '저장 중…' : `${validPreview.length}건 저장`}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
