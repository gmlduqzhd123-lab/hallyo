'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Users, Calendar, CalendarDays, BookOpen, Video, Bell, Settings, Menu, X, LogOut, Waves, LayoutDashboard, Image as ImageIcon, Film } from 'lucide-react'
import { logout } from '../actions/auth'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const pathname = usePathname()

  const navItems = [
    { name: '대시보드', icon: LayoutDashboard, href: '/dashboard' },
    { name: '선수 명단', icon: Users, href: '/dashboard/athletes' },
    { name: '대회 일정', icon: Calendar, href: '/dashboard/competitions' },
    { name: '훈련 일정', icon: CalendarDays, href: '/dashboard/training' },
    { name: '상담 일지', icon: BookOpen, href: '/dashboard/counseling' },
    { name: '수영 관련 영상', icon: Video, href: '/dashboard/videos' },
    { name: '공지사항', icon: Bell, href: '/dashboard/notices' },
    { name: '활동 사진', icon: ImageIcon, href: '/dashboard/photos' },
    { name: '대회 영상', icon: Film, href: '/dashboard/competition-videos' },
    { name: '환경 설정', icon: Settings, href: '/dashboard/settings' },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-100 shadow-[4px_0_24px_rgb(0,71,171,0.03)] z-10">
        <Link href="/" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image src="/logo.jpg" alt="여수한려초 수영부 로고" width={48} height={48} className="w-12 h-12 object-contain rounded-xl" />
          <div>
            <h2 className="font-bold text-accent-navy leading-tight text-sm">여수한려초 수영부</h2>
            <p className="text-xs text-secondary-hover font-bold">HALLYOSWIM</p>
          </div>
        </Link>
        
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
            <Link 
              href={item.href}
              prefetch={true}
              key={idx}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-semibold ${isActive ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:bg-secondary/15 hover:text-primary'}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )})}
        </nav>

        <div className="p-4 border-t border-slate-50">
          <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-all font-semibold">
            <LogOut className="w-5 h-5" />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between sticky top-0 z-20">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/logo.jpg" alt="여수한려초 수영부 로고" width={32} height={32} className="w-8 h-8 object-contain rounded-lg" />
            <h1 className="font-bold text-accent-navy text-sm">HALLYOSWIM</h1>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-slate-50 rounded-xl text-slate-600"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-[73px] left-0 right-0 bg-white shadow-xl z-20 p-4 border-b border-slate-100 flex flex-col gap-2">
            {navItems.map((item, idx) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
              <Link 
                href={item.href}
                key={idx}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold ${isActive ? 'bg-primary text-white' : 'text-slate-600 hover:bg-secondary/10'}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            )})}
            <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-500 hover:bg-rose-50 font-semibold mt-2 border-t border-slate-50">
              <LogOut className="w-5 h-5" />
              <span>로그아웃</span>
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
