// 선수 정보 중 일반 조회로 읽을 수 있는 컬럼.
// 학생 연락처·학부모 이름·학부모 연락처는 DB 에서 컬럼 권한으로 막혀 있어
// 관리자·개발자만 get_athlete_contacts() 로 따로 받아 옵니다.
export const ATHLETE_COLUMNS =
  'id, category, gender, name, hanja_name, is_registered, birth_date, attendance_start_date, attendance_end_date, join_date, grade, class_number, student_number, homeroom_teacher, graduated_year, is_deleted, created_at'

// 졸업생(graduated_year 가 있는 선수)은 지우지 않고 남겨 두며, 명단·대회·분석 화면에서는 재학생만 보여 줍니다.

// 비회원(둘러보기)도 읽을 수 있는 선수 컬럼: 이름·성별·학년만 (기록 화면에서 사용)
// DB 권한: supabase/manual/2026-10-13_guest_records.sql
export const PUBLIC_ATHLETE_COLUMNS = 'id, name, gender, grade, graduated_year, is_deleted, created_at'

export const CONTACT_VIEWER_ROLES = ['admin', 'developer']

export type AthleteContact = {
  id: string
  student_phone: string | null
  parent_name: string | null
  parent_phone: string | null
}
