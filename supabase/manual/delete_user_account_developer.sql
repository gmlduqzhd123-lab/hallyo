-- 회원 삭제 함수: 개발자만 실행 가능 + 삭제가 실패하던 문제 수정
--
-- ✅ 2026-10-13 운영 DB 에 적용 완료. (기록용 — 다시 실행할 필요 없음, 내용은 schema.sql 에도 반영됨)
--
-- 바뀌는 점
-- 1) 실행 권한: admin → 승인된 developer 만
-- 2) 공지·일정·상담 일지의 작성자(created_by)는 비울 수 없는 컬럼이라
--    기존 함수는 이 기록이 있는 회원을 지우지 못했습니다.
--    → 작성자를 삭제를 실행한 개발자로 넘깁니다.
-- 3) 사진·영상·연혁·기사·명예의 전당·개발 노트의 작성자는 비웁니다.
--    (로그인 계정 auth.users 를 참조하고 있어 그대로 두면 삭제가 실패합니다)
-- 4) search_path 고정

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

revoke execute on function public.delete_user_account(uuid) from public, anon;
grant execute on function public.delete_user_account(uuid) to authenticated;
