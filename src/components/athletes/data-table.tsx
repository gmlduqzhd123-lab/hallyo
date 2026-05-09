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
import { ChevronDown, ChevronUp, Trash2, LineChart, Search, Edit2 } from 'lucide-react'
import { softDeleteAthlete } from '@/app/actions/athletes'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export type Athlete = {
  id: string
  category?: string
  gender: 'M' | 'F'
  name: string
  hanja_name?: string
  is_registered?: boolean
  birth_date?: string
  attendance_start_date?: string
  attendance_end_date?: string
  join_date?: string
  grade: number
  class_number?: string
  student_number?: number
  homeroom_teacher?: string
  student_phone?: string
  parent_name?: string
  parent_phone?: string
  created_at: string
}

interface DataTableProps {
  data: Athlete[]
  onRowClick: (athlete: Athlete) => void
  onEdit: (athlete: Athlete) => void
  userRole?: string | null
}

export function DataTable({ data, onRowClick, onEdit, userRole }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'grade', desc: true }
  ])
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

  const allColumns: ColumnDef<Athlete>[] = [

    {
      accessorKey: 'gender',
      header: '성별',
      cell: ({ row }) => {
        const val = row.getValue('gender')
        return (
          <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold ${val === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
            {val === 'M' ? '남' : '여'}
          </span>
        )
      },
    },
    {
      accessorKey: 'grade',
      header: '학년',
      cell: ({ row }) => <span className="font-semibold text-slate-600">{row.getValue('grade') ? `${row.getValue('grade')}학년` : '-'}</span>,
    },
    {
      accessorKey: 'class_number',
      header: '반',
      cell: ({ row }) => <span className="text-slate-600 whitespace-nowrap">{row.getValue('class_number') ? `${row.getValue('class_number')}반` : '-'}</span>,
    },
    {
      accessorKey: 'student_number',
      header: '번호',
      cell: ({ row }) => <span className="text-slate-600 whitespace-nowrap">{row.getValue('student_number') ? `${row.getValue('student_number')}번` : '-'}</span>,
    },
    {
      accessorKey: 'name',
      header: '이름',
      cell: ({ row }) => <span className="font-bold text-accent-navy whitespace-nowrap text-sm sm:text-base">{row.getValue('name')}</span>,
    },
    {
      accessorKey: 'category',
      header: '종별',
      cell: ({ row }) => <span className="text-slate-600 font-medium whitespace-nowrap">{row.getValue('category') || '-'}</span>,
    },
    {
      id: 'personal_best',
      header: '최고 기록',
      cell: ({ row }) => {
        const athlete = row.original
        return (
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onRowClick(athlete)
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors whitespace-nowrap w-fit"
            title="개인 최고 기록 (PB) 보기"
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>기록 보기</span>
          </button>
        )
      }
    },
    {
      accessorKey: 'hanja_name',
      header: '한자 이름',
      cell: ({ row }) => <span className="text-slate-600 whitespace-nowrap">{row.getValue('hanja_name') || '-'}</span>,
    },
    {
      accessorKey: 'is_registered',
      header: '선수 등록 여부',
      cell: ({ row }) => {
        const val = row.getValue('is_registered')
        return <span className={`px-2 py-1 text-xs font-bold rounded-lg ${val ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{val ? 'O' : 'X'}</span>
      },
    },
    {
      accessorKey: 'birth_date',
      header: '생년월일',
      cell: ({ row }) => <span className="text-slate-600 whitespace-nowrap">{row.getValue('birth_date') || '-'}</span>,
    },

    {
      accessorKey: 'join_date',
      header: '입단 날짜',
      cell: ({ row }) => <span className="text-slate-600 whitespace-nowrap">{row.getValue('join_date') || '-'}</span>,
    },
    {
      accessorKey: 'homeroom_teacher',
      header: '담임교사',
      cell: ({ row }) => <span className="text-slate-600 whitespace-nowrap">{row.getValue('homeroom_teacher') || '-'}</span>,
    },
    {
      accessorKey: 'student_phone',
      header: '학생 연락처',
      cell: ({ row }) => <span className="text-slate-600 whitespace-nowrap">{row.getValue('student_phone') || '-'}</span>,
    },
    {
      accessorKey: 'parent_name',
      header: '학부모 성함',
      cell: ({ row }) => <span className="text-slate-600 whitespace-nowrap">{row.getValue('parent_name') || '-'}</span>,
    },
    {
      accessorKey: 'parent_phone',
      header: '학부모 연락처',
      cell: ({ row }) => <span className="text-slate-600 whitespace-nowrap">{row.getValue('parent_phone') || '-'}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const athlete = row.original
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {(['admin', 'developer'].includes(userRole as string)) && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(athlete); }}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                title="선수 정보 수정"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}

            {(['admin', 'developer'].includes(userRole as string)) && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`${athlete.name} 선수를 명단에서 삭제하시겠습니까?`)) {
                    deleteMutation.mutate(athlete.id)
                  }
                }}
                disabled={deleteMutation.isPending}
                className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors disabled:opacity-50"
                title="삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )
      }
    }
  ]

  const columns = allColumns.filter(col => {
    // Hide contact details if not admin, developer, or coach
    if (!['admin', 'developer', 'coach'].includes(userRole as string) && ['student_phone', 'parent_name', 'parent_phone'].includes((col as any).accessorKey)) {
      return false
    }
    return true
  })

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
          <table className="w-full text-[13px] sm:text-sm text-left">
            <thead className="text-[11px] sm:text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th 
                      key={header.id} 
                      className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1 font-bold">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />,
                          desc: <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />,
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
                    className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors group ${['admin', 'developer'].includes(userRole as string) ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (['admin', 'developer'].includes(userRole as string)) {
                        onEdit(row.original)
                      }
                    }}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-2 sm:px-4 md:px-6 py-3 sm:py-4 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-2 sm:px-4 md:px-6 py-8 text-center text-slate-500 font-medium">
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
