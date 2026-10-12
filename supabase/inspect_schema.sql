-- =====================================================================
-- 운영 DB 구조 확인용 쿼리 (읽기 전용 — 데이터를 바꾸지 않습니다)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 하나씩 실행하세요.
-- 결과를 schema.sql 과 비교해 다른 부분이 있으면 schema.sql 을 고칩니다.
-- =====================================================================

-- 1) 테이블별 컬럼 목록
SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 2) enum 값 (user_role 등)
SELECT t.typname AS enum_name, e.enumlabel AS value
FROM pg_type t
JOIN pg_enum e ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- 3) 외래키 (제약 이름 포함)
SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace AND contype IN ('f', 'c', 'u')
ORDER BY conrelid::regclass::text, conname;

-- 4) RLS 정책
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY tablename, policyname;

-- 5) 함수 본문 (delete_user_account, reset_user_password, is_approved_user 등)
SELECT p.proname, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
ORDER BY p.proname;
