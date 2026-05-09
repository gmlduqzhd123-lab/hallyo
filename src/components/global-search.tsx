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
      
      const { data, error } = await supabase
        .from('nationwide_rankings')
        .select('id, athlete_name, team_name, competition_name, event')
        .or(`athlete_name.ilike.%${debouncedQuery}%,team_name.ilike.%${debouncedQuery}%,competition_name.ilike.%${debouncedQuery}%`)
        .limit(10)

      if (error) throw error
      return data || []
    },
    enabled: debouncedQuery.trim().length > 0
  })

  const handleResultClick = (result: any) => {
    setIsExpanded(false)
    setQuery('')
    
    // Redirecting to rankings/records page with the athlete name as filter.
    // If you have a dedicated ranking page, adjust this URL. 
    // Example: /dashboard/records?search={name}
    router.push(`/dashboard/records?search=${encodeURIComponent(result.athlete_name)}`)
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
          placeholder="선수, 소속팀, 대회명 검색..."
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
                    <div className="bg-indigo-50 p-2 rounded-full text-indigo-500 flex-shrink-0">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        {result.athlete_name} <span className="text-slate-400 font-normal ml-1">({result.event})</span>
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {result.team_name} | {result.competition_name}
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
