// 기록 한꺼번에 입력·엑셀 업로드에서 쓰는 변환 도우미

// '자유형 50m', '자유형50M' → '자유형50M' (DB 에 저장하는 종목 이름 형식)
export function normalizeEventName(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, '').replace(/m$/i, 'M')
}

// 기록 칸 → 초. '25.43', '1:02.09', 25.43(숫자) 를 받습니다.
// 엑셀이 '1:02.09' 를 시간 형식(하루의 비율, 1보다 작은 숫자)으로 바꿔 둔 경우도 초로 되돌립니다.
// 알아볼 수 없으면 null.
export function parseRecordTime(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null
    const seconds = value < 1 ? value * 86400 : value
    return Math.round(seconds * 100) / 100
  }
  const text = String(value).trim()
  if (!text) return null
  let seconds: number
  if (text.includes(':')) {
    const [m, s] = text.split(':')
    seconds = Number(m) * 60 + Number(s)
  } else {
    seconds = Number(text)
  }
  if (!Number.isFinite(seconds) || seconds <= 0) return null
  return Math.round(seconds * 100) / 100
}

// 날짜 칸 → 'YYYY-MM-DD'. 엑셀 날짜 숫자, '2026.5.3', '2026-05-03' 를 받습니다. 모르면 ''.
export function parseDateCell(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (typeof value === 'number') {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000))
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
  }
  const nums = String(value).match(/\d+/g)
  if (!nums || nums.length < 3 || nums[0].length !== 4) return ''
  const [y, m, d] = nums
  if (Number(m) < 1 || Number(m) > 12 || Number(d) < 1 || Number(d) > 31) return ''
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}
