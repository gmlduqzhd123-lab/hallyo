import Link from 'next/link'
import Image from 'next/image'
import { Timer, Activity, Swords, Target, Calendar, Video, History, Newspaper, Trophy, Bell, Code2, Lock } from 'lucide-react'

// 비회원 둘러보기 첫 화면. 공개 메뉴 목록은 src/lib/guest.ts 와 같게 유지합니다.
const PUBLIC_MENUS = [
  { name: '선수 기록', desc: '우리 선수 기록과 전국 대회 순위', icon: Timer, href: '/dashboard/records' },
  { name: '기록 분석', desc: '전국 기록과 비교한 선수별 분석', icon: Activity, href: '/dashboard/record-analysis' },
  { name: '라이벌 비교', desc: '같은 학년 전국 선수와 기록 비교', icon: Swords, href: '/dashboard/rival-comparison' },
  { name: '순위 시뮬레이터', desc: '내 기록이면 전국 몇 위일까?', icon: Target, href: '/dashboard/rank-simulator' },
  { name: '대회 일정', desc: '참가하는 대회 이름·날짜·장소', icon: Calendar, href: '/dashboard/competitions' },
  { name: '수영 관련 영상', desc: '영법별 훈련 영상 모음', icon: Video, href: '/dashboard/videos' },
  { name: '수영부 연혁', desc: '한려초 수영부가 걸어온 길', icon: History, href: '/dashboard/history' },
  { name: '보도 기사', desc: '언론에 소개된 수영부 소식', icon: Newspaper, href: '/dashboard/news-articles' },
  { name: '명예의 전당', desc: '빛나는 수상 기록', icon: Trophy, href: '/dashboard/hall-of-fame' },
  { name: '공지사항', desc: '전체 공개 공지', icon: Bell, href: '/dashboard/notices' },
  { name: '개발 일지', desc: '이 앱을 만든 사람들', icon: Code2, href: '/dashboard/developers' },
]

export default function ExplorePage() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-primary to-blue-500 text-white rounded-3xl p-6 md:p-8 shadow-lg flex items-center gap-5">
        <Image src="/logo.png" alt="" width={72} height={72} className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl bg-white/90 p-1.5 shrink-0" />
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-black break-keep">여수한려초등학교 수영부</h1>
          <p className="text-blue-50 font-medium mt-1 break-keep">수영부 소식과 선수 기록을 둘러보세요. 회원이 되면 활동 사진과 대회 영상도 볼 수 있어요.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PUBLIC_MENUS.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-4"
          >
            <div className="p-3 rounded-xl bg-secondary/15 text-primary shrink-0">
              <m.icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-accent-navy">{m.name}</p>
              <p className="text-sm text-slate-500 font-medium break-keep">{m.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-start gap-3">
        <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-sm text-slate-500 font-medium break-keep">
          선수 명단(생년월일·연락처 등), 활동 사진, 대회 영상, 훈련 일정, 대회 참가 선수, 지도자 코멘트는 선수 개인정보 보호를 위해 승인된 회원만 볼 수 있습니다.
        </p>
      </div>
    </div>
  )
}
