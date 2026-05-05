-- Hallyoswim Supabase Database Schema

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('admin', 'coach', 'athlete');
CREATE TYPE user_status AS ENUM ('pending', 'approved');
CREATE TYPE gender_type AS ENUM ('M', 'F');

-- 2. Create Tables

-- Users table (Extends Supabase Auth if needed, or standalone for app logic)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Or references auth.users(id) if integrated
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'athlete',
  status user_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Athletes table (Soft delete supported)
CREATE TABLE public.athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gender gender_type NOT NULL,
  grade INTEGER NOT NULL CHECK (grade > 0 AND grade <= 6),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Records table (Soft delete supported)
CREATE TABLE public.records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id),
  event_name TEXT NOT NULL,
  record_time NUMERIC(10, 2) NOT NULL,
  record_date DATE NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Audit Logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Schedules table (Training and Competitions)
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('training', 'competition')),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  location TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Counseling Logs table
CREATE TABLE public.counseling_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id),
  date DATE NOT NULL,
  summary TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Notices table
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Row Level Security (RLS) Configuration

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Helper function to check if the requesting user is approved
-- Assuming `auth.uid()` corresponds to `users.id`
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND status = 'approved'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if the requesting user is an admin or coach
CREATE OR REPLACE FUNCTION public.is_admin_or_coach()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND status = 'approved' AND role IN ('admin', 'coach')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Users Table Policies
-- Everyone can read approved users. (Or only approved users can read users)
CREATE POLICY "Approved users can view users" ON public.users
  FOR SELECT USING (public.is_approved_user());

-- Users can insert their own pending record (during signup)
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Only admins/coaches can update user roles/status
CREATE POLICY "Admins and coaches can update users" ON public.users
  FOR UPDATE USING (public.is_admin_or_coach());

-- Athletes Table Policies
CREATE POLICY "Approved users can view athletes" ON public.athletes
  FOR SELECT USING (public.is_approved_user());

CREATE POLICY "Admins and coaches can insert athletes" ON public.athletes
  FOR INSERT WITH CHECK (public.is_admin_or_coach());

CREATE POLICY "Admins and coaches can update/soft-delete athletes" ON public.athletes
  FOR UPDATE USING (public.is_admin_or_coach());

-- Records Table Policies
CREATE POLICY "Approved users can view records" ON public.records
  FOR SELECT USING (public.is_approved_user());

CREATE POLICY "Admins and coaches can insert records" ON public.records
  FOR INSERT WITH CHECK (public.is_admin_or_coach());

CREATE POLICY "Admins and coaches can update/soft-delete records" ON public.records
  FOR UPDATE USING (public.is_admin_or_coach());

-- Audit Logs Table Policies
CREATE POLICY "Admins and coaches can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin_or_coach());

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_approved_user()); -- Could be refined further

-- 4. Triggers for updated_at (Optional but good practice)
-- Omitted here as per PRD which only asks for Soft Delete and created_at.

-- Schedules Table Policies
CREATE POLICY "Approved users can view schedules" ON public.schedules
  FOR SELECT USING (public.is_approved_user());

CREATE POLICY "Admins and coaches can insert schedules" ON public.schedules
  FOR INSERT WITH CHECK (public.is_admin_or_coach());

CREATE POLICY "Admins and coaches can update/soft-delete schedules" ON public.schedules
  FOR UPDATE USING (public.is_admin_or_coach());

-- Counseling Logs Table Policies
CREATE POLICY "Approved users can view counseling logs" ON public.counseling_logs
  FOR SELECT USING (public.is_approved_user());

CREATE POLICY "Admins and coaches can insert counseling logs" ON public.counseling_logs
  FOR INSERT WITH CHECK (public.is_admin_or_coach());

CREATE POLICY "Admins and coaches can update/soft-delete counseling logs" ON public.counseling_logs
  FOR UPDATE USING (public.is_admin_or_coach());

-- Notices Table Policies
CREATE POLICY "Approved users can view notices" ON public.notices
  FOR SELECT USING (public.is_approved_user());

CREATE POLICY "Admins and coaches can insert notices" ON public.notices
  FOR INSERT WITH CHECK (public.is_admin_or_coach());

CREATE POLICY "Admins and coaches can update/soft-delete notices" ON public.notices
  FOR UPDATE USING (public.is_admin_or_coach());
