-- =====================================================================
-- Hallyoswim Supabase Database Schema
-- =====================================================================
-- 운영 DB(qyluqlzrraxecliubjmv)에서 2026-10-13 에 직접 뽑아 정리한 실제 구조입니다.
-- 새 프로젝트를 만들거나 구조를 확인할 때 참고하세요.
--
-- ⚠️ 운영 DB 에 그대로 실행하지 마세요 (이미 있는 객체라 오류가 납니다).
--    운영 DB 를 바꿀 때는 바뀌는 부분만 따로 실행하고, 이 파일도 함께 고쳐 주세요.
--    현재 구조 확인: supabase/inspect_schema.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------
create type public.gender_type as enum ('M', 'F');
create type public.user_role as enum ('admin', 'coach', 'athlete', 'parents', 'guest', 'developer');
create type public.user_status as enum ('pending', 'approved');


-- ---------------------------------------------------------------------
-- 2. Tables (참조 순서대로)
-- ---------------------------------------------------------------------
create table public.users (
  id uuid not null default gen_random_uuid(),   -- auth.users.id 와 같은 값 (FK 는 없음)
  email text not null,                          -- 이름을 hex 로 바꾼 가짜 이메일 (…@hallyoswim.com)
  name text not null,
  role user_role not null default 'athlete'::user_role,
  status user_status not null default 'pending'::user_status,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint users_email_key UNIQUE (email),
  constraint users_pkey PRIMARY KEY (id)
);

create table public.athletes (
  id uuid not null default gen_random_uuid(),
  name text not null,
  gender gender_type not null,
  grade integer,
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  class_number text,
  homeroom_teacher text,
  student_phone text,                           -- 연락처 3개 컬럼은 7번 권한 참고
  parent_name text,
  parent_phone text,
  category text,
  hanja_name text,
  is_registered boolean default false,
  birth_date date,
  attendance_start_date date,
  attendance_end_date date,
  join_date date,
  student_number integer,
  constraint athletes_pkey PRIMARY KEY (id),
  constraint athletes_grade_check CHECK (((grade > 0) AND (grade <= 6)))
);

create table public.schedules (
  id uuid not null default gen_random_uuid(),
  type text not null,
  title text not null,
  date date not null,
  description text,
  location text,
  created_by uuid not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  end_date date,
  participants uuid[] default '{}'::uuid[],
  accommodations jsonb default '[]'::jsonb,
  restaurants jsonb default '[]'::jsonb,
  constraint schedules_pkey PRIMARY KEY (id),
  constraint schedules_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id),
  constraint schedules_type_check CHECK ((type = ANY (ARRAY['training'::text, 'competition'::text])))
);

create table public.records (
  id uuid not null default gen_random_uuid(),
  athlete_id uuid not null,
  event_name text not null,
  record_time numeric not null,
  record_date date not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  schedule_id uuid,
  rank integer,
  match_type varchar,
  constraint records_pkey PRIMARY KEY (id),
  constraint records_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES athletes(id),
  constraint records_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES schedules(id)
);

create table public.nationwide_rankings (
  id uuid not null default gen_random_uuid(),
  gender text not null,
  event text not null,
  rank integer not null,
  athlete_name text not null,
  school text not null,
  record text not null,
  year integer default 2025,
  is_deleted boolean default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  grade integer,
  constraint nationwide_rankings_pkey PRIMARY KEY (id)
);

create table public.counseling_logs (
  id uuid not null default gen_random_uuid(),
  athlete_id uuid not null,
  date date not null,
  summary text not null,
  created_by uuid not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint counseling_logs_pkey PRIMARY KEY (id),
  constraint counseling_logs_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES athletes(id),
  constraint counseling_logs_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id)
);

create table public.notices (
  id uuid not null default gen_random_uuid(),
  title text not null,
  content text not null,
  created_by uuid not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint notices_pkey PRIMARY KEY (id),
  constraint notices_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id)
);

create table public.audit_logs (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  action text not null,
  target_table text not null,
  details jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint audit_logs_pkey PRIMARY KEY (id),
  constraint audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id)
);

create table public.photos (
  id uuid not null default gen_random_uuid(),
  url text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  created_by uuid,
  is_deleted boolean not null default false,
  status text default 'approved'::text,
  description text,
  constraint photos_pkey PRIMARY KEY (id),
  constraint photos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

create table public.training_videos (
  id uuid not null default gen_random_uuid(),
  url text not null,
  title text not null,
  description text,
  created_by uuid,
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  status text default 'approved'::text,
  category text default '훈련 영상'::text,
  sub_category text default '기타 영상'::text,
  constraint training_videos_pkey PRIMARY KEY (id),
  constraint training_videos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

create table public.competition_videos (
  id uuid not null default gen_random_uuid(),
  title text not null,
  description text,
  url text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  created_by uuid,
  is_deleted boolean not null default false,
  status text default 'approved'::text,
  category text default '기타'::text,
  constraint competition_videos_pkey PRIMARY KEY (id),
  constraint competition_videos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

create table public.history (
  id uuid not null default gen_random_uuid(),
  date date not null,
  title text not null,
  description text,
  is_deleted boolean default false,
  created_at timestamptz default now(),
  created_by uuid,
  constraint history_pkey PRIMARY KEY (id),
  constraint history_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

create table public.news_articles (
  id uuid not null default gen_random_uuid(),
  title text not null,
  content text not null,
  article_url text not null,
  publisher text,
  publish_date date,
  photo_url text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid,
  constraint news_articles_pkey PRIMARY KEY (id),
  constraint news_articles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

create table public.hall_of_fame (
  id uuid not null default gen_random_uuid(),
  athlete_name text not null,
  achievement text not null,
  story text,
  photo_url text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  is_deleted boolean not null default false,
  article_url text,
  principal text,
  vice_principal text,
  supervisor text,
  coach text,
  assistant_coach text,
  parent_president text,
  captain text,
  vice_captain text,
  created_by uuid,
  constraint hall_of_fame_pkey PRIMARY KEY (id),
  constraint hall_of_fame_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

create table public.developers (
  id uuid not null default gen_random_uuid(),
  name text not null,
  role text,
  bio text,
  introduction text,
  photo_url text,
  youtube_url text,
  blog_url text,
  instagram_url text,
  github_url text,
  email text,
  is_deleted boolean not null default false,
  display_order integer default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint developers_pkey PRIMARY KEY (id)
);

-- 화면에서 users!developer_notes_created_by_users_fkey 로 조인합니다 (FK 가 두 개라 이름 지정 필요)
create table public.developer_notes (
  id uuid not null default gen_random_uuid(),
  content text not null,
  created_at timestamptz default timezone('utc'::text, now()),
  updated_at timestamptz default timezone('utc'::text, now()),
  created_by uuid,
  is_deleted boolean default false,
  constraint developer_notes_pkey PRIMARY KEY (id),
  constraint developer_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  constraint developer_notes_created_by_users_fkey FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 사용 중인 key: 'competition_checklist'(JSON 문자열), 페이지 머리말 문구들 등
create table public.system_settings (
  key text not null,
  value text not null,
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint system_settings_pkey PRIMARY KEY (key)
);


-- ---------------------------------------------------------------------
-- 3. 권한 확인 함수
-- ---------------------------------------------------------------------
create or replace function public.is_approved_user()
returns boolean language sql security definer set search_path = public
as $$
  select exists (select 1 from public.users where id = auth.uid() and status = 'approved');
$$;

-- 이름과 달리 관리자·코치·개발자 모두 해당
create or replace function public.is_admin_or_coach()
returns boolean language sql security definer set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and status = 'approved' and role in ('admin', 'coach', 'developer')
  );
$$;

create or replace function public.is_developer()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and status = 'approved' and role = 'developer'
  );
$$;

-- 선수 연락처(학생 전화, 학부모 이름·전화)는 승인된 관리자·개발자에게만
create or replace function public.get_athlete_contacts()
returns table (id uuid, student_phone text, parent_name text, parent_phone text)
language sql stable security definer set search_path = public
as $$
  select a.id, a.student_phone, a.parent_name, a.parent_phone
  from public.athletes a
  where a.is_deleted = false
    and exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.status = 'approved' and u.role in ('admin', 'developer')
    );
$$;


-- ---------------------------------------------------------------------
-- 4. 회원 관리 함수 (src/app/actions/admin.ts 에서 호출, 승인된 개발자만)
-- ---------------------------------------------------------------------
create or replace function public.reset_user_password(target_user_id uuid, new_password text)
returns boolean language plpgsql security definer set search_path = public, auth, extensions
as $function$
begin
  if not public.is_developer() then
    raise exception 'Only developers can reset passwords.';
  end if;
  update auth.users
  set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf'))
  where id = target_user_id;
  return true;
end;
$function$;

-- 공지·일정·상담 일지의 작성자는 비울 수 없어 삭제를 실행한 개발자에게 넘기고, 나머지 작성자 칸은 비웁니다
create or replace function public.delete_user_account(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $function$
begin
  if not public.is_developer() then
    raise exception 'Only developers can delete users.';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot delete your own account.';
  end if;

  -- 비울 수 없는 작성자 칸: 삭제를 실행한 개발자에게 넘김
  update public.notices         set created_by = auth.uid() where created_by = target_user_id;
  update public.schedules       set created_by = auth.uid() where created_by = target_user_id;
  update public.counseling_logs set created_by = auth.uid() where created_by = target_user_id;

  -- 비워도 되는 작성자 칸
  update public.photos             set created_by = null where created_by = target_user_id;
  update public.training_videos    set created_by = null where created_by = target_user_id;
  update public.competition_videos set created_by = null where created_by = target_user_id;
  update public.history            set created_by = null where created_by = target_user_id;
  update public.news_articles      set created_by = null where created_by = target_user_id;
  update public.hall_of_fame       set created_by = null where created_by = target_user_id;
  update public.developer_notes    set created_by = null where created_by = target_user_id;

  delete from public.audit_logs where user_id = target_user_id;
  delete from public.users where id = target_user_id;
  delete from auth.users where id = target_user_id;

  return true;
end;
$function$;


revoke all on function public.is_developer() from public, anon;
revoke all on function public.get_athlete_contacts() from public, anon;
revoke execute on function public.reset_user_password(uuid, text) from public, anon;
revoke execute on function public.delete_user_account(uuid) from public, anon;
grant execute on function public.is_developer() to authenticated;
grant execute on function public.get_athlete_contacts() to authenticated;
grant execute on function public.reset_user_password(uuid, text) to authenticated;
grant execute on function public.delete_user_account(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------
alter table public.athletes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.competition_videos enable row level security;
alter table public.counseling_logs enable row level security;
alter table public.developer_notes enable row level security;
alter table public.developers enable row level security;
alter table public.hall_of_fame enable row level security;
alter table public.history enable row level security;
alter table public.nationwide_rankings enable row level security;
alter table public.news_articles enable row level security;
alter table public.notices enable row level security;
alter table public.photos enable row level security;
alter table public.records enable row level security;
alter table public.schedules enable row level security;
alter table public.system_settings enable row level security;
alter table public.training_videos enable row level security;
alter table public.users enable row level security;

-- users
create policy "Users can insert their own profile" on public.users for insert
  with check (auth.uid() = id and status = 'pending');          -- 가입은 승인 대기 상태로만
create policy "Approved users can view users" on public.users for select
  using (is_approved_user());
create policy "Developers can update users" on public.users for update
  using (is_developer()) with check (is_developer());           -- 승인·역할 변경은 개발자만

-- athletes (연락처 컬럼은 7번 컬럼 권한으로 별도 차단)
create policy "Admins and coaches can insert athletes" on public.athletes for insert
  with check (is_admin_or_coach());
create policy "Approved users can view athletes" on public.athletes for select
  using (is_approved_user());
create policy "Admins and coaches can update/soft-delete athletes" on public.athletes for update
  using (is_admin_or_coach());

-- schedules / records
create policy "Admins and coaches can insert schedules" on public.schedules for insert
  with check (is_admin_or_coach());
create policy "Approved users can view schedules" on public.schedules for select
  using (is_approved_user());
create policy "Admins and coaches can update/soft-delete schedules" on public.schedules for update
  using (is_admin_or_coach());
create policy "Admins and coaches can insert records" on public.records for insert
  with check (is_admin_or_coach());
create policy "Approved users can view records" on public.records for select
  using (is_approved_user());
create policy "Admins and coaches can update/soft-delete records" on public.records for update
  using (is_admin_or_coach());

-- nationwide_rankings (정책 이름은 예전 그대로지만, 승인된 로그인 사용자만 조회)
create policy "누구나 전국 랭킹을 조회할 수 있음" on public.nationwide_rankings for select
  using (is_approved_user());

-- counseling_logs: 관리자·개발자·코치만
create policy "Admins and coaches can insert counseling logs" on public.counseling_logs for insert
  with check (is_admin_or_coach());
create policy "Admins, developers and coaches can view counseling logs" on public.counseling_logs for select
  using (is_admin_or_coach());
create policy "Admins and coaches can update/soft-delete counseling logs" on public.counseling_logs for update
  using (is_admin_or_coach());

-- notices
create policy "Enable insert for authorized users" on public.notices for insert
  with check (exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role, 'coach'::user_role])));
create policy "Approved users can view notices" on public.notices for select
  using (is_approved_user());
create policy "Enable update for authorized users" on public.notices for update
  using ((exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role, 'coach'::user_role]))) or (created_by = auth.uid()));
create policy "Enable delete for authorized users" on public.notices for delete
  using ((exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role, 'coach'::user_role]))) or (created_by = auth.uid()));

-- audit_logs
create policy "System can insert audit logs" on public.audit_logs for insert
  with check (is_approved_user());
create policy "Admins and coaches can view audit logs" on public.audit_logs for select
  using (is_admin_or_coach());

-- photos / competition_videos: 승인된 사용자 조회, 로그인한 누구나 등록
create policy "Enable read access for all users" on public.photos for select using (is_approved_user());
create policy "Enable insert for all authenticated users" on public.photos for insert
  with check (auth.role() = 'authenticated'::text);
create policy "Enable update for authorized users" on public.photos for update
  using ((exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role, 'coach'::user_role]))) or (created_by = auth.uid()));
create policy "Enable delete for authorized users" on public.photos for delete
  using ((exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role, 'coach'::user_role]))) or (created_by = auth.uid()));

create policy "Enable read access for all users" on public.competition_videos for select using (is_approved_user());
create policy "Enable insert for all authenticated users" on public.competition_videos for insert
  with check (auth.role() = 'authenticated'::text);
create policy "Enable update for authorized users" on public.competition_videos for update
  using ((exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role, 'coach'::user_role]))) or (created_by = auth.uid()));
create policy "Enable delete for authorized users" on public.competition_videos for delete
  using ((exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role, 'coach'::user_role]))) or (created_by = auth.uid()));

-- training_videos: 승인된 사용자 조회, 관리자·개발자·코치 등록
create policy "Approved users can view training videos" on public.training_videos for select
  using (is_approved_user());
create policy "Enable insert for authorized users" on public.training_videos for insert
  with check (exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role, 'coach'::user_role])));
create policy "Enable update for authorized users" on public.training_videos for update
  using ((exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role, 'coach'::user_role]))) or (created_by = auth.uid()));
create policy "Enable delete for authorized users" on public.training_videos for delete
  using ((exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role, 'coach'::user_role]))) or (created_by = auth.uid()));

-- history / news_articles / hall_of_fame: 관리자·개발자 등록, 본인 수정
create policy "Enable read access for all users" on public.history for select using (is_approved_user());
create policy "Enable insert for authorized users" on public.history for insert
  with check (exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role])));
create policy "Enable update for authorized users" on public.history for update
  using ((exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role]))) or (created_by = auth.uid()));
create policy "Enable delete for authorized users" on public.history for delete
  using ((exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role]))) or (created_by = auth.uid()));

create policy "Enable read access for all users" on public.news_articles for select
  using (is_approved_user() and ((is_deleted = false) or (created_by = auth.uid()) or (exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role])))));
create policy "Enable insert for authorized users" on public.news_articles for insert
  with check (exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role])));
create policy "Enable update for authorized users" on public.news_articles for update
  using ((exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role]))) or (created_by = auth.uid()));
create policy "Enable delete for authorized users" on public.news_articles for delete
  using ((exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role]))) or (created_by = auth.uid()));

create policy "Enable read access for all users" on public.hall_of_fame for select
  using (is_approved_user() and ((is_deleted = false) or (exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role])))));
create policy "Enable insert for authorized users" on public.hall_of_fame for insert
  with check (exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role])));
create policy "Enable update for authorized users" on public.hall_of_fame for update
  using ((exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role]))) or (created_by = auth.uid()));
create policy "Enable delete for authorized users" on public.hall_of_fame for delete
  using ((exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role]))) or (created_by = auth.uid()));

-- developers / developer_notes
create policy "Anyone approved can view developers" on public.developers for select
  using (is_approved_user());
create policy "Admins can insert developers" on public.developers for insert
  with check (is_admin_or_coach());
create policy "Admins can update developers" on public.developers for update
  using (is_admin_or_coach());

create policy "Anyone can view developer notes" on public.developer_notes for select
  using (is_approved_user() and is_deleted = false);
create policy "Admins and developers can view all notes" on public.developer_notes for select
  using (exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role])));
create policy "Only developers and admins can insert notes" on public.developer_notes for insert
  with check (exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role])));
create policy "Only developers and admins can update notes" on public.developer_notes for update
  using (exists (select 1 from users where users.id = auth.uid() and users.role = any (array['admin'::user_role, 'developer'::user_role])));

-- system_settings: 승인된 사용자 조회, 개발자만 수정
create policy "Enable read access for all users" on public.system_settings for select using (is_approved_user());
create policy "Enable all access for developer" on public.system_settings for all
  using (exists (select 1 from users where users.id = auth.uid() and users.role = 'developer'::user_role));


-- ---------------------------------------------------------------------
-- 6. Storage (비공개 버킷 photos, videos)
-- ---------------------------------------------------------------------
-- 버킷은 대시보드에서 만들어져 있음: photos, videos(현재 코드에서는 미사용) — 둘 다 public = false
-- 화면에는 src/app/storage/photos/[...path]/route.ts 가 승인된 사용자에게만 사진을 전달합니다.
create policy "Public Access" on storage.objects for select to authenticated using (bucket_id = 'photos' and public.is_approved_user());
create policy "Auth Insert" on storage.objects for insert to authenticated with check (bucket_id = 'photos');
create policy "Auth Update" on storage.objects for update to authenticated using (bucket_id = 'photos');
create policy "Auth Delete" on storage.objects for delete to authenticated using (bucket_id = 'photos');
create policy "Public Access Videos" on storage.objects for select to authenticated using (bucket_id = 'videos' and public.is_approved_user());
create policy "Auth Insert Videos" on storage.objects for insert to authenticated with check (bucket_id = 'videos');
create policy "Auth Update Videos" on storage.objects for update to authenticated using (bucket_id = 'videos');
create policy "Auth Delete Videos" on storage.objects for delete to authenticated using (bucket_id = 'videos');


-- ---------------------------------------------------------------------
-- 7. 컬럼 권한: 선수 연락처
-- ---------------------------------------------------------------------
-- student_phone, parent_name, parent_phone 은 일반 조회(select)에서 제외합니다.
-- 관리자·개발자는 get_athlete_contacts() 로만 읽습니다. 수정(update)은 그대로 가능.
-- ⚠️ athletes 에 컬럼을 새로 추가하면 아래 grant 에도 넣어야 앱에서 읽을 수 있습니다
--    (src/lib/athletes.ts 의 ATHLETE_COLUMNS 도 함께 수정).
revoke select on public.athletes from anon, authenticated;
grant select (id, category, gender, name, hanja_name, is_registered, birth_date, attendance_start_date, attendance_end_date, join_date, grade, class_number, student_number, homeroom_teacher, is_deleted, created_at)
  on public.athletes to authenticated;


-- =====================================================================
-- 8. 승인된 사용자만 쓰기 (2026-10-13 운영 DB 적용, supabase/manual/2026-10-13_require_approval_for_writes.sql)
-- =====================================================================
-- 위 1~7 의 정책 일부를 아래 내용으로 덮어씁니다. 최종 운영 상태는 이 섹션까지 적용한 결과입니다.

-- ---------------------------------------------------------------------
-- 권한 확인 함수
-- ---------------------------------------------------------------------
create or replace function public.is_admin_or_developer()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and status = 'approved' and role in ('admin', 'developer')
  );
$$;
grant execute on function public.is_admin_or_developer() to anon, authenticated;
-- 로그인 전 요청에서도 권한 규칙이 평가될 수 있어 실행 권한만 열어 둡니다 (결과는 false)
grant execute on function public.is_developer() to anon;

-- ---------------------------------------------------------------------
-- 1) 가입
-- ---------------------------------------------------------------------
alter policy "Users can insert their own profile" on public.users
  with check (
    (select auth.uid()) = id
    and status = 'pending'
    and role in ('athlete', 'coach', 'parents', 'guest')
  );

-- ---------------------------------------------------------------------
-- 2) 쓰기 권한 규칙
-- ---------------------------------------------------------------------
-- 사진·대회 영상: 승인된 사용자 누구나 올림 / 관리 권한자(관리자·개발자·코치) 또는 본인이 수정·삭제
alter policy "Enable insert for all authenticated users" on public.photos
  with check ((select public.is_approved_user()) and created_by = (select auth.uid()));
alter policy "Enable update for authorized users" on public.photos
  using ((select public.is_admin_or_coach()) or ((select public.is_approved_user()) and created_by = (select auth.uid())));
alter policy "Enable delete for authorized users" on public.photos
  using ((select public.is_admin_or_coach()) or ((select public.is_approved_user()) and created_by = (select auth.uid())));

alter policy "Enable insert for all authenticated users" on public.competition_videos
  with check ((select public.is_approved_user()) and created_by = (select auth.uid()));
alter policy "Enable update for authorized users" on public.competition_videos
  using ((select public.is_admin_or_coach()) or ((select public.is_approved_user()) and created_by = (select auth.uid())));
alter policy "Enable delete for authorized users" on public.competition_videos
  using ((select public.is_admin_or_coach()) or ((select public.is_approved_user()) and created_by = (select auth.uid())));

-- 수영 관련 영상: 관리 권한자가 올림 / 관리 권한자 또는 본인이 수정·삭제
alter policy "Enable insert for authorized users" on public.training_videos
  with check ((select public.is_admin_or_coach()));
alter policy "Enable update for authorized users" on public.training_videos
  using ((select public.is_admin_or_coach()) or ((select public.is_approved_user()) and created_by = (select auth.uid())));
alter policy "Enable delete for authorized users" on public.training_videos
  using ((select public.is_admin_or_coach()) or ((select public.is_approved_user()) and created_by = (select auth.uid())));

-- 공지: 관리 권한자가 올림 / 관리 권한자 또는 본인이 수정·삭제
alter policy "Enable insert for authorized users" on public.notices
  with check ((select public.is_admin_or_coach()));
alter policy "Enable update for authorized users" on public.notices
  using ((select public.is_admin_or_coach()) or ((select public.is_approved_user()) and created_by = (select auth.uid())));
alter policy "Enable delete for authorized users" on public.notices
  using ((select public.is_admin_or_coach()) or ((select public.is_approved_user()) and created_by = (select auth.uid())));

-- 연혁·기사·명예의 전당: 관리자·개발자가 올림 / 관리자·개발자 또는 본인이 수정·삭제
alter policy "Enable insert for authorized users" on public.history
  with check ((select public.is_admin_or_developer()));
alter policy "Enable update for authorized users" on public.history
  using ((select public.is_admin_or_developer()) or ((select public.is_approved_user()) and created_by = (select auth.uid())));
alter policy "Enable delete for authorized users" on public.history
  using ((select public.is_admin_or_developer()) or ((select public.is_approved_user()) and created_by = (select auth.uid())));

alter policy "Enable insert for authorized users" on public.news_articles
  with check ((select public.is_admin_or_developer()));
alter policy "Enable update for authorized users" on public.news_articles
  using ((select public.is_admin_or_developer()) or ((select public.is_approved_user()) and created_by = (select auth.uid())));
alter policy "Enable delete for authorized users" on public.news_articles
  using ((select public.is_admin_or_developer()) or ((select public.is_approved_user()) and created_by = (select auth.uid())));
alter policy "Enable read access for all users" on public.news_articles
  using ((select public.is_approved_user()) and (is_deleted = false or created_by = (select auth.uid()) or (select public.is_admin_or_developer())));

alter policy "Enable insert for authorized users" on public.hall_of_fame
  with check ((select public.is_admin_or_developer()));
alter policy "Enable update for authorized users" on public.hall_of_fame
  using ((select public.is_admin_or_developer()) or ((select public.is_approved_user()) and created_by = (select auth.uid())));
alter policy "Enable delete for authorized users" on public.hall_of_fame
  using ((select public.is_admin_or_developer()) or ((select public.is_approved_user()) and created_by = (select auth.uid())));
alter policy "Enable read access for all users" on public.hall_of_fame
  using ((select public.is_approved_user()) and (is_deleted = false or (select public.is_admin_or_developer())));

-- 개발 노트: 관리자·개발자
alter policy "Only developers and admins can insert notes" on public.developer_notes
  with check ((select public.is_admin_or_developer()));
alter policy "Only developers and admins can update notes" on public.developer_notes
  using ((select public.is_admin_or_developer()));
alter policy "Admins and developers can view all notes" on public.developer_notes
  using ((select public.is_admin_or_developer()));

-- 시스템 설정: 개발자
alter policy "Enable all access for developer" on public.system_settings
  using ((select public.is_developer())) with check ((select public.is_developer()));

-- ---------------------------------------------------------------------
-- 3) 사진·영상 승인 상태 강제
-- ---------------------------------------------------------------------
-- 승인 권한: 사진은 관리자·개발자, 영상은 관리자·개발자·코치 (앱 화면과 같은 기준)
-- SQL Editor·서비스 키처럼 로그인 사용자가 없는 작업(auth.uid() 없음)은 그대로 둡니다
create or replace function public.enforce_media_approval()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  can_approve boolean;
begin
  if auth.uid() is null then
    return new;
  end if;
  can_approve := case when tg_table_name = 'photos'
                      then public.is_admin_or_developer()
                      else public.is_admin_or_coach() end;
  if tg_op = 'INSERT' then
    if not can_approve then
      new.status := 'pending';
    end if;
  elsif new.status is distinct from old.status and not can_approve then
    raise exception 'Only approvers can change the approval status.';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_media_approval on public.photos;
drop trigger if exists enforce_media_approval on public.competition_videos;
drop trigger if exists enforce_media_approval on public.training_videos;
create trigger enforce_media_approval before insert or update on public.photos
  for each row execute function public.enforce_media_approval();
create trigger enforce_media_approval before insert or update on public.competition_videos
  for each row execute function public.enforce_media_approval();
create trigger enforce_media_approval before insert or update on public.training_videos
  for each row execute function public.enforce_media_approval();

-- ---------------------------------------------------------------------
-- 4) 사진 파일 저장소
-- ---------------------------------------------------------------------
alter policy "Auth Insert" on storage.objects
  with check (bucket_id = 'photos' and (select public.is_approved_user()));
alter policy "Auth Update" on storage.objects
  using (bucket_id = 'photos' and ((select public.is_admin_or_developer()) or ((select public.is_approved_user()) and owner_id = (select auth.uid())::text)));
alter policy "Auth Delete" on storage.objects
  using (bucket_id = 'photos' and ((select public.is_admin_or_developer()) or ((select public.is_approved_user()) and owner_id = (select auth.uid())::text)));
-- videos 버킷은 현재 앱에서 쓰지 않아 개발자만
alter policy "Auth Insert Videos" on storage.objects
  with check (bucket_id = 'videos' and (select public.is_developer()));
alter policy "Auth Update Videos" on storage.objects
  using (bucket_id = 'videos' and (select public.is_developer()));
alter policy "Auth Delete Videos" on storage.objects
  using (bucket_id = 'videos' and (select public.is_developer()));

-- ---------------------------------------------------------------------
-- 5) 외래키 색인
-- ---------------------------------------------------------------------
create index if not exists audit_logs_user_id_idx on public.audit_logs (user_id);
create index if not exists competition_videos_created_by_idx on public.competition_videos (created_by);
create index if not exists counseling_logs_athlete_id_idx on public.counseling_logs (athlete_id);
create index if not exists counseling_logs_created_by_idx on public.counseling_logs (created_by);
create index if not exists developer_notes_created_by_idx on public.developer_notes (created_by);
create index if not exists hall_of_fame_created_by_idx on public.hall_of_fame (created_by);
create index if not exists history_created_by_idx on public.history (created_by);
create index if not exists news_articles_created_by_idx on public.news_articles (created_by);
create index if not exists notices_created_by_idx on public.notices (created_by);
create index if not exists photos_created_by_idx on public.photos (created_by);
create index if not exists records_athlete_id_idx on public.records (athlete_id);
create index if not exists records_schedule_id_idx on public.records (schedule_id);
create index if not exists schedules_created_by_idx on public.schedules (created_by);
create index if not exists training_videos_created_by_idx on public.training_videos (created_by);

-- =====================================================================
-- 9. 기록 분석 문구 (2026-10-13 운영 DB 적용, supabase/manual/2026-10-13_athlete_advice.sql)
-- =====================================================================
create table if not exists public.athlete_advice (
  athlete_id uuid primary key references public.athletes (id),
  focus_area text not null default '',
  advice text not null default '',
  updated_by uuid,
  updated_at timestamptz not null default now()
);

alter table public.athlete_advice enable row level security;

create policy "Approved users can read advice" on public.athlete_advice
  for select using ((select public.is_approved_user()));
create policy "Admins and developers manage advice" on public.athlete_advice
  for all using ((select public.is_admin_or_developer()))
  with check ((select public.is_admin_or_developer()));

grant select, insert, update on public.athlete_advice to authenticated;
