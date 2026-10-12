-- 기록 분석 문구를 관리자·개발자가 화면에서 고칠 수 있게 (2026-10-13 운영 DB 적용)
-- ✅ 운영 DB 에 적용 완료 (기록용, 내용은 schema.sql 9번에도 반영됨)
--
-- 선수별로 "집중 훈련 영역"과 "코칭 어드바이스"를 저장합니다.
-- 저장된 문구가 없으면 기록 분석 화면이 전국 기록과 비교해 자동 문구를 보여 줍니다.
-- 예전에 코드에 고정돼 있던 선수별 문구(제55회 소년체전 기준)는 그대로 옮겨 두었습니다.

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

insert into public.athlete_advice (athlete_id, focus_area, advice)
select a.id, v.focus_area, v.advice
from (values
  ('하수빈', '기초 체력 강화 및 수영 흥미 유지',
   '올해 제55회 전국소년체육대회에는 참가하지 않습니다. 다음 시즌을 대비하여 장기적인 관점에서 수영에 대한 흥미를 유지하고 기초 체력을 탄탄히 다지는 데 집중하세요.'),
  ('서은률', '결선 진출을 위한 레이스 페이스 유지 및 턴 디테일 강화',
   '제55회 전국소년체육대회에서 메달권 진입은 현실적으로 어렵지만, 본선(결선) 진출이라는 뚜렷한 목표를 향해 나아가야 합니다. 턴과 브레이크아웃 구간에서의 디테일을 다듬고 지속적인 페이스 유지 훈련에 집중하세요.'),
  ('임소은', '혼계영 평영 집중 훈련 및 결선 진출을 위한 기록 단축',
   '제55회 전국소년체육대회 개인전 메달권 진입은 쉽지 않으나, 결선 진출을 목표로 페이스를 끌어올려야 합니다. 특히 혼계영의 평영 영자로서 팀의 성적에 기여할 수 있는 중요한 역할을 맡고 있으므로, 평영 영법의 효율성과 파워를 극대화하는 훈련에 승부를 거세요.'),
  ('임지율', '전국소년체전 금메달 획득을 위한 미세 기술 교정 및 후반 스퍼트 극대화',
   '현재 기량은 제55회 전국소년체육대회에서 충분히 금메달을 노려볼 수 있는 압도적인 수준입니다! 자유형 100M와 200M 종목에 집중하여, 스타트 반응속도를 미세하게 단축하고 후반 스퍼트에서의 폭발력을 극대화하여 금메달 획득의 쐐기를 박으세요.'),
  ('김루아', '전국소년체전 동메달 획득을 위한 초반 스피드 강화 및 실전 멘탈 훈련',
   '현재 기량 발전 속도라면 제55회 전국소년체육대회에서 충분히 동메달을 노려볼 수 있는 수준입니다. 메달권 진입을 위해 경쟁자들을 따돌릴 수 있는 스타트와 초반 50M 구간의 스피드를 끌어올리고, 실전과 같은 멘탈 훈련을 병행하세요.'),
  ('신지유', '자유형 200M 결선 진출을 위한 지구력 및 페이스 배분 훈련',
   '제55회 전국소년체육대회에서는 주 종목인 자유형 50M에 출전하지 않습니다. 대신 자유형 200M 종목에 집중하여 결선 진출을 목표로 삼아야 합니다. 단거리 스피드 위주의 훈련에서 벗어나, 200M 레이스 운영을 위한 지구력과 철저한 페이스 배분 훈련으로 전환하세요.')
) as v(name, focus_area, advice)
join public.athletes a on a.name = v.name and a.is_deleted = false
on conflict (athlete_id) do nothing;
