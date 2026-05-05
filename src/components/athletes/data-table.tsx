'use client'

import { useState } from 'react'
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender, 
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnDef
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, Trash2, LineChart, Search } from 'lucide-react'
import { softDeleteAthlete } from '@/app/actions/athletes'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export type Athlete = {
  id: string
  name: string
  gender: 'M' | 'F'
  grade: number
  class_number?: string
  homeroom_teacher?: string
  student_phone?: string
  parent_name?: string
  parent_phone?: string
  created_at: string
}

interface DataTableProps {
  data: Athlete[]
  onRowClick: (athlete: Athlete) => void
}

export function DataTable({ data, onRowClick }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await softDeleteAthlete(id)
      if (res?.error) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      toast.success('선수가 명단에서 삭제되었습니다.', {
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

  const columns: ColumnDef<Athlete>[] = [
    {
      accessorKey: 'name',
      header: '이름',
      cell: ({ row }) => <span className="font-bold text-accent-navy">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'gender',
      header: '성별',
      cell: ({ row }) => {
        const val = row.getValue('gender')
        return (
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${val === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
            {val === 'M' ? '남 (Boy)' : '여 (Girl)'}
          </span>
        )
      },
    },
    {
      accessorKey: 'grade',
      header: '학년',
      cell: ({ row }) => <span className="font-semibold text-slate-600">{row.getValue('grade')}학년</span>,
    },
    {
      accessorKey: 'class_number',
      header: '학급',
      cell: ({ row }) => <span className="text-slate-600">{row.getValue('class_number') || '-'}</span>,
    },
    {
      accessorKey: 'homeroom_teacher',
      header: '담임교사',
      cell: ({ row }) => <span className="text-slate-600">{row.getValue('homeroom_teacher') || '-'}</span>,
    },
    {
      accessorKey: 'student_phone',
      header: '학생 연락처',
      cell: ({ row }) => <span className="text-slate-600">{row.getValue('student_phone') || '-'}</span>,
    },
    {
      accessorKey: 'parent_name',
      header: '학부모 성함',
      cell: ({ row }) => <span className="text-slate-600">{row.getValue('parent_name') || '-'}</span>,
    },
    {
      accessorKey: 'parent_phone',
      header: '학부모 연락처',
      cell: ({ row }) => <span className="text-slate-600">{row.getValue('parent_phone') || '-'}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const athlete = row.original
        return (
          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => onRowClick(athlete)}
              className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
              title="개인 최고 기록 (PB) 보기"
            >
              <LineChart className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                if (confirm(`${athlete.name} 선수를 명단에서 삭제하시겠습니까?`)) {
                  deleteMutation.mutate(athlete.id)
                }
              }}
              disabled={deleteMutation.isPending}
              className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors disabled:opacity-50"
              title="삭제"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )
      }
    }
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  })

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative w-full max-w-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-sm"
          placeholder="이름으로 선수 검색..."
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th 
                      key={header.id} 
                      className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1 font-bold">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUp className="w-4 h-4 text-primary" />,
                          desc: <ChevronDown className="w-4 h-4 text-primary" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <tr 
                    key={row.id} 
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => onRowClick(row.original)}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500 font-medium">
                    등록된 선수가 없거나 검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
