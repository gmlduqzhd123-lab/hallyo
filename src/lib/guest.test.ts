import { describe, expect, it } from 'vitest'
import { isGuestPath } from './guest'

describe('isGuestPath', () => {
  it('공개 메뉴와 그 하위 주소', () => {
    expect(isGuestPath('/dashboard/news-articles')).toBe(true)
    expect(isGuestPath('/dashboard/records/nationwide')).toBe(true)
    expect(isGuestPath('/dashboard/records')).toBe(true)
    expect(isGuestPath('/dashboard/records/local')).toBe(true)
    expect(isGuestPath('/dashboard/records/abc')).toBe(true)
    expect(isGuestPath('/dashboard/record-analysis')).toBe(true)
    expect(isGuestPath('/dashboard/rival-comparison')).toBe(true)
    expect(isGuestPath('/storage/photos/a.jpg')).toBe(true)
  })
  it('대회 일정은 목록만, 상세는 회원 전용', () => {
    expect(isGuestPath('/dashboard/competitions')).toBe(true)
    expect(isGuestPath('/dashboard/competitions/123')).toBe(false)
  })
  it('개인정보가 있는 메뉴는 회원 전용', () => {
    for (const p of ['/dashboard', '/dashboard/athletes', '/dashboard/photos', '/dashboard/training', '/dashboard/counseling', '/dashboard/mypage', '/dashboard/history-fake']) {
      expect(isGuestPath(p)).toBe(false)
    }
  })
})
