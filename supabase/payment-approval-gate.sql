-- Smart Tax Solution: UPI payment approval gate.
-- Run this migration in Supabase SQL Editor BEFORE enabling the updated student portal.
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
drop policy if exists "student read own payments" on public.course_payments;
create policy "student read own payments" on public.course_payments for select to authenticated using(student_id=(select auth.uid()) or public.sts_is_admin());
drop policy if exists "student submit own payment" on public.course_payments;
create policy "student submit own payment" on public.course_payments for insert to authenticated with check(student_id=(select auth.uid()) and status='pending' and reviewed_at is null and reviewed_by is null);
drop policy if exists "admin read payments" on public.course_payments;
create policy "admin read payments" on public.course_payments for all to authenticated using(public.sts_is_admin()) with check(public.sts_is_admin());
grant select,insert on public.course_payments to authenticated;
grant update on public.course_payments to authenticated;

create or replace function public.review_sts_payment(p_payment_id uuid,p_approve boolean)
returns void language plpgsql security definer set search_path=''
as $$
begin
 if not public.sts_is_admin() then raise exception 'Administrator access required'; end if;
 update public.course_payments
 set status=case when p_approve then 'approved' else 'rejected' end,
     reviewed_at=now(), reviewed_by=auth.uid()
 where id=p_payment_id and status='pending';
 if not found then raise exception 'Payment not found or already reviewed'; end if;
end; $$;
revoke all on function public.review_sts_payment(uuid,boolean) from public;
grant execute on function public.review_sts_payment(uuid,boolean) to authenticated;

-- Replace the grading RPC: a passed exam only creates a certificate when an approved
-- course payment or approved combo payment exists for this student.
create or replace function public.submit_sts_exam(p_course_slug text,p_question_count integer,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_uid uuid:=auth.uid(); v_course public.courses%rowtype; v_total integer; v_score integer; v_pct numeric(5,2); v_passed boolean; v_attempt uuid; v_cert text; v_paid boolean;
begin
 if v_uid is null then raise exception 'Please sign in first'; end if;
 if p_question_count not in (50,100) then raise exception 'Exam must contain 50 or 100 questions'; end if;
 if jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)<>p_question_count then raise exception 'Answer count does not match exam length'; end if;
 select * into v_course from public.courses where slug=p_course_slug and is_published=true;
 if not found then raise exception 'Course is not published'; end if;
 select exists(select 1 from public.course_payments p where p.student_id=v_uid and p.status='approved' and p.course_slug in (p_course_slug,'combo')) into v_paid;
 if not v_paid then raise exception 'Payment is not approved yet. Submit your UPI transaction ID and wait for administrator confirmation before taking the certification exam.'; end if;
 select count(*),count(*) filter(where ak.correct_option=(ans.value->>'selected_option')::integer)
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
notify pgrst,'reload schema';
