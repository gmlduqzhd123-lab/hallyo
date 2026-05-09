'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/utils/supabase/client'
import { Medal, Zap, Target, TrendingUp, Trophy, Loader2, RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'

// --- Constants ---
const EVENT_OPTIONS = [
  '자유형50m', '자유형100m', '자유형200m', '자유형400m',
  '배영50m', '배영100m',
  '평영50m', '평영100m', '평영200m',
  '접영50m', '접영100m',
  '개인혼영200m'
]

const GENDER_OPTIONS = [
  { label: '남자', value: '남자' },
  { label: '여자', value: '여자' },
]

// --- Helpers ---
const parseRecordToSeconds = (record: string): number | null => {
  if (!record || !record.trim()) return null
  const trimmed = record.trim()

  // "MM:SS.ss" format
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':')
    if (parts.length !== 2) return null
    const mins = parseInt(parts[0], 10)
    const secs = parseFloat(parts[1])
    if (isNaN(mins) || isNaN(secs)) return null
    return mins * 60 + secs
  }

  // "SS.ss" format
  const val = parseFloat(trimmed)
  if (isNaN(val)) return null
  return val
}

const formatSecondsToRecord = (seconds: number): string => {
  if (isNaN(seconds) || seconds <= 0) return '-'
  if (seconds < 60) return seconds.toFixed(2)
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(2).padStart(5, '0')
  return `${String(m).padStart(2, '0')}:${s}`
}

// --- Result Type ---
type SimResult = {
  rank: number
  total: number
  percentile: number
  inputSeconds: number
  topRecord: number
  avgRecord: number
  gap: number
}

// --- Result Card ---
function ResultCard({ result, event, onReset }: { result: SimResult; event: string; onReset: () => void }) {
  const { rank, total, percentile, inputSeconds, topRecord, gap } = result
  const isTop10 = percentile <= 10
  const isTop30 = percentile <= 30
  const isTop50 = percentile <= 50

  let tierColor = ''
  let tierBg = ''
  let tierBorder = ''
  let tierGlow = ''
  let tierLabel = ''
  let tierEmoji = ''

  if (isTop10) {
    tierColor = 'text-amber-500'; tierBg = 'from-amber-50 to-yellow-50'; tierBorder = 'border-amber-200'
    tierGlow = 'shadow-amber-200/50'; tierLabel = '메달권 진입!'; tierEmoji = '🥇'
  } else if (isTop30) {
    tierColor = 'text-blue-500'; tierBg = 'from-blue-50 to-indigo-50'; tierBorder = 'border-blue-200'
    tierGlow = 'shadow-blue-200/50'; tierLabel = '상위권 실력!'; tierEmoji = '🔥'
  } else if (isTop50) {
    tierColor = 'text-emerald-500'; tierBg = 'from-emerald-50 to-teal-50'; tierBorder = 'border-emerald-200'
    tierGlow = 'shadow-emerald-200/50'; tierLabel = '평균 이상!'; tierEmoji = '💪'
  } else {
    tierColor = 'text-violet-500'; tierBg = 'from-violet-50 to-purple-50'; tierBorder = 'border-violet-200'
    tierGlow = 'shadow-violet-200/50'; tierLabel = '성장 중!'; tierEmoji = '🚀'
  }

  const progressWidth = Math.max(5, 100 - percentile)

  return (
    <div className={`bg-gradient-to-br ${tierBg} rounded-[32px] p-6 md:p-8 border-2 ${tierBorder} shadow-xl ${tierGlow} animate-in fade-in zoom-in-95 duration-500`}>
      {/* Medal Animation for Top 10% */}
      {isTop10 && (
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-300/50 animate-bounce">
              <Medal className="w-10 h-10 text-white drop-shadow-md" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-black animate-pulse">
              ★
            </div>
          </div>
        </div>
      )}

      {/* Tier Badge */}
      <div className="text-center mb-6">
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm ${tierColor} font-black text-sm border ${tierBorder} shadow-sm`}>
          <span className="text-lg">{tierEmoji}</span> {tierLabel}
        </span>
      </div>

      {/* Rank Display */}
      <div className="text-center mb-6">
        <p className="text-sm font-bold text-slate-500 mb-1">{event} 전국 예상 순위</p>
        <div className="flex items-baseline justify-center gap-1">
          <span className={`text-6xl md:text-7xl font-black ${tierColor} drop-shadow-sm`}>{rank}</span>
          <span className="text-2xl font-bold text-slate-400">위</span>
        </div>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          전체 <span className="font-bold text-slate-700">{total}명</span> 중 상위 <span className={`font-black ${tierColor}`}>{percentile.toFixed(1)}%</span>
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
          <span>🥇 1위</span>
          <span>나의 위치</span>
          <span>{total}위</span>
        </div>
        <div className="h-5 bg-white/60 rounded-full overflow-hidden border border-slate-200 relative">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${
              isTop10 ? 'from-amber-400 to-yellow-400' :
              isTop30 ? 'from-blue-400 to-indigo-400' :
              isTop50 ? 'from-emerald-400 to-teal-400' :
              'from-violet-400 to-purple-400'
            }`}
            style={{ width: `${progressWidth}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-slate-800 shadow-md transition-all duration-1000"
            style={{ left: `calc(${progressWidth}% - 8px)` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 text-center border border-white">
          <p className="text-[10px] font-bold text-slate-400 mb-1">내 기록</p>
          <p className="font-mono font-black text-sm text-slate-800">{formatSecondsToRecord(inputSeconds)}</p>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 text-center border border-white">
          <p className="text-[10px] font-bold text-slate-400 mb-1">1위 기록</p>
          <p className="font-mono font-black text-sm text-amber-600">{formatSecondsToRecord(topRecord)}</p>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 text-center border border-white">
          <p className="text-[10px] font-bold text-slate-400 mb-1">1위와 차이</p>
          <p className="font-mono font-black text-sm text-rose-500">+{gap.toFixed(2)}초</p>
        </div>
      </div>

      {/* Encouragement */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/80 mb-4">
        <p className="text-sm font-bold text-slate-700 break-keep">
          {isTop10 && '🎉 전국 상위 10% 이내! 대회에서 메달을 노려볼 수 있는 뛰어난 실력입니다!'}
          {!isTop10 && isTop30 && '💯 전국 상위 30%! 조금만 더 노력하면 메달권에 진입할 수 있어요!'}
          {!isTop30 && isTop50 && '👏 전국 평균 이상의 실력! 꾸준한 훈련으로 더 높은 순위를 목표로 해보세요!'}
          {!isTop50 && '🌱 지금 이 순간에도 성장하고 있어요! 매일 조금씩 더 빨라지고 있답니다!'}
        </p>
      </div>

      <button onClick={onReset} className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 rounded-2xl font-bold text-slate-600 border border-slate-200 transition-colors shadow-sm">
        <RotateCcw className="w-4 h-4" /> 다시 측정하기
      </button>
    </div>
  )
}

// --- Main Page ---
export default function RankSimulatorPage() {
  const supabase = createClient()
  const [selectedEvent, setSelectedEvent] = useState('')
  const [selectedGender, setSelectedGender] = useState('')
  const [recordInput, setRecordInput] = useState('')
  const [simResult, setSimResult] = useState<SimResult | null>(null)
  const [inputError, setInputError] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)

  // Fetch nationwide data for selected event
  const { data: rankings, isPending: rankingsLoading } = useQuery({
    queryKey: ['rank_sim_rankings', selectedEvent, selectedGender],
    enabled: !!selectedEvent && !!selectedGender,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nationwide_rankings')
        .select('record')
        .eq('is_deleted', false)
        .eq('event', selectedEvent)
        .eq('gender', selectedGender)
      if (error) throw error
      return data as { record: string }[]
    }
  })

  const sortedSeconds = useMemo(() => {
    if (!rankings) return []
    return rankings
      .map(r => parseRecordToSeconds(r.record))
      .filter((s): s is number => s !== null && s > 0)
      .sort((a, b) => a - b)
  }, [rankings])

  const handleSimulate = () => {
    setInputError('')
    setSimResult(null)

    if (!selectedEvent) { setInputError('종목을 선택해 주세요.'); return }
    if (!selectedGender) { setInputError('성별을 선택해 주세요.'); return }
    if (!recordInput.trim()) { setInputError('기록을 입력해 주세요. (예: 00:30.50)'); return }

    const inputSec = parseRecordToSeconds(recordInput)
    if (inputSec === null || inputSec <= 0) {
      setInputError('올바른 기록 형식이 아닙니다. (예: 00:30.50 또는 30.50)')
      return
    }

    if (sortedSeconds.length === 0) {
      setInputError('해당 종목의 전국 기록 데이터가 없습니다.')
      return
    }

    setIsCalculating(true)

    // Simulate a brief delay for dramatic effect
    setTimeout(() => {
      // Find rank position (1-indexed)
      let rank = 1
      for (const sec of sortedSeconds) {
        if (inputSec > sec) rank++
        else break
      }

      const total = sortedSeconds.length + 1
      const percentile = (rank / total) * 100
      const topRecord = sortedSeconds[0]
      const avgRecord = sortedSeconds.reduce((a, b) => a + b, 0) / sortedSeconds.length
      const gap = Math.max(0, inputSec - topRecord)

      setSimResult({ rank, total, percentile, inputSeconds: inputSec, topRecord, avgRecord, gap })
      setIsCalculating(false)
    }, 800)
  }

  const handleReset = () => {
    setSimResult(null)
    setRecordInput('')
    setInputError('')
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader
        title="실시간 예상 순위 시뮬레이터 🎯"
        settingKey="rank_simulator_desc"
        defaultDescription="오늘 측정한 기록을 입력하면 전국 예상 순위를 바로 확인할 수 있어요!"
        icon={<Target className="w-8 h-8 text-primary" />}
      />

      {/* Input Card */}
      <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100">
        <h2 className="font-black text-lg text-slate-800 mb-5 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" /> 기록 입력
        </h2>

        <div className="space-y-4">
          {/* Gender Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">성별</label>
            <div className="flex gap-3">
              {GENDER_OPTIONS.map(g => (
                <button
                  key={g.value}
                  onClick={() => { setSelectedGender(g.value); setSimResult(null) }}
                  className={`flex-1 py-3 rounded-2xl font-bold text-sm border-2 transition-all ${
                    selectedGender === g.value
                      ? g.value === '남자'
                        ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm'
                        : 'bg-pink-50 border-pink-400 text-pink-700 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {g.value === '남자' ? '👦 ' : '👧 '}{g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Event Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">종목 선택</label>
            <select
              value={selectedEvent}
              onChange={e => { setSelectedEvent(e.target.value); setSimResult(null) }}
              className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all appearance-none"
            >
              <option value="">종목을 선택하세요</option>
              {EVENT_OPTIONS.map(event => (
                <option key={event} value={event}>{event}</option>
              ))}
            </select>
          </div>

          {/* Record Input */}
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-2">오늘 측정한 기록</label>
            <input
              type="text"
              value={recordInput}
              onChange={e => { setRecordInput(e.target.value); setInputError('') }}
              onKeyDown={e => { if (e.key === 'Enter') handleSimulate() }}
              placeholder="예: 00:30.50 또는 30.50"
              className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl font-mono font-bold text-lg text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all text-center"
            />
          </div>

          {/* Error Message */}
          {inputError && (
            <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-2xl text-sm font-bold border border-rose-200 animate-in fade-in zoom-in-95">
              ⚠️ {inputError}
            </div>
          )}

          {/* Data count hint */}
          {selectedEvent && selectedGender && !rankingsLoading && sortedSeconds.length > 0 && (
            <p className="text-xs text-slate-400 font-medium text-center">
              📊 {selectedGender} {selectedEvent} 전국 기록 <span className="font-bold text-slate-600">{sortedSeconds.length}건</span> 기준
            </p>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSimulate}
            disabled={isCalculating || rankingsLoading}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:from-slate-300 disabled:to-slate-400 text-white font-black text-lg rounded-2xl shadow-lg shadow-indigo-500/30 disabled:shadow-none transition-all hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isCalculating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> 분석 중...</>
            ) : rankingsLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> 데이터 로딩 중...</>
            ) : (
              <><TrendingUp className="w-5 h-5" /> 결과 보기</>
            )}
          </button>
        </div>
      </div>

      {/* Result Card */}
      {simResult && (
        <ResultCard result={simResult} event={`${selectedGender} ${selectedEvent}`} onReset={handleReset} />
      )}

      {/* How it works */}
      {!simResult && (
        <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100">
          <h3 className="font-black text-base text-slate-700 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> 이렇게 활용해 보세요!
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-indigo-50 rounded-2xl p-4 text-center border border-indigo-100">
              <div className="text-3xl mb-2">⏱️</div>
              <p className="text-sm font-bold text-indigo-700">오늘 기록 입력</p>
              <p className="text-xs text-indigo-500 mt-1">훈련 후 측정한 기록을 입력하세요</p>
            </div>
            <div className="bg-violet-50 rounded-2xl p-4 text-center border border-violet-100">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-sm font-bold text-violet-700">전국 순위 확인</p>
              <p className="text-xs text-violet-500 mt-1">전국 기록과 비교하여 예상 순위를 알려드려요</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 text-center border border-amber-100">
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-sm font-bold text-amber-700">목표 설정</p>
              <p className="text-xs text-amber-500 mt-1">상위권 진입을 위한 목표 기록을 설정하세요</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
