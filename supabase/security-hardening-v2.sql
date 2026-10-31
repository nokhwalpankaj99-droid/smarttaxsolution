-- Smart Tax Solution: security hardening v2
-- Run in Supabase Dashboard > SQL Editor as project owner (postgres).
-- This migration is designed to be run AFTER schema.sql, admin-setup.sql,
-- and payment-approval-gate.sql. It does not require a service-role key in the website.

begin;

-- 1) Ensure row-level security is enabled on all sensitive tables.
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.questions enable row level security;
alter table public.question_answer_keys enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.certificates enable row level security;

create table if not exists public.course_payments (
 id uuid primary key default gen_random_uuid(),
 student_id uuid not null references public.profiles(id) on delete cascade,
 course_slug text not null check (course_slug in ('gst','income-tax','combo')),
 amount_inr integer not null check (amount_inr in (999,1499)),
 upi_transaction_id text not null,
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id),
 unique(student_id,upi_transaction_id)
);
alter table public.course_payments enable row level security;

-- 2) Admin check is evaluated on the server from the database role, never browser input.
create or replace function public.sts_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
 select exists (
   select 1 from public.profiles p
   where p.id = (select auth.uid()) and p.role = 'admin'
 );
$$;
revoke all on function public.sts_is_admin() from public;
grant execute on function public.sts_is_admin() to authenticated;

-- 3) Protect role changes. A project-owner SQL migration can provision the first admin;
-- an ordinary student cannot promote themselves. Existing admins can manage admin roles.
create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
 if new.role is distinct from old.role
    and session_user not in ('postgres','service_role')
    and not public.sts_is_admin() then
   raise exception 'Only an authorized administrator can change a profile role';
 end if;
 return new;
end;
$$;
drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

-- 4) Replace sensitive-table policies with explicit least-privilege rules.
drop policy if exists "profile read own" on public.profiles;
drop policy if exists "profile update own" on public.profiles;
drop policy if exists "profiles own or admin read" on public.profiles;
drop policy if exists "profiles own update" on public.profiles;
drop policy if exists "admin manage profiles" on public.profiles;
create policy "profiles own or admin read" on public.profiles
 for select to authenticated using (id = (select auth.uid()) or public.sts_is_admin());
create policy "profiles own update" on public.profiles
 for update to authenticated using (id = (select auth.uid()))
 with check (id = (select auth.uid()) and role = 'student');
create policy "admin manage profiles" on public.profiles
 for all to authenticated using (public.sts_is_admin()) with check (public.sts_is_admin());

drop policy if exists "published courses visible" on public.courses;
drop policy if exists "published courses or admin read" on public.courses;
drop policy if exists "admin manage courses" on public.courses;
create policy "published courses or admin read" on public.courses
 for select to authenticated using (is_published = true or public.sts_is_admin());
create policy "admin manage courses" on public.courses
 for all to authenticated using (public.sts_is_admin()) with check (public.sts_is_admin());

drop policy if exists "active questions visible" on public.questions;
drop policy if exists "active published questions visible" on public.questions;
drop policy if exists "admin manage questions" on public.questions;
create policy "active published questions visible" on public.questions
 for select to authenticated using (
   is_active = true and exists (
     select 1 from public.courses c where c.id = course_id and c.is_published = true
   )
 );
create policy "admin manage questions" on public.questions
 for all to authenticated using (public.sts_is_admin()) with check (public.sts_is_admin());

drop policy if exists "answer keys visible" on public.question_answer_keys;
drop policy if exists "admin manage answer keys" on public.question_answer_keys;
create policy "admin manage answer keys" on public.question_answer_keys
 for all to authenticated using (public.sts_is_admin()) with check (public.sts_is_admin());

drop policy if exists "student reads own attempts" on public.exam_attempts;
drop policy if exists "student or admin read attempts" on public.exam_attempts;
drop policy if exists "admin manage attempts" on public.exam_attempts;
create policy "student or admin read attempts" on public.exam_attempts
 for select to authenticated using (student_id = (select auth.uid()) or public.sts_is_admin());
create policy "admin manage attempts" on public.exam_attempts
 for all to authenticated using (public.sts_is_admin()) with check (public.sts_is_admin());

drop policy if exists "student reads own certificates" on public.certificates;
drop policy if exists "student or admin read certificates" on public.certificates;
drop policy if exists "admin manage certificates" on public.certificates;
create policy "student or admin read certificates" on public.certificates
 for select to authenticated using (student_id = (select auth.uid()) or public.sts_is_admin());
create policy "admin manage certificates" on public.certificates
 for all to authenticated using (public.sts_is_admin()) with check (public.sts_is_admin());

drop policy if exists "student read own payments" on public.course_payments;
drop policy if exists "student submit own payment" on public.course_payments;
drop policy if exists "admin read payments" on public.course_payments;
drop policy if exists "admin manage payments" on public.course_payments;
create policy "student read own payments" on public.course_payments
 for select to authenticated using (student_id = (select auth.uid()) or public.sts_is_admin());
create policy "student submit own payment" on public.course_payments
 for insert to authenticated with check (
   student_id = (select auth.uid()) and status = 'pending'
   and reviewed_at is null and reviewed_by is null
 );
create policy "admin manage payments" on public.course_payments
 for all to authenticated using (public.sts_is_admin()) with check (public.sts_is_admin());

-- Do not allow anonymous access to private records or answer keys.
revoke all on public.profiles, public.courses, public.questions, public.exam_attempts,
 public.certificates, public.question_answer_keys, public.course_payments from anon;
revoke all on public.profiles, public.courses, public.questions,
 public.question_answer_keys, public.exam_attempts, public.certificates,
 public.course_payments from public;
grant select, update on public.profiles to authenticated;
grant select on public.courses, public.questions, public.exam_attempts, public.certificates to authenticated;
grant select, insert, update on public.course_payments to authenticated;
grant select, insert, update, delete on public.question_answer_keys to authenticated;
grant select, insert, update, delete on public.courses, public.questions, public.profiles,
 public.exam_attempts, public.certificates to authenticated;

-- 5) Payment review is a server-side action. Students cannot approve their own payments.
create or replace function public.review_sts_payment(p_payment_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
 if not public.sts_is_admin() then raise exception 'Administrator access required'; end if;
 update public.course_payments
 set status = case when p_approve then 'approved' else 'rejected' end,
     reviewed_at = now(), reviewed_by = auth.uid()
 where id = p_payment_id and status = 'pending';
 if not found then raise exception 'Payment not found or already reviewed'; end if;
end;
$$;
revoke all on function public.review_sts_payment(uuid,boolean) from public;
grant execute on function public.review_sts_payment(uuid,boolean) to authenticated;

-- 6) Reinstall the payment-gated exam RPC. This is important if admin-setup.sql
-- was run after payment-approval-gate.sql: that older script replaced this function
-- without checking payment approval.
create or replace function public.submit_sts_exam(p_course_slug text,p_question_count integer,p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
 v_uid uuid := auth.uid();
 v_course public.courses%rowtype;
 v_total integer;
 v_score integer;
 v_pct numeric(5,2);
 v_passed boolean;
 v_attempt uuid;
 v_cert text;
 v_paid boolean;
begin
 if v_uid is null then raise exception 'Please sign in first'; end if;
 if p_question_count not in (50,100) then raise exception 'Exam must contain 50 or 100 questions'; end if;
 if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) <> p_question_count then
   raise exception 'Answer count does not match exam length';
 end if;
 select * into v_course from public.courses where slug = p_course_slug and is_published = true;
 if not found then raise exception 'Course is not published'; end if;
 select exists(
   select 1 from public.course_payments p
   where p.student_id = v_uid and p.status = 'approved'
     and p.course_slug in (p_course_slug,'combo')
 ) into v_paid;
 if not v_paid then raise exception 'Payment is not approved for this course'; end if;
 if (select count(distinct value->>'question_id') from jsonb_array_elements(p_answers)) <> p_question_count then
   raise exception 'Duplicate question detected';
 end if;
 select count(*),
        count(*) filter(where ak.correct_option = (ans.value->>'selected_option')::integer)
 into v_total, v_score
 from jsonb_array_elements(p_answers) ans(value)
 join public.questions q on q.id = (ans.value->>'question_id')::uuid
   and q.course_id = v_course.id and q.is_active = true
 join public.question_answer_keys ak on ak.question_id = q.id;
 if v_total <> p_question_count then raise exception 'Some questions are invalid or not active'; end if;
 v_pct := round(v_score::numeric * 100 / v_total, 2);
 v_passed := v_pct >= 60;
 insert into public.exam_attempts(student_id,course_id,question_count,score,percentage,passed)
 values(v_uid,v_course.id,v_total,v_score,v_pct,v_passed) returning id into v_attempt;
 if v_passed then
   v_cert := 'STS-' || to_char(now() at time zone 'utc','YYYY') || '-' ||
     upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
   insert into public.certificates(attempt_id,student_id,certificate_number)
   values(v_attempt,v_uid,v_cert);
 end if;
 return jsonb_build_object('attempt_id',v_attempt,'score',v_score,'total',v_total,
   'percentage',v_pct,'passed',v_passed,'certificate_number',v_cert);
end;
$$;
revoke all on function public.submit_sts_exam(text,integer,jsonb) from public;
grant execute on function public.submit_sts_exam(text,integer,jsonb) to authenticated;

notify pgrst, 'reload schema';
commit;
