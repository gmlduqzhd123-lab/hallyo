'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Swords, Search, Loader2, Trophy, X, User } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { PageHeader } from '@/components/ui/page-header'

// --- Types ---
type RankingRow = {
  id: string
  athlete_name: string
  school: string
  gender: string
  event: string
  record: string
  rank: number
  grade: number | null
  year: number
}

type ChartDataPoint = {
  event: string
  athleteA: number | null
  athleteB: number | null
  athleteARecord: string
  athleteBRecord: string
}

// --- Helpers ---
const parseRecordToSeconds = (record: string): number => {
  if (!record) return 0
  const parts = record.split(':')
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseFloat(parts[1])
  }
  return parseFloat(record)
}

const formatSecondsToRecord = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '-'
  if (seconds < 60) return seconds.toFixed(2)
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(2).padStart(5, '0')
  return `${String(m).padStart(2, '0')}:${s}`
}

// --- Custom Tooltip ---
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-4 min-w-[180px]">
      <p className="font-black text-slate-800 text-sm mb-2 border-b border-slate-100 pb-2">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs font-bold text-slate-600">{entry.name}</span>
          </div>
          <span className="font-mono font-black text-sm" style={{ color: entry.color }}>
            {entry.name.includes('🔵') ? entry.payload.athleteARecord : entry.payload.athleteBRecord}
          </span>
        </div>
      ))}
    </div>
  )
}

// --- Autocomplete Component ---
function AthleteSearchInput({
  label, color, icon, athletes, value, onChange, onClear, placeholder = '선수 이름 검색...'
}: {
  label: string; color: 'blue' | 'red'; icon: string
  athletes: string[]; value: string
  onChange: (name: string) => void; onClear: () => void
  placeholder?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return athletes.slice(0, 30)
    const q = query.toLowerCase()
    return athletes.filter(n => n.toLowerCase().includes(q)).slice(0, 30)
  }, [query, athletes])

  const borderColor = color === 'blue' ? 'border-blue-400 focus-within:ring-blue-400/20' : 'border-red-400 focus-within:ring-red-400/20'
  const bgColor = color === 'blue' ? 'bg-blue-50' : 'bg-red-50'
  const textColor = color === 'blue' ? 'text-blue-700' : 'text-red-700'
  const badgeColor = color === 'blue' ? 'bg-blue-500' : 'bg-red-500'

  return (
    <div ref={ref} className="flex-1 w-full md:min-w-[250px]">
      <label className={`text-sm font-black ${textColor} ml-1 mb-2 flex items-center gap-2`}>
        <span className={`w-6 h-6 ${badgeColor} text-white rounded-full flex items-center justify-center text-xs`}>{icon}</span>
        {label}
      </label>
      {value ? (
        <div className={`flex items-center justify-between ${bgColor} border-2 ${borderColor} rounded-2xl px-5 py-3.5`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${badgeColor} text-white flex items-center justify-center font-black text-lg`}>
              {value.substring(0, 1)}
            </div>
            <span className={`font-black text-lg ${textColor} truncate`}>{value}</span>
          </div>
          <button onClick={() => { onClear(); setQuery('') }} className="p-1.5 hover:bg-white/60 rounded-full transition-colors shrink-0">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className={`flex items-center gap-3 border-2 ${borderColor} rounded-2xl px-4 py-3 bg-white focus-within:ring-4 transition-all`}>
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
              className="flex-1 w-full min-w-0 outline-none font-medium text-slate-700 bg-transparent"
            />
          </div>
          {open && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 max-h-60 overflow-y-auto z-50">
              {filtered.map(name => (
                <button key={name} onClick={() => { onChange(name); setQuery(''); setOpen(false) }}
                  className="w-full text-left px-5 py-3 hover:bg-slate-50 text-sm font-bold text-slate-700 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0">
                  <User className="w-4 h-4 text-slate-400" />
                  {name}
                </button>
              ))}
            </div>
          )}
          {open && query && filtered.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-6 z-50 text-center text-slate-400 text-sm font-medium">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Main Page ---
export default function RivalComparisonPage() {
  const supabase = createClient()
  const [athleteA, setAthleteA] = useState('')
  const [athleteB, setAthleteB] = useState('')

  // Fetch our athlete names
  const { data: ourAthleteNames = [] } = useQuery({
    queryKey: ['our_athlete_names'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('athletes')
        .select('name')
        .eq('is_deleted', false)
      if (error) throw error
      const unique = [...new Set((data || []).map((r: any) => r.name as string))].sort()
      return unique
    }
  })

  // Fetch rival athlete names (all from nationwide_rankings)
  const { data: rivalAthleteNames = [] } = useQuery({
    queryKey: ['rival_athlete_names'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nationwide_rankings')
        .select('athlete_name')
        .eq('is_deleted', false)
      if (error) throw error
      const unique = [...new Set((data || []).map((r: any) => r.athlete_name as string))].sort()
      return unique
    }
  })

  // Fetch comparison data
  const { data: comparisonData, isPending: isComparing } = useQuery({
    queryKey: ['rival_comparison', athleteA, athleteB],
    enabled: !!athleteA && !!athleteB,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nationwide_rankings')
        .select('*')
        .eq('is_deleted', false)
        .in('athlete_name', [athleteA, athleteB])
      if (error) throw error
      return data as RankingRow[]
    }
  })

  // Process chart data
  const chartData = useMemo((): ChartDataPoint[] => {
    if (!comparisonData || !athleteA || !athleteB) return []

    const bestByAthlete = (name: string) => {
      const rows = comparisonData.filter(r => r.athlete_name === name)
      const map = new Map<string, RankingRow>()
      for (const row of rows) {
        const sec = parseRecordToSeconds(row.record)
        const existing = map.get(row.event)
        if (!existing || sec < parseRecordToSeconds(existing.record)) {
          map.set(row.event, row)
        }
      }
      return map
    }

    const bestA = bestByAthlete(athleteA)
    const bestB = bestByAthlete(athleteB)
    const allEvents = [...new Set([...bestA.keys(), ...bestB.keys()])]

    const EVENT_ORDER = [
      '자유형50m', '자유형100m', '자유형200m', '자유형400m',
      '배영50m', '배영100m', '배영200m',
      '평영50m', '평영100m', '평영200m',
      '접영50m', '접영100m', '접영200m',
      '개인혼영200m'
    ]
    allEvents.sort((a, b) => {
      const ai = EVENT_ORDER.indexOf(a), bi = EVENT_ORDER.indexOf(b)
      if (ai === -1 && bi === -1) return a.localeCompare(b)
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })

    return allEvents.map(event => {
      const rowA = bestA.get(event)
      const rowB = bestB.get(event)
      return {
        event,
        athleteA: rowA ? parseRecordToSeconds(rowA.record) : null,
        athleteB: rowB ? parseRecordToSeconds(rowB.record) : null,
        athleteARecord: rowA?.record || '-',
        athleteBRecord: rowB?.record || '-',
      }
    })
  }, [comparisonData, athleteA, athleteB])

  // Summary stats
  const summary = useMemo(() => {
    let aWins = 0, bWins = 0, draws = 0
    for (const pt of chartData) {
      if (pt.athleteA != null && pt.athleteB != null) {
        if (pt.athleteA < pt.athleteB) aWins++
        else if (pt.athleteB < pt.athleteA) bWins++
        else draws++
      }
    }
    return { aWins, bWins, draws, total: aWins + bWins + draws }
  }, [chartData])

  const bothSelected = !!athleteA && !!athleteB

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <PageHeader
        title="라이벌 전력 비교 ⚔️"
        settingKey="rival_comparison_desc"
        defaultDescription="소년체전 대비! 우리 선수와 라이벌의 기록을 비교해 보세요"
        icon={<Swords className="w-8 h-8 text-primary" />}
      />

      {/* Athlete Selection */}
      <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100">
        <h2 className="font-black text-lg text-slate-800 mb-5 flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-500" /> 선수 선택
        </h2>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <AthleteSearchInput label="우리 선수" color="blue" icon="A" athletes={ourAthleteNames} value={athleteA} onChange={setAthleteA} onClear={() => setAthleteA('')} placeholder="예: 임소은, 임지율, 여서원..." />
          <div className="hidden md:flex items-center justify-center self-end mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-2xl font-black text-indigo-500 border-2 border-indigo-200 shadow-sm">
              VS
            </div>
          </div>
          <div className="md:hidden flex items-center justify-center w-full py-1">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-lg font-black text-indigo-500 border-2 border-indigo-200">VS</div>
          </div>
          <AthleteSearchInput label="라이벌 선수" color="red" icon="B" athletes={rivalAthleteNames} value={athleteB} onChange={setAthleteB} onClear={() => setAthleteB('')} />
        </div>
      </div>

      {/* Results */}
      {!bothSelected ? (
        <div className="bg-white rounded-[32px] p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="w-24 h-24 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mb-6">
            <Swords className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2 break-keep">두 선수를 선택해 주세요</h3>
          <p className="text-slate-500 text-sm break-keep">우리 선수와 라이벌 선수를 선택하면<br/>종목별 기록 비교 차트가 나타납니다! 🏊‍♂️</p>
        </div>
      ) : isComparing ? (
        <div className="bg-white rounded-[32px] p-16 flex flex-col items-center justify-center border border-slate-100 shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
          <p className="font-bold text-slate-500">기록을 비교하는 중...</p>
        </div>
      ) : chartData.length === 0 ? (
        <div className="bg-white rounded-[32px] p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="w-24 h-24 bg-amber-50 text-amber-300 rounded-full flex items-center justify-center mb-6">
            <Trophy className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2 break-keep">비교할 기록이 없습니다</h3>
          <p className="text-slate-500 text-sm break-keep">선택한 두 선수의 전국 대회 기록이 아직 등록되지 않았습니다.</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary.total > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-5 text-center border border-blue-200/50 shadow-sm">
                <p className="text-xs font-bold text-blue-500 mb-1">🔵 {athleteA}</p>
                <p className="text-4xl font-black text-blue-600">{summary.aWins}</p>
                <p className="text-xs font-bold text-blue-400 mt-1">승리 종목</p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-5 text-center border border-slate-200/50 shadow-sm">
                <p className="text-xs font-bold text-slate-500 mb-1">무승부</p>
                <p className="text-4xl font-black text-slate-500">{summary.draws}</p>
                <p className="text-xs font-bold text-slate-400 mt-1">동일 기록</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-3xl p-5 text-center border border-red-200/50 shadow-sm">
                <p className="text-xs font-bold text-red-500 mb-1">🔴 {athleteB}</p>
                <p className="text-4xl font-black text-red-600">{summary.bWins}</p>
                <p className="text-xs font-bold text-red-400 mt-1">승리 종목</p>
              </div>
            </div>
          )}

          {/* Bar Chart */}
          <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100">
            <h2 className="font-black text-lg text-slate-800 mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> 종목별 기록 비교 (낮을수록 빠름)
            </h2>
            <div className="w-full overflow-x-auto">
              <div style={{ minWidth: Math.max(chartData.length * 100, 500), height: 420 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={4} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="event" tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} interval={0} angle={-30} textAnchor="end" height={70} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v: number) => formatSecondsToRecord(v)} width={65} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 13, fontWeight: 800 }} />
                    <Bar dataKey="athleteA" name={`🔵 ${athleteA}`} fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={40}>
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.athleteA != null && entry.athleteB != null && entry.athleteA <= entry.athleteB ? '#2563eb' : '#93c5fd'} />
                      ))}
                    </Bar>
                    <Bar dataKey="athleteB" name={`🔴 ${athleteB}`} fill="#ef4444" radius={[8, 8, 0, 0]} maxBarSize={40}>
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.athleteA != null && entry.athleteB != null && entry.athleteB <= entry.athleteA ? '#dc2626' : '#fca5a5'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detail Table */}
          <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100">
            <h2 className="font-black text-lg text-slate-800 mb-4">📋 상세 기록 비교</h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3.5 text-left font-bold text-slate-600">종목</th>
                    <th className="px-5 py-3.5 text-center font-bold text-blue-600">🔵 {athleteA}</th>
                    <th className="px-5 py-3.5 text-center font-bold text-red-600">🔴 {athleteB}</th>
                    <th className="px-5 py-3.5 text-center font-bold text-slate-600">차이</th>
                    <th className="px-5 py-3.5 text-center font-bold text-slate-600">결과</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {chartData.map(row => {
                    const diff = row.athleteA != null && row.athleteB != null ? Math.abs(row.athleteA - row.athleteB) : null
                    const winner = row.athleteA != null && row.athleteB != null
                      ? row.athleteA < row.athleteB ? 'A' : row.athleteB < row.athleteA ? 'B' : 'draw'
                      : null
                    return (
                      <tr key={row.event} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-800">{row.event}</td>
                        <td className={`px-5 py-3.5 text-center font-mono font-bold ${winner === 'A' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500'}`}>
                          {row.athleteARecord}
                        </td>
                        <td className={`px-5 py-3.5 text-center font-mono font-bold ${winner === 'B' ? 'text-red-600 bg-red-50/50' : 'text-slate-500'}`}>
                          {row.athleteBRecord}
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono text-xs text-slate-400 font-bold">
                          {diff != null ? `${diff.toFixed(2)}초` : '-'}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {winner === 'A' && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-black">🔵 승</span>}
                          {winner === 'B' && <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-black">🔴 승</span>}
                          {winner === 'draw' && <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-black">무승부</span>}
                          {winner === null && <span className="text-slate-300 text-xs font-bold">-</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
