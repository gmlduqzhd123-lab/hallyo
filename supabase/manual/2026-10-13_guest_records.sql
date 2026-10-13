-- 비회원 둘러보기: 우리 선수 기록·기록 분석·라이벌 비교 공개 (2026-10-13 운영 DB 적용)
-- ✅ 운영 DB 에 적용 완료 (기록용, 내용은 schema.sql 12번에도 반영됨)
--
-- 비회원(anon)에게 열리는 선수 정보는 이름·성별·학년·졸업 학년도뿐입니다.
-- 생년월일·반·번호·담임·한자 이름·연락처 등은 컬럼 권한으로 계속 막습니다.
-- 지도자가 고친 분석 문구(athlete_advice)는 회원 전용으로 두고, 비회원에게는 자동 문구가 보입니다.

grant select (id, name, gender, grade, graduated_year, is_deleted, created_at) on public.athletes to anon;
create policy "Guests can view athlete names" on public.athletes
  for select to anon using (is_deleted = false);

create policy "Guests can view records" on public.records
  for select to anon using (is_deleted = false);
