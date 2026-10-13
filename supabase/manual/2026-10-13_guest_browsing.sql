-- 비회원 둘러보기 (2026-10-13 운영 DB 적용)
-- ✅ 운영 DB 에 적용 완료 (기록용, 내용은 schema.sql 11번에도 반영됨)
--
-- 로그인하지 않은 사용자(anon)가 읽을 수 있는 것:
--   연혁, 보도 기사, 명예의 전당, 개발자 소개, 수영 관련 영상(승인된 것), 전국 기록,
--   대회 일정(이름·날짜·장소만), 공지사항(전체 공개로 표시한 것만), 화면 설명 문구(system_settings 'desc_%'),
--   위 글에 붙은 사진 파일
-- 선수 명단·우리 선수 기록·사진첩·대회 영상·훈련 일정·상담 일지·회원 정보는 그대로 회원 전용입니다.

-- 공지: 전체 공개 여부 (기본 비공개)
alter table public.notices add column if not exists is_public boolean not null default false;

-- 대회 일정: 비회원은 이름·날짜·장소만 (참가 선수·숙소·식당·비고는 컬럼 권한으로 막음)
revoke select on public.schedules from anon;
grant select (id, type, title, date, end_date, location, is_deleted, created_at) on public.schedules to anon;

create policy "Guests can view history" on public.history
  for select to anon using (is_deleted is not true);
create policy "Guests can view news articles" on public.news_articles
  for select to anon using (is_deleted = false);
create policy "Guests can view hall of fame" on public.hall_of_fame
  for select to anon using (is_deleted = false);
create policy "Guests can view developers" on public.developers
  for select to anon using (is_deleted = false);
create policy "Guests can view approved training videos" on public.training_videos
  for select to anon using (is_deleted = false and status = 'approved');
create policy "Guests can view nationwide rankings" on public.nationwide_rankings
  for select to anon using (is_deleted is not true);
create policy "Guests can view competition schedules" on public.schedules
  for select to anon using (type = 'competition' and is_deleted = false);
create policy "Guests can view public notices" on public.notices
  for select to anon using (is_public = true and is_deleted = false);
create policy "Guests can view page descriptions" on public.system_settings
  for select to anon using (key like 'desc\_%');

-- 공개 글(기사·명예의 전당·개발자 소개)에 붙은 사진 파일만 비회원에게 열어 줍니다
create or replace function public.is_public_photo(object_name text)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.news_articles where is_deleted = false and photo_url like '%/photos/' || object_name)
      or exists (select 1 from public.hall_of_fame where is_deleted = false and photo_url like '%/photos/' || object_name)
      or exists (select 1 from public.developers where is_deleted = false and photo_url like '%/photos/' || object_name);
$$;
revoke execute on function public.is_public_photo(text) from public;
grant execute on function public.is_public_photo(text) to anon, authenticated;

create policy "Guests can view public photos" on storage.objects
  for select to anon using (bucket_id = 'photos' and public.is_public_photo(name));
