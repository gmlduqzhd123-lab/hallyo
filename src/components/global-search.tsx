'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, User, Trophy } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/use-debounce'

export function GlobalSearch() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 400)
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
        setQuery('') // optional: clear query when closing
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const { data: results, isFetching } = useQuery({
    queryKey: ['globalSearch', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return []
      
      const searchStr = `%${debouncedQuery}%`;

      // 1. Local Team Athletes
      const localPromise = supabase
        .from('athletes')
        .select('id, name, grade')
        .eq('is_deleted', false)
        .ilike('name', searchStr)
        .limit(5);

      // 2. Nationwide Athletes
      const nationPromise = supabase
        .from('nationwide_rankings')
        .select('id, athlete_name, school, event, year')
        .eq('is_deleted', false)
        .or(`athlete_name.ilike.${searchStr},school.ilike.${searchStr},event.ilike.${searchStr}`)
        .limit(5);

      const [localRes, nationRes] = await Promise.all([localPromise, nationPromise]);
      
      const combined: any[] = [];

      // Combine local team first
      if (localRes.data) {
        localRes.data.forEach((item: any) => {
          combined.push({
            id: `local_${item.id}`,
            type: 'LOCAL',
            name: item.name,
            subtitle: `여수한려초 수영부 | ${item.grade}학년`,
            route: `/dashboard/record-analysis?athleteId=${item.id}`
          });
        });
      }

      // Add nationwide results
      if (nationRes.data) {
        // Filter out duplicates if the local athlete is also in nationwide
        nationRes.data.forEach((item: any) => {
          combined.push({
            id: `nation_${item.id}`,
            type: 'NATIONWIDE',
            name: item.athlete_name,
            subtitle: `${item.school} | ${item.event} (${item.year}년)`,
            route: `/dashboard/records/nationwide` 
          });
        });
      }

      return combined;
    },
    enabled: debouncedQuery.trim().length > 0
  })

  const handleResultClick = (result: any) => {
    setIsExpanded(false)
    setQuery('')
    router.push(result.route)
  }

  const handleExpand = () => {
    setIsExpanded(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  return (
    <div ref={wrapperRef} className="relative z-50 flex items-center">
      {/* Search Input Container */}
      <div 
        className={`flex items-center rounded-full transition-all duration-300 overflow-hidden ${
          isExpanded 
            ? 'w-full md:w-80 px-4 py-2 ring-2 ring-primary/20 bg-white border border-primary/30 shadow-sm' 
            : 'w-10 h-10 justify-center cursor-pointer bg-slate-100 hover:bg-slate-200 md:w-64 md:px-4 md:py-2 md:justify-start md:bg-slate-100'
        }`}
        onClick={() => !isExpanded && handleExpand()}
      >
        <Search className="w-5 h-5 text-slate-500 flex-shrink-0" />
        <input 
          ref={inputRef}
          type="text"
          placeholder="선수, 학교, 종목명 검색..."
          className={`bg-transparent outline-none text-sm ml-2 w-full transition-opacity duration-300 placeholder:text-slate-400 ${
            isExpanded ? 'opacity-100' : 'opacity-0 md:opacity-100'
          }`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsExpanded(true)}
        />
      </div>

      {/* Dropdown Results */}
      {isExpanded && debouncedQuery.trim().length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 md:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {isFetching ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
              <p className="text-sm font-medium">검색 중...</p>
            </div>
          ) : results && results.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto py-2">
              {results.map((result: any, idx: number) => (
                <li key={idx}>
                  <button 
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0"
                  >
                    <div className={`p-2 rounded-full flex-shrink-0 ${result.type === 'LOCAL' ? 'bg-blue-50 text-blue-500' : 'bg-amber-50 text-amber-500'}`}>
                      {result.type === 'LOCAL' ? <User className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        {result.name}
                        {result.type === 'LOCAL' && <span className="ml-2 text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md">우리팀</span>}
                        {result.type === 'NATIONWIDE' && <span className="ml-2 text-[10px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md">전국</span>}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {result.subtitle}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-8 text-center text-slate-500 text-sm font-medium">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
