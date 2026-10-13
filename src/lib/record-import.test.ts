import { describe, expect, it } from 'vitest'
import { normalizeEventName, parseDateCell, parseRecordTime } from './record-import'

describe('normalizeEventName', () => {
  it('공백을 빼고 m 을 M 으로', () => {
    expect(normalizeEventName('자유형 50m')).toBe('자유형50M')
    expect(normalizeEventName('평영100M')).toBe('평영100M')
  })
})

describe('parseRecordTime', () => {
  it('초와 분:초 글자', () => {
    expect(parseRecordTime('25.43')).toBe(25.43)
    expect(parseRecordTime('1:02.09')).toBe(62.09)
  })
  it('숫자 칸', () => {
    expect(parseRecordTime(31.2)).toBe(31.2)
  })
  it('엑셀 시간 형식(하루의 비율)', () => {
    expect(parseRecordTime(62.09 / 86400)).toBe(62.09)
  })
  it('알아볼 수 없으면 null', () => {
    expect(parseRecordTime('')).toBeNull()
    expect(parseRecordTime('abc')).toBeNull()
    expect(parseRecordTime(0)).toBeNull()
  })
})

describe('parseDateCell', () => {
  it('여러 날짜 형식', () => {
    expect(parseDateCell('2026.5.3')).toBe('2026-05-03')
    expect(parseDateCell('2026-05-03')).toBe('2026-05-03')
    expect(parseDateCell(46145)).toBe('2026-05-03')
  })
  it('모르면 빈 값', () => {
    expect(parseDateCell('5월 3일')).toBe('')
  })
})
