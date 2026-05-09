'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatTimeSeconds } from '@/utils/time'
import { format } from 'date-fns'

interface EventRecordChartProps {
  records: any[]
}

export default function EventRecordChart({ records }: EventRecordChartProps) {
  // Sort records by date ascending for the chart so time moves left to right
  const sortedRecords = [...records].sort((a, b) => {
    const diff = new Date(a.record_date).getTime() - new Date(b.record_date).getTime()
    if (diff !== 0) return diff
    // same date, '예선' comes before '결승'
    if (a.match_type === '결승' && b.match_type !== '결승') return 1
    if (a.match_type !== '결승' && b.match_type === '결승') return -1
    return 0
  })

  const data = sortedRecords.map(r => ({
    date: format(new Date(r.record_date), 'yy.MM.dd'),
    time: r.record_time,
    title: r.schedules?.title || '기타 기록',
    fullDate: format(new Date(r.record_date), 'yyyy.MM.dd'),
    match_type: r.match_type
  }))

  return (
    <div className="h-[250px] w-full mt-4 mb-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#64748b' }} 
            axisLine={false} 
            tickLine={false} 
            dy={10}
          />
          <YAxis 
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
            tickFormatter={(val) => formatTimeSeconds(val)}
            tick={{ fontSize: 12, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={70}
            reversed={true}
          />
          <Tooltip 
            formatter={(value: any) => [
              <span key="time" className="font-black text-indigo-600">{formatTimeSeconds(value)}</span>, 
              <span key="label" className="text-slate-500">기록</span>
            ]}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                const item = payload[0].payload;
                return (
                  <div className="mb-2 border-b border-slate-100 pb-2">
                    <div className="font-bold text-slate-800 text-sm">
                      {item.title}
                      {item.match_type && (
                        <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          {item.match_type}
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">{item.fullDate}</div>
                  </div>
                )
              }
              return label
            }}
            contentStyle={{ 
              borderRadius: '16px', 
              border: '1px solid #f1f5f9', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              padding: '12px 16px',
              backgroundColor: 'white'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="time" 
            stroke="#4f46e5" 
            strokeWidth={3}
            dot={{ r: 5, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7, fill: '#4f46e5', strokeWidth: 0, stroke: '#c7d2fe', strokeOpacity: 0.5 }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
