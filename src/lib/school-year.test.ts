import { describe, expect, it } from 'vitest'
import { promotionTargetYear } from './school-year'

describe('promotionTargetYear', () => {
  it('2~3월에 누르면 그해 학년도', () => {
    expect(promotionTargetYear(new Date(2027, 1, 20))).toBe(2027)
    expect(promotionTargetYear(new Date(2027, 2, 2))).toBe(2027)
  })
  it('하반기에 미리 누르면 다음 해 학년도', () => {
    expect(promotionTargetYear(new Date(2026, 9, 13))).toBe(2027)
    expect(promotionTargetYear(new Date(2026, 11, 31))).toBe(2027)
  })
})
