// catch 블록에서 받은 값을 사용자에게 보여줄 메시지로 바꿉니다.
export function errorMessage(err: unknown, fallback = '알 수 없는 오류가 발생했습니다.') {
  return err instanceof Error ? err.message : fallback
}
