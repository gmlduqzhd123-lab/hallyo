'use client'

import React, { useMemo } from 'react'
import { MapPin, Trophy } from 'lucide-react'

type Competition = {
  id: string
  title: string
  date: string
  location: string
}

type Props = {
  competitions: Competition[]
}

const LOCATION_COORDS: Record<string, { x: number, y: number, name: string }> = {
  '서울': { x: 30, y: 22, name: '서울' },
  '인천': { x: 23, y: 23, name: '인천' },
  '김천': { x: 55, y: 52, name: '김천' },
  '대전': { x: 45, y: 48, name: '대전' },
  '광주': { x: 32, y: 78, name: '광주' },
  '대구': { x: 68, y: 62, name: '대구' },
  '울산': { x: 85, y: 68, name: '울산' },
  '부산': { x: 80, y: 78, name: '부산' },
  '제주': { x: 28, y: 95, name: '제주' },
  '창원': { x: 65, y: 78, name: '창원' },
  '전주': { x: 40, y: 65, name: '전주' },
  '목포': { x: 22, y: 88, name: '목포' },
  '광양': { x: 48, y: 85, name: '광양' },
  '수원': { x: 33, y: 28, name: '수원' },
  '고양': { x: 28, y: 18, name: '고양' },
  '청주': { x: 50, y: 40, name: '청주' },
  '천안': { x: 40, y: 38, name: '천안' },
  '강릉': { x: 75, y: 15, name: '강릉' },
  '춘천': { x: 55, y: 12, name: '춘천' },
  '문수': { x: 85, y: 68, name: '울산' },
}

export function CompetitionMap({ competitions }: Props) {
  const [selectedLocation, setSelectedLocation] = React.useState<string | null>(null)

  const aggregatedData = useMemo(() => {
    const map = new Map<string, { x: number, y: number, count: number, titles: string[], originalNames: string[] }>()

    competitions.forEach(comp => {
      if (!comp.location) return

      let matchedKey = '기타'
      for (const key in LOCATION_COORDS) {
        if (comp.location.includes(key)) {
          matchedKey = key
          break
        }
      }

      const coords = LOCATION_COORDS[matchedKey] || { x: 50, y: 50, name: '기타' }
      
      if (!map.has(matchedKey)) {
        map.set(matchedKey, { 
          x: coords.x, 
          y: coords.y, 
          count: 0, 
          titles: [],
          originalNames: [] 
        })
      }
      
      const data = map.get(matchedKey)!
      data.count += 1
      data.titles.push(comp.title)
      if (!data.originalNames.includes(comp.location)) {
        data.originalNames.push(comp.location)
      }
    })

    return Array.from(map.entries()).map(([key, value]) => ({
      key,
      ...value
    }))
  }, [competitions])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white p-4 sm:p-8 rounded-3xl border border-slate-100 shadow-sm min-h-[600px]">
      {/* Map Section */}
      <div className="relative aspect-[3/4] bg-sky-50/50 rounded-2xl border border-sky-100 overflow-hidden group p-4 sm:p-8">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg viewBox="0 0 100 130" className="w-full h-full opacity-30 fill-blue-500/10 stroke-blue-600/30 stroke-[0.8] drop-shadow-sm">
            <path d="M25,10 L45,10 L55,15 L65,15 L75,20 L80,30 L75,45 L85,60 L80,75 L85,85 L75,95 L60,95 L45,100 L30,110 L20,105 L10,100 L5,90 L15,75 L10,65 L15,50 L10,40 L15,25 L25,15 Z" />
            <circle cx="28" cy="115" r="5" /> {/* Jeju */}
          </svg>
        </div>

        {/* Labels for regions (visual decoration) */}
        <div className="absolute top-[20%] left-[25%] text-[10px] font-bold text-blue-200 pointer-events-none uppercase">Gyeonggi</div>
        <div className="absolute top-[50%] left-[55%] text-[10px] font-bold text-blue-200 pointer-events-none uppercase">Gyeongsang</div>
        <div className="absolute top-[60%] left-[25%] text-[10px] font-bold text-blue-200 pointer-events-none uppercase">Jeolla</div>

        {/* Map Markers */}
        {aggregatedData.map((loc) => (
          <button
            key={loc.key}
            onClick={() => setSelectedLocation(loc.key === selectedLocation ? null : loc.key)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 hover:scale-125 z-10 ${selectedLocation === loc.key ? 'scale-150 z-20' : ''}`}
            style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
          >
            <div className="relative">
              <MapPin className={`w-8 h-8 ${selectedLocation === loc.key ? 'text-rose-500 fill-rose-500' : 'text-blue-500 fill-blue-500'} transition-colors`} />
              <div className="absolute -top-2 -right-2 bg-white border-2 border-current rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black shadow-sm">
                {loc.count}
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-md border border-slate-200 text-[10px] font-bold shadow-sm whitespace-nowrap">
                {LOCATION_COORDS[loc.key]?.name || loc.key}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Info Section */}
      <div className="flex flex-col">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-accent-navy flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            개최지별 대회 기록
          </h2>
          <p className="text-slate-500 text-sm mt-1">지도의 마커를 클릭하여 해당 지역의 개최 이력을 확인하세요.</p>
        </div>

        {selectedLocation ? (
          <div className="flex-1 overflow-y-auto space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h3 className="font-bold text-lg text-slate-800 mb-1">{LOCATION_COORDS[selectedLocation]?.name || selectedLocation} 지역</h3>
              <p className="text-slate-500 text-sm">총 {aggregatedData.find(d => d.key === selectedLocation)?.count}회의 대회가 개최되었습니다.</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {aggregatedData.find(d => d.key === selectedLocation)?.originalNames.map(name => (
                  <span key={name} className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-400">
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {aggregatedData.find(d => d.key === selectedLocation)?.titles.map((title, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
                  <p className="font-bold text-slate-700 leading-tight">{title}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <MapPin className="w-12 h-12 text-slate-300 mb-4 animate-bounce" />
            <p className="text-slate-400 font-medium break-keep">지도의 파란색 핀을 선택하면<br/>상세 개최 내역을 볼 수 있습니다.</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
          <div className="bg-blue-50 p-4 rounded-2xl">
            <div className="text-2xl font-black text-blue-600">{aggregatedData.length}</div>
            <div className="text-xs font-bold text-blue-400 uppercase">개최 지역 수</div>
          </div>
          <div className="bg-rose-50 p-4 rounded-2xl">
            <div className="text-2xl font-black text-rose-600">{competitions.length}</div>
            <div className="text-xs font-bold text-rose-400 uppercase">전체 대회 수</div>
          </div>
        </div>
      </div>
    </div>
  )
}
