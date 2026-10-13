// Supabase 테이블에서 읽어 오는 데이터의 모양.
// 컬럼 정의는 supabase/schema.sql 과 같게 유지합니다.

export type UserRole = 'admin' | 'developer' | 'coach' | 'athlete' | 'parents' | 'guest'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: UserRole
  status: 'pending' | 'approved'
  created_at: string
}

export interface AthleteSummary {
  id: string
  name: string
  grade: number | null
  gender?: 'M' | 'F'
  graduated_year?: number | null
}

// 대회 일정의 숙소·식당 항목 (schedules.accommodations / restaurants)
export interface Place {
  id: string
  name: string
  address: string
  contact?: string
  link?: string
}

export interface Schedule {
  id: string
  type: 'training' | 'competition'
  title: string
  date: string
  end_date: string | null
  description: string | null
  location: string | null
  participants: string[] | null
  accommodations: Place[] | null
  restaurants: Place[] | null
  created_by: string
  created_at: string
  users?: { name: string } | null
}

export interface SwimRecord {
  id: string
  athlete_id: string
  schedule_id: string | null
  event_name: string
  record_time: number
  record_date: string
  rank: number | null
  match_type: string | null
  created_at: string
  athletes?: { name: string } | null
  schedules?: { title: string; location: string | null } | null
}

// 대회 준비물 체크리스트 (system_settings 'competition_checklist')
export interface ChecklistItem {
  id: string
  label: string
}

export interface NewsArticleInput {
  title: string
  content: string
  article_url: string
  publisher: string
  publish_date?: string | null
  photo_url?: string | null
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  target_table: string
  details: ({ title?: string; name?: string } & Record<string, unknown>) | null
  created_at: string
}


export interface CounselingLog {
  id: string
  athlete_id: string
  date: string
  summary: string
  created_by: string
  created_at: string
  athletes?: { name: string } | null
  users?: { name: string } | null
}

export interface Notice {
  id: string
  title: string
  content: string
  created_by: string
  created_at: string
  users?: { name: string } | null
}

export interface Photo {
  id: string
  url: string
  description: string | null
  status: 'pending' | 'approved'
  created_by: string
  created_at: string
}

export interface AthleteRow extends AthleteSummary {
  gender: 'M' | 'F'
  is_deleted: boolean
  created_at: string
}

export interface NationwideRanking {
  id: string
  gender: string
  event: string
  rank: number | null
  athlete_name: string
  school: string | null
  record: string
  year: number | null
  grade: number | null
  created_at: string
}

// 기록 분석 화면의 선수별 문구 (관리자·개발자가 고침, 비어 있으면 자동 문구)
export interface AthleteAdvice {
  athlete_id: string
  focus_area: string
  advice: string
  updated_by: string | null
  updated_at: string
}

export interface TrainingVideo {
  id: string
  url: string
  title: string
  description: string | null
  category: string
  sub_category: string | null
  status: 'pending' | 'approved'
  created_by: string | null
  created_at: string
}
