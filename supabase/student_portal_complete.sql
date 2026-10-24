-- Smart Tax Solution Student Portal: complete secure exam and admin migration
-- Run schema.sql first, then this file in Supabase SQL Editor.
-- Never expose the Supabase secret/service-role key in browser code.

create extension if not exists pgcrypto;

-- Profile creation is automatic; students cannot promote themselves to admin.
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Only an authorized administrator can change profile role';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role before update on public.profiles
for each row execute function public.guard_profile_role();

-- Optional course lessons, managed by admins.
create table if not exists public.lessons (
 id uuid primary key default gen_random_uuid(),
 course_id uuid not null references public.courses(id) on delete cascade,
 title text not null,
 body text not null default '',
 sort_order integer not null default 0,
 is_published boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.lessons enable row level security;

-- Admin helper checks trusted profile role. Clients cannot write profile role.
create or replace function public.is_sts_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
 select exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
$$;
revoke all on function public.is_sts_admin() from public;
grant execute on function public.is_sts_admin() to authenticated;

drop policy if exists "admin manages profiles" on public.profiles;
create policy "admin manages profiles" on public.profiles for select to authenticated using (public.is_sts_admin() or id = auth.uid());
drop policy if exists "admin manages courses" on public.courses;
create policy "admin manages courses" on public.courses for all to authenticated using (public.is_sts_admin()) with check (public.is_sts_admin());
drop policy if exists "admin manages questions" on public.questions;
create policy "admin manages questions" on public.questions for all to authenticated using (public.is_sts_admin()) with check (public.is_sts_admin());
drop policy if exists "admin manages answer keys" on public.question_answer_keys;
create policy "admin manages answer keys" on public.question_answer_keys for all to authenticated using (public.is_sts_admin()) with check (public.is_sts_admin());
drop policy if exists "admin manages lessons" on public.lessons;
create policy "admin manages lessons" on public.lessons for all to authenticated using (public.is_sts_admin()) with check (public.is_sts_admin());
drop policy if exists "published lessons visible" on public.lessons;
create policy "published lessons visible" on public.lessons for select to authenticated using (is_published and exists(select 1 from public.courses c where c.id=course_id and c.is_published));

drop policy if exists "admin manages attempts" on public.exam_attempts;
create policy "admin manages attempts" on public.exam_attempts for select to authenticated using (public.is_sts_admin() or student_id=auth.uid());
drop policy if exists "admin manages certificates" on public.certificates;
create policy "admin manages certificates" on public.certificates for select to authenticated using (public.is_sts_admin() or student_id=auth.uid());

-- Grading is performed in the database; answer keys are never returned to the browser.
create or replace function public.submit_sts_exam(p_course_slug text, p_question_count integer, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
 v_user uuid := auth.uid();
 v_course uuid;
 v_total integer;
 v_correct integer := 0;
 v_passed boolean;
 v_attempt uuid;
 v_certificate text;
 v_item jsonb;
 v_qid uuid;
 v_choice integer;
 v_right integer;
 v_percent numeric(5,2);
begin
 if v_user is null then raise exception 'Sign in required'; end if;
 if p_question_count not in (50,100) then raise exception 'Question count must be 50 or 100'; end if;
 if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) <> p_question_count then
   raise exception 'Submit exactly the selected number of answers';
 end if;
 select id into v_course from public.courses where slug=p_course_slug and is_published=true;
 if v_course is null then raise exception 'Course is not available'; end if;
 select count(*) into v_total from public.questions q where q.course_id=v_course and q.is_active=true;
 if v_total < p_question_count then raise exception 'This course does not yet have enough approved questions'; end if;
 for v_item in select value from jsonb_array_elements(p_answers) loop
   v_qid := (v_item->>'question_id')::uuid;
   v_choice := (v_item->>'selected_option')::integer;
   if exists(select 1 from public.questions q where q.id=v_qid and q.course_id=v_course and q.is_active=true)
      and not exists(select 1 from jsonb_array_elements(p_answers) a where a.value->>'question_id'=v_qid::text group by a.value->>'question_id' having count(*)>1) then
     select correct_option into v_right from public.question_answer_keys where question_id=v_qid;
     if v_right is not null and v_choice=v_right then v_correct:=v_correct+1; end if;
   else
     raise exception 'Invalid or duplicate question in submission';
   end if;
 end loop;
 v_percent := round((v_correct::numeric / p_question_count)*100,2);
 v_passed := v_percent >= 60;
 insert into public.exam_attempts(student_id,course_id,question_count,score,percentage,passed)
 values(v_user,v_course,p_question_count,v_correct,v_percent,v_passed) returning id into v_attempt;
 if v_passed then
   v_certificate := 'STS-'||to_char(now(),'YYYY')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
   insert into public.certificates(attempt_id,student_id,certificate_number)
   values(v_attempt,v_user,v_certificate);
 end if;
 return jsonb_build_object('attempt_id',v_attempt,'score',v_correct,'total',p_question_count,'percentage',v_percent,'passed',v_passed,'certificate_number',v_certificate);
end;
$$;
revoke all on function public.submit_sts_exam(text,integer,jsonb) from public;
grant execute on function public.submit_sts_exam(text,integer,jsonb) to authenticated;

-- Public certificate verification exposes only validity and course/student display name.
create or replace function public.verify_sts_certificate(p_certificate_number text)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare v_result jsonb;
begin
 select jsonb_build_object(
   'valid', (c.revoked_at is null),
   'certificate_number',c.certificate_number,
   'student_name',coalesce(p.full_name,'Student'),
   'course',co.title,
   'issued_at',c.issued_at,
   'percentage',a.percentage
 ) into v_result
 from public.certificates c
 join public.exam_attempts a on a.id=c.attempt_id
 join public.courses co on co.id=a.course_id
 join public.profiles p on p.id=c.student_id
 where c.certificate_number=trim(p_certificate_number);
 return coalesce(v_result,jsonb_build_object('valid',false,'message','Certificate not found'));
end;
$$;
revoke all on function public.verify_sts_certificate(text) from public;
grant execute on function public.verify_sts_certificate(text) to anon, authenticated;

insert into public.courses(slug,title,description,is_published) values
 ('gst','GST Practical Learning','GST registration, invoices, returns and input tax credit basics.',false),
 ('income-tax','Income Tax Learning','Income tax basics, TDS concepts and return-filing workflows.',false)
on conflict(slug) do nothing;
