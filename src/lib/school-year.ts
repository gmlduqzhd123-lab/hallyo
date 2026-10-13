// 학년도: 3월에 시작합니다. 진급은 보통 2~3월에 하므로,
// 1~6월에 누르면 그해 학년도로, 7~12월에 누르면 다음 해 학년도로 진급합니다.
export function promotionTargetYear(now: Date = new Date()): number {
  const year = now.getFullYear()
  return now.getMonth() + 1 <= 6 ? year : year + 1
}
