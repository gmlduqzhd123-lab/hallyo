import { describe, expect, it } from 'vitest'
import { photoPath, photoSrc } from './storage'

const STORED = 'https://qyluqlzrraxecliubjmv.supabase.co/storage/v1/object/public/photos/abc_123.jpg'

describe('photoSrc', () => {
  it('저장된 공개 주소를 로그인 확인 경로로 바꾼다', () => {
    expect(photoSrc(STORED)).toBe('/storage/photos/abc_123.jpg')
  })
  it('다른 곳의 주소는 그대로 둔다', () => {
    expect(photoSrc('https://example.com/a.jpg')).toBe('https://example.com/a.jpg')
  })
  it('빈 값은 빈 문자열', () => {
    expect(photoSrc(null)).toBe('')
    expect(photoSrc(undefined)).toBe('')
  })
})

describe('photoPath', () => {
  it('버킷 안의 파일 경로만 꺼낸다', () => {
    expect(photoPath(STORED)).toBe('abc_123.jpg')
  })
  it('인코딩된 경로를 풀어 준다', () => {
    expect(photoPath(STORED.replace('abc_123.jpg', '%ED%95%9C.jpg'))).toBe('한.jpg')
  })
  it('다른 곳의 주소나 빈 값은 null', () => {
    expect(photoPath('https://example.com/a.jpg')).toBeNull()
    expect(photoPath(null)).toBeNull()
  })
})
