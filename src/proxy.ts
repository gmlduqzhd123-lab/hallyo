import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { GUEST_HOME, isGuestPath } from '@/lib/guest'

// 승인 확인 결과를 잠깐 기억하는 쿠키 (값: 사용자 id)
// 페이지를 옮길 때마다 DB 를 조회하지 않기 위한 것이고, 화면 이동에만 쓰입니다.
// 자료 읽기·쓰기는 DB 권한 규칙(승인된 사용자만)이 따로 막기 때문에 쿠키를 꾸며도 자료는 볼 수 없습니다.
const APPROVED_COOKIE = 'hallyo-approved'
const APPROVED_MAX_AGE = 60 * 10


export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 로그인 토큰을 서명으로 확인합니다 (Auth 서버를 매번 부르지 않음)
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')

  if (!userId && !isAuthRoute) {
    const url = request.nextUrl.clone()
    const pathname = request.nextUrl.pathname
    if (isGuestPath(pathname)) return supabaseResponse
    // 비회원이 대시보드 첫 화면으로 오면 둘러보기 첫 화면으로, 그 밖의 회원 전용 화면은 로그인으로
    url.pathname = pathname === '/dashboard' ? GUEST_HOME : '/login'
    return NextResponse.redirect(url)
  }

  if (userId) {
    let isApproved = request.cookies.get(APPROVED_COOKIE)?.value === userId
    if (!isApproved) {
      const { data: profile } = await supabase
        .from('users')
        .select('status')
        .eq('id', userId)
        .single()
      isApproved = profile?.status === 'approved'
      if (isApproved) {
        supabaseResponse.cookies.set(APPROVED_COOKIE, userId, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: APPROVED_MAX_AGE,
        })
      }
    }

    if (!isApproved && request.nextUrl.pathname !== '/pending' && !isAuthRoute) {
      // Pending user
      const url = request.nextUrl.clone()
      url.pathname = '/pending'
      return NextResponse.redirect(url)
    }

    if (isApproved && (isAuthRoute || request.nextUrl.pathname === '/pending')) {
      // Approved user accessing auth or pending route, redirect to dashboard
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public/ 의 정적 파일 (이미지, 글꼴, 스크립트, 앱 manifest)
     *   → 로그인 전에도 로그인 화면의 글꼴·앱 설치·QR 버튼이 동작하도록 제외
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|ttf|otf|woff|woff2|js|json|webmanifest)$).*)',
  ],
}
