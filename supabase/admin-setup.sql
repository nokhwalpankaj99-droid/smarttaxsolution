-- Smart Tax Solution admin + exam/certificate security patch.
-- Run in Supabase Dashboard > SQL Editor as project owner.
-- Replace the email below with the exact email of your intended admin account.
create extension if not exists pgcrypto;

-- Ensure baseline tables exist from supabase/schema.sql before running this patch.
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.questions enable row level security;
alter table public.question_answer_keys enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.certificates enable row level security;

-- Provision only this explicitly named existing Auth account as admin.
update public.profiles p set role='admin'
from auth.users u
where p.id=u.id and lower(u.email)=lower('nokhwalpankaj99@gmail.com');

-- Helper checks the authenticated account's database role; clients cannot assign their own role.
create or replace function public.sts_is_admin()
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin') $$;
revoke all on function public.sts_is_admin() from public;
grant execute on function public.sts_is_admin() to authenticated;

-- Remove potentially unsafe earlier broad policies and replace with explicit policies.
drop policy if exists "profile read own" on public.profiles;
drop policy if exists "profile update own" on public.profiles;
create policy "profiles own or admin read" on public.profiles for select to authenticated using (id=(select auth.uid()) or public.sts_is_admin());
create policy "profiles own update" on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()) and role='student');
create policy "admin manage profiles" on public.profiles for all to authenticated using (public.sts_is_admin()) with check (public.sts_is_admin());

drop policy if exists "published courses visible" on public.courses;
drop policy if exists "admin manage courses" on public.courses;
create policy "published courses or admin read" on public.courses for select to authenticated using (is_published=true or public.sts_is_admin());
create policy "admin manage courses" on public.courses for all to authenticated using (public.sts_is_admin()) with check (public.sts_is_admin());

drop policy if exists "active questions visible" on public.questions;
drop policy if exists "admin manage questions" on public.questions;
create policy "active published questions visible" on public.questions for select to authenticated using (is_active=true and exists(select 1 from public.courses c where c.id=course_id and c.is_published=true));
create policy "admin manage questions" on public.questions for all to authenticated using (public.sts_is_admin()) with check (public.sts_is_admin());

drop policy if exists "admin manage answer keys" on public.question_answer_keys;
create policy "admin manage answer keys" on public.question_answer_keys for all to authenticated using (public.sts_is_admin()) with check (public.sts_is_admin());
revoke all on public.question_answer_keys from anon, authenticated;
grant select,insert,update,delete on public.question_answer_keys to authenticated;
-- RLS still restricts answer-key table to admins.

drop policy if exists "student reads own attempts" on public.exam_attempts;
drop policy if exists "admin read attempts" on public.exam_attempts;
create policy "student or admin read attempts" on public.exam_attempts for select to authenticated using (student_id=(select auth.uid()) or public.sts_is_admin());
create policy "admin manage attempts" on public.exam_attempts for all to authenticated using (public.sts_is_admin()) with check (public.sts_is_admin());

drop policy if exists "student reads own certificates" on public.certificates;
drop policy if exists "admin manage certificates" on public.certificates;
create policy "student or admin read certificates" on public.certificates for select to authenticated using (student_id=(select auth.uid()) or public.sts_is_admin());
create policy "admin manage certificates" on public.certificates for all to authenticated using (public.sts_is_admin()) with check (public.sts_is_admin());

-- Public verification reveals only certificate number, course, name and status; no private account data.
create or replace function public.verify_sts_certificate(p_number text)
returns table(certificate_number text, student_name text, course_title text, issued_at timestamptz, status text)
language sql stable security definer set search_path=''
as $$
 select c.certificate_number, coalesce(p.full_name,'Student'), co.title, c.issued_at,
 case when c.revoked_at is null then 'VALID' else 'REVOKED' end
 from public.certificates c join public.profiles p on p.id=c.student_id
 join public.exam_attempts a on a.id=c.attempt_id join public.courses co on co.id=a.course_id
 where c.certificate_number=p_number
$$;
revoke all on function public.verify_sts_certificate(text) from public;
grant execute on function public.verify_sts_certificate(text) to anon, authenticated;

-- Server-side grading. Correct answers are never sent to browser; 60% passing rule and certificate issuance are enforced here.
create or replace function public.submit_sts_exam(p_course_slug text,p_question_count integer,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_course public.courses%rowtype; v_total integer; v_score integer; v_pct numeric(5,2); v_passed boolean; v_attempt uuid; v_cert text;
begin
 if v_uid is null then raise exception 'Please sign in first'; end if;
 if p_question_count not in (50,100) then raise exception 'Exam must contain 50 or 100 questions'; end if;
 if jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)<>p_question_count then raise exception 'Answer count does not match exam length'; end if;
 select * into v_course from public.courses where slug=p_course_slug and is_published=true;
 if not found then raise exception 'Course is not published'; end if;
 select count(*), count(*) filter(where ak.correct_option=(ans.value->>'selected_option')::integer)
 into v_total,v_score
 from jsonb_array_elements(p_answers) ans(value)
 join public.questions q on q.id=(ans.value->>'question_id')::uuid and q.course_id=v_course.id and q.is_active=true
 join public.question_answer_keys ak on ak.question_id=q.id;
 if v_total<>p_question_count then raise exception 'Some questions are invalid or not active'; end if;
 if (select count(distinct value->>'question_id') from jsonb_array_elements(p_answers))<>p_question_count then raise exception 'Duplicate question detected'; end if;
 v_pct:=round(v_score::numeric*100/v_total,2);v_passed:=v_pct>=60;
 insert into public.exam_attempts(student_id,course_id,question_count,score,percentage,passed) values(v_uid,v_course.id,v_total,v_score,v_pct,v_passed) returning id into v_attempt;
 if v_passed then
  v_cert:='STS-'||to_char(now() at time zone 'utc','YYYY')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
  insert into public.certificates(attempt_id,student_id,certificate_number) values(v_attempt,v_uid,v_cert);
 end if;
 return jsonb_build_object('attempt_id',v_attempt,'score',v_score,'total',v_total,'percentage',v_pct,'passed',v_passed,'certificate_number',v_cert);
end; $$;
revoke all on function public.submit_sts_exam(text,integer,jsonb) from public;
grant execute on function public.submit_sts_exam(text,integer,jsonb) to authenticated;
