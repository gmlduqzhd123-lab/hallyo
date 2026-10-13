-- 새 학년도 진급·졸업 (2026-10-13 운영 DB 적용)
-- ✅ 운영 DB 에 적용 완료 (기록용, 내용은 schema.sql 10번에도 반영됨)
--
-- graduated_year: 졸업한 학년도 (비어 있으면 재학생). 졸업생도 지우지 않아 기록은 그대로 남습니다.
-- promote_school_year(target_year): 관리자·개발자만.
--   6학년은 졸업 처리(graduated_year = target_year - 1), 1~5학년은 한 학년씩 올립니다.
--   같은 학년도로 두 번 진급하지 않도록 system_settings 'last_promoted_school_year' 에 기록합니다.

alter table public.athletes add column if not exists graduated_year integer;
grant select (graduated_year) on public.athletes to authenticated;

create or replace function public.promote_school_year(target_year integer)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  last_year integer;
  graduated_count integer;
  promoted_count integer;
begin
  if not public.is_admin_or_developer() then
    raise exception 'Only admins and developers can promote the school year.';
  end if;

  select value::integer into last_year from public.system_settings where key = 'last_promoted_school_year';
  if last_year is not null and last_year >= target_year then
    raise exception '이미 %학년도 진급을 마쳤습니다.', last_year;
  end if;

  update public.athletes set graduated_year = target_year - 1
  where is_deleted = false and graduated_year is null and grade = 6;
  get diagnostics graduated_count = row_count;

  update public.athletes set grade = grade + 1
  where is_deleted = false and graduated_year is null and grade between 1 and 5;
  get diagnostics promoted_count = row_count;

  insert into public.system_settings (key, value, updated_at)
  values ('last_promoted_school_year', target_year::text, now())
  on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at;

  insert into public.audit_logs (user_id, action, target_table, details)
  values (auth.uid(), 'UPDATE', 'athletes', json_build_object(
    'school_year_promotion', target_year, 'promoted', promoted_count, 'graduated', graduated_count)::jsonb);

  return json_build_object('promoted', promoted_count, 'graduated', graduated_count);
end;
$$;

revoke execute on function public.promote_school_year(integer) from public, anon;
grant execute on function public.promote_school_year(integer) to authenticated;
