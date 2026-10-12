// Supabase Storage 'photos' 버킷은 비공개입니다.
// DB 에는 예전 공개 주소(…/storage/v1/object/public/photos/<경로>)가 그대로 저장돼 있고,
// 화면에 보여 줄 때만 로그인 확인을 거치는 앱 경로(/storage/photos/<경로>)로 바꿉니다.
// (src/app/storage/photos/[...path]/route.ts 가 승인된 사용자에게만 파일을 전달)
const PUBLIC_PHOTOS_PATH = '/storage/v1/object/public/photos/'

export function photoSrc(url: string | null | undefined): string {
  if (!url) return ''
  const i = url.indexOf(PUBLIC_PHOTOS_PATH)
  return i === -1 ? url : `/storage/photos/${url.slice(i + PUBLIC_PHOTOS_PATH.length)}`
}

// 저장된 주소에서 'photos' 버킷 안의 파일 경로만 꺼냅니다 (다른 곳의 주소면 null)
export function photoPath(url: string | null | undefined): string | null {
  if (!url) return null
  const i = url.indexOf(PUBLIC_PHOTOS_PATH)
  return i === -1 ? null : decodeURIComponent(url.slice(i + PUBLIC_PHOTOS_PATH.length))
}
