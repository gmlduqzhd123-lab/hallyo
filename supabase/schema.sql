-- =====================================================================
-- Hallyoswim Supabase Database Schema
-- =====================================================================
-- 이 파일은 앱 코드(src/)가 실제로 읽고 쓰는 테이블·컬럼을 기준으로
-- 다시 정리한 "참고용 / 새 프로젝트 구축용" 스키마입니다.
--
-- ⚠️ 운영 중인 DB에 그대로 실행하지 마세요.
--    이미 테이블이 있으므로 CREATE 문이 실패하거나 정책이 겹칩니다.
--    운영 DB의 실제 구조는 supabase/inspect_schema.sql 을 SQL Editor에서
--    실행해 확인하고, 차이가 있으면 이 파일을 실제 구조에 맞춰 고쳐주세요.
--
-- 컬럼 타입 중 코드만으로 확정할 수 없는 것은 "-- 추정" 으로 표시했습니다.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------
-- 회원가입 화면(src/app/signup/page.tsx)에서 선택 가능한 역할과 동일
CREATE TYPE user_role AS ENUM ('admin', 'developer', 'coach', 'athlete', 'parents', 'guest');
CREATE TYPE user_status AS ENUM ('pending', 'approved');
CREATE TYPE gender_type AS ENUM ('M', 'F');


-- ---------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------

-- 사용자 (auth.users 와 같은 id 사용, 가입 시 pending → 관리자 승인)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,          -- 이름을 hex 로 바꾼 가짜 이메일 (…@hallyoswim.com)
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'athlete',
  status user_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 선수 명단 (soft delete)
CREATE TABLE public.athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hanja_name TEXT,
  gender gender_type NOT NULL,
  category TEXT,
  is_registered BOOLEAN NOT NULL DEFAULT false,   -- 선수 등록 여부
  birth_date DATE,
  join_date DATE,
  attendance_start_date DATE,
  attendance_end_date DATE,
  grade INTEGER CHECK (grade BETWEEN 1 AND 6),
  class_number TEXT,
  student_number INTEGER,
  homeroom_teacher TEXT,
  student_phone TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 일정 (훈련 / 대회)
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('training', 'competition')),
  title TEXT NOT NULL,
  date DATE NOT NULL,                  -- 시작일
  end_date DATE,
  description TEXT,
  location TEXT,
  participants TEXT[] NOT NULL DEFAULT '{}',      -- 참가 선수 id 목록 (추정: text[])
  accommodations JSONB NOT NULL DEFAULT '[]',     -- 숙소 목록 (추정: jsonb)
  restaurants JSONB NOT NULL DEFAULT '[]',        -- 식당 목록 (추정: jsonb)
  created_by UUID NOT NULL REFERENCES public.users(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 선수 기록 (soft delete)
CREATE TABLE public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id),
  schedule_id UUID REFERENCES public.schedules(id),   -- 대회 기록일 때 연결
  event_name TEXT NOT NULL,
  record_time NUMERIC(10, 2) NOT NULL,                -- 초 단위
  record_date DATE NOT NULL,
  rank INTEGER,
  match_type TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 전국 랭킹 (기록 분석 / 라이벌 비교 / 순위 시뮬레이터 / 통합 검색)
CREATE TABLE public.nationwide_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gender TEXT NOT NULL,                -- '남자' / '여자'
  event TEXT NOT NULL,                 -- 예: '자유형 50m'
  rank INTEGER,
  athlete_name TEXT NOT NULL,
  school TEXT,
  record TEXT NOT NULL,                -- 예: '32.15', '1:05.32'
  year INTEGER,
  grade INTEGER,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 상담 일지
CREATE TABLE public.counseling_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id),
  date DATE NOT NULL,
  summary TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 공지사항
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 활동 사진 (일반 회원 업로드는 pending → 관리자 승인)
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,                   -- Storage 'photos' 버킷 공개 URL
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  created_by UUID NOT NULL REFERENCES public.users(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 수영 관련 영상
CREATE TABLE public.training_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,              -- '훈련 영상' | '동기 유발' | '수영 상식' | '기타 수영 관련'
  sub_category TEXT,                   -- '훈련 영상' 일 때만 사용
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  created_by UUID REFERENCES public.users(id),   -- SQL 일괄 등록 시 비어 있음
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 대회 영상
CREATE TABLE public.competition_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  created_by UUID REFERENCES public.users(id),   -- SQL 일괄 등록 시 비어 있음
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 수영부 연혁
CREATE TABLE public.history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 보도 기사
CREATE TABLE public.news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  article_url TEXT,
  publisher TEXT,
  publish_date DATE,
  photo_url TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 명예의 전당
CREATE TABLE public.hall_of_fame (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_name TEXT NOT NULL,
  achievement TEXT NOT NULL,
  story TEXT,
  photo_url TEXT,
  article_url TEXT,
  principal TEXT,                      -- 당시 교장
  vice_principal TEXT,                 -- 교감
  supervisor TEXT,                     -- 담당 교사
  coach TEXT,
  assistant_coach TEXT,
  parent_president TEXT,               -- 학부모 회장
  captain TEXT,
  vice_captain TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 개발 일지 - 개발자 소개 카드
CREATE TABLE public.developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  bio TEXT,
  introduction TEXT,
  photo_url TEXT,
  youtube_url TEXT,
  blog_url TEXT,
  instagram_url TEXT,
  github_url TEXT,
  email TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 개발 일지 - 노트
-- 화면에서 users!developer_notes_created_by_users_fkey 로 조인하므로 제약 이름을 고정합니다.
CREATE TABLE public.developer_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_by UUID NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  CONSTRAINT developer_notes_created_by_users_fkey
    FOREIGN KEY (created_by) REFERENCES public.users(id)
);

-- 시스템 설정 (key-value)
-- 사용 중인 key: 'global_font', 'competition_checklist'(JSON 문자열), 페이지 머리말 문구들
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 변경 이력
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  action TEXT NOT NULL,                -- 'CREATE' | 'UPDATE' | 'DELETE'
  target_table TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ---------------------------------------------------------------------
-- 3. Helper functions
-- ---------------------------------------------------------------------

-- 승인된 사용자인가
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND status = 'approved'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 관리 권한(관리자·개발자·코치)이 있는 승인된 사용자인가
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND status = 'approved'
      AND role IN ('admin', 'developer', 'coach')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 관리자·개발자인가 (회원 관리, 선수 정보 수정 등)
CREATE OR REPLACE FUNCTION public.is_admin_or_developer()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND status = 'approved'
      AND role IN ('admin', 'developer')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;


-- ---------------------------------------------------------------------
-- 4. RPC (src/app/actions/admin.ts 에서 호출)
-- ---------------------------------------------------------------------
-- 운영 DB의 실제 함수 본문은 inspect_schema.sql 로 확인할 수 있습니다.

CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin_or_developer() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;
  DELETE FROM auth.users WHERE id = target_user_id;   -- public.users 는 CASCADE 로 함께 삭제
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.reset_user_password(target_user_id UUID, new_password TEXT)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin_or_developer() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;
  UPDATE auth.users
     SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf'))
   WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;


-- ---------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------
-- 세부 권한(작성자 본인만 수정 등)은 Server Action 에서 한 번 더 확인합니다.

ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nationwide_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_videos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_videos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hall_of_fame        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developer_notes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs          ENABLE ROW LEVEL SECURITY;

-- users: 본인 행은 항상 조회 가능(승인 대기 화면용), 승인된 사용자는 전체 조회
CREATE POLICY "users_select" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_approved_user());
CREATE POLICY "users_insert_self" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id AND status = 'pending');
CREATE POLICY "users_update_admin" ON public.users
  FOR UPDATE USING (public.is_admin_or_developer());

-- athletes: 조회는 승인된 사용자, 추가·수정은 관리자·개발자
CREATE POLICY "athletes_select" ON public.athletes
  FOR SELECT USING (public.is_approved_user());
CREATE POLICY "athletes_insert" ON public.athletes
  FOR INSERT WITH CHECK (public.is_admin_or_developer());
CREATE POLICY "athletes_update" ON public.athletes
  FOR UPDATE USING (public.is_admin_or_developer());

-- 관리 권한(관리자·개발자·코치)이 쓰는 테이블
CREATE POLICY "schedules_select" ON public.schedules FOR SELECT USING (public.is_approved_user());
CREATE POLICY "schedules_insert" ON public.schedules FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "schedules_update" ON public.schedules FOR UPDATE USING (public.is_staff());

CREATE POLICY "records_select" ON public.records FOR SELECT USING (public.is_approved_user());
CREATE POLICY "records_insert" ON public.records FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "records_update" ON public.records FOR UPDATE USING (public.is_staff());

CREATE POLICY "rankings_select" ON public.nationwide_rankings FOR SELECT USING (public.is_approved_user());
CREATE POLICY "rankings_write"  ON public.nationwide_rankings FOR ALL USING (public.is_admin_or_developer());

CREATE POLICY "counseling_select" ON public.counseling_logs FOR SELECT USING (public.is_staff());
CREATE POLICY "counseling_insert" ON public.counseling_logs FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "counseling_update" ON public.counseling_logs FOR UPDATE USING (public.is_staff());

CREATE POLICY "notices_select" ON public.notices FOR SELECT USING (public.is_approved_user());
CREATE POLICY "notices_insert" ON public.notices FOR INSERT WITH CHECK (public.is_staff());
CREATE POLICY "notices_update" ON public.notices
  FOR UPDATE USING (public.is_admin_or_developer() OR created_by = auth.uid());

-- 승인된 사용자 누구나 올리고, 본인 또는 관리 권한자가 수정하는 테이블
CREATE POLICY "photos_select" ON public.photos FOR SELECT USING (public.is_approved_user());
CREATE POLICY "photos_insert" ON public.photos
  FOR INSERT WITH CHECK (public.is_approved_user() AND created_by = auth.uid());
CREATE POLICY "photos_update" ON public.photos
  FOR UPDATE USING (public.is_admin_or_developer() OR created_by = auth.uid());

CREATE POLICY "training_videos_select" ON public.training_videos FOR SELECT USING (public.is_approved_user());
CREATE POLICY "training_videos_insert" ON public.training_videos
  FOR INSERT WITH CHECK (public.is_approved_user() AND created_by = auth.uid());
CREATE POLICY "training_videos_update" ON public.training_videos
  FOR UPDATE USING (public.is_staff() OR created_by = auth.uid());

CREATE POLICY "competition_videos_select" ON public.competition_videos FOR SELECT USING (public.is_approved_user());
CREATE POLICY "competition_videos_insert" ON public.competition_videos
  FOR INSERT WITH CHECK (public.is_approved_user() AND created_by = auth.uid());
CREATE POLICY "competition_videos_update" ON public.competition_videos
  FOR UPDATE USING (public.is_staff() OR created_by = auth.uid());

CREATE POLICY "history_select" ON public.history FOR SELECT USING (public.is_approved_user());
CREATE POLICY "history_insert" ON public.history
  FOR INSERT WITH CHECK (public.is_approved_user() AND created_by = auth.uid());
CREATE POLICY "history_update" ON public.history
  FOR UPDATE USING (public.is_admin_or_developer() OR created_by = auth.uid());

CREATE POLICY "news_select" ON public.news_articles FOR SELECT USING (public.is_approved_user());
CREATE POLICY "news_insert" ON public.news_articles
  FOR INSERT WITH CHECK (public.is_approved_user() AND created_by = auth.uid());
CREATE POLICY "news_update" ON public.news_articles
  FOR UPDATE USING (public.is_admin_or_developer() OR created_by = auth.uid());

CREATE POLICY "hof_select" ON public.hall_of_fame FOR SELECT USING (public.is_approved_user());
CREATE POLICY "hof_insert" ON public.hall_of_fame
  FOR INSERT WITH CHECK (public.is_approved_user() AND created_by = auth.uid());
CREATE POLICY "hof_update" ON public.hall_of_fame
  FOR UPDATE USING (public.is_admin_or_developer() OR created_by = auth.uid());

-- 개발 일지·설정: 관리자·개발자
CREATE POLICY "developers_select" ON public.developers FOR SELECT USING (public.is_approved_user());
CREATE POLICY "developers_write"  ON public.developers FOR ALL USING (public.is_admin_or_developer());

CREATE POLICY "dev_notes_select" ON public.developer_notes FOR SELECT USING (public.is_approved_user());
CREATE POLICY "dev_notes_write"  ON public.developer_notes FOR ALL USING (public.is_admin_or_developer());

CREATE POLICY "settings_select" ON public.system_settings FOR SELECT USING (true);  -- 로그인 전 글꼴 적용용
CREATE POLICY "settings_write"  ON public.system_settings FOR ALL USING (public.is_admin_or_developer());

-- audit_logs: 기록은 승인된 사용자 본인 명의로만, 조회는 관리 권한자
CREATE POLICY "audit_select" ON public.audit_logs FOR SELECT USING (public.is_staff());
CREATE POLICY "audit_insert" ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_approved_user() AND user_id = auth.uid());


-- ---------------------------------------------------------------------
-- 6. Storage
-- ---------------------------------------------------------------------
-- 사진·기사·명예의 전당·개발자 사진은 모두 공개 버킷 'photos' 에 올립니다.
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "photos_bucket_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "photos_bucket_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos' AND public.is_approved_user());
