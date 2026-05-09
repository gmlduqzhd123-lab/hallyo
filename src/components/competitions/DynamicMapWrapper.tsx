'use client'

import dynamic from 'next/dynamic'

const DynamicMap = dynamic(() => import('./DynamicMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] md:h-[800px] rounded-3xl bg-slate-100 flex items-center justify-center border border-slate-200">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin" />
        <p className="text-slate-500 font-bold">지도 컴포넌트를 불러오는 중...</p>
      </div>
    </div>
  )
})

interface Competition {
  id: string
  title: string
  date: string
  end_date?: string
  location?: string
}

interface WrapperProps {
  competitions: Competition[]
}

export function DynamicMapWrapper({ competitions }: WrapperProps) {
  return <DynamicMap competitions={competitions} />
}
