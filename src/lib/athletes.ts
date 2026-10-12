// 선수 정보 중 일반 조회로 읽을 수 있는 컬럼.
// 학생 연락처·학부모 이름·학부모 연락처는 DB 에서 컬럼 권한으로 막혀 있어
// 관리자·개발자만 get_athlete_contacts() 로 따로 받아 옵니다.
export const ATHLETE_COLUMNS =
  'id, category, gender, name, hanja_name, is_registered, birth_date, attendance_start_date, attendance_end_date, join_date, grade, class_number, student_number, homeroom_teacher, is_deleted, created_at'

export const CONTACT_VIEWER_ROLES = ['admin', 'developer']

export type AthleteContact = {
  id: string
  student_phone: string | null
  parent_name: string | null
  parent_phone: string | null
}
