// 비회원도 둘러볼 수 있는 화면 (선수 개인정보가 없는 메뉴만)
// 실제로 읽을 수 있는 자료는 DB 권한 규칙이 정합니다 (supabase/manual/2026-10-13_guest_browsing.sql)
export const GUEST_HOME = '/dashboard/explore'
const GUEST_PATHS = [
  GUEST_HOME,
  '/dashboard/history',
  '/dashboard/news-articles',
  '/dashboard/hall-of-fame',
  '/dashboard/developers',
  '/dashboard/videos',
  '/dashboard/records',
  '/dashboard/record-analysis',
  '/dashboard/rival-comparison',
  '/dashboard/rank-simulator',
  '/dashboard/notices',
  '/storage/photos',
]
// 하위 주소는 막고 이 주소만 (대회 상세에는 참가 선수가 나옴)
const GUEST_EXACT_PATHS = ['/dashboard/competitions']

export function isGuestPath(pathname: string) {
  return GUEST_EXACT_PATHS.includes(pathname) || GUEST_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}
