-- Smart Tax Solution Student Portal: Supabase database foundation
-- Run in Supabase SQL Editor after creating a project.
-- Auth users are created by Supabase Auth; never store plaintext passwords.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug in ('gst','income-tax')),
  title text not null,
  description text not null default '',
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  question_text text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) >= 2),
  explanation text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.question_answer_keys (
  question_id uuid primary key references public.questions(id) on delete cascade,
  correct_option integer not null check (correct_option >= 0)
);

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id),
  question_count integer not null check (question_count in (50,100)),
  score integer not null default 0 check (score >= 0),
  percentage numeric(5,2) not null default 0 check (percentage >= 0 and percentage <= 100),
  passed boolean not null default false,
  submitted_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.exam_attempts(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  certificate_number text not null unique,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists questions_course_active_idx on public.questions(course_id, is_active);
create index if not exists attempts_student_date_idx on public.exam_attempts(student_id, submitted_at desc);
create index if not exists certificates_student_idx on public.certificates(student_id);

-- Create a profile automatically for every new Auth user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS: students can only read/update their own profile and read their own records.
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.questions enable row level security;
alter table public.question_answer_keys enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.certificates enable row level security;

drop policy if exists "profile read own" on public.profiles;
create policy "profile read own" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "profile update own" on public.profiles;
create policy "profile update own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "published courses visible" on public.courses;
create policy "published courses visible" on public.courses for select to authenticated using (is_published = true);
drop policy if exists "active questions visible" on public.questions;
create policy "active questions visible" on public.questions for select to authenticated using (is_active = true and exists (select 1 from public.courses c where c.id = course_id and c.is_published = true));

drop policy if exists "student reads own attempts" on public.exam_attempts;
create policy "student reads own attempts" on public.exam_attempts for select to authenticated using (student_id = (select auth.uid()));
drop policy if exists "student reads own certificates" on public.certificates;
create policy "student reads own certificates" on public.certificates for select to authenticated using (student_id = (select auth.uid()));

-- No client policies for answer keys: students must never read correct answers directly.\n-- Intentionally no client insert/update policies for scores/certificates:
-- exam grading and certificate issuance must be done by trusted server-side logic,
-- not by browser JavaScript. Admin policies and secure RPC/functions must be added
-- after the first admin account is provisioned.
