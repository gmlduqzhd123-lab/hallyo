-- 승인된 사용자만 자료를 쓰고 지울 수 있게 (2026-10-13 운영 DB 적용)
--
-- 1) 가입: 일반 역할(선수·지도자·학부모·일반인)로만, 승인 대기 상태로만
-- 2) 쓰기(추가·수정·삭제) 권한 규칙 전부에 "승인된 사용자" 조건 추가
-- 3) 사진·영상 승인 상태는 DB 트리거로 강제
--    (일반 회원이 올리면 무조건 pending, 승인 권한이 없으면 상태 변경 불가)
-- 4) 사진 파일 저장소: 올리기는 승인된 사용자, 수정·삭제는 본인 또는 관리자·개발자
-- 5) 성능: auth.uid()·권한 함수를 (select …) 로 감싸 행마다 다시 계산하지 않게, 외래키 색인 추가

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
