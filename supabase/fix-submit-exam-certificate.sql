-- Smart Tax Solution: patch exam submission certificate ID generation.
-- Run once in Supabase SQL Editor. Replaces the RPC with the same grading logic,
-- but uses built-in gen_random_uuid() instead of gen_random_bytes().

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
 v_pct:=round(v_score::numeric*100/v_total,2); v_passed:=v_pct>=60;
 insert into public.exam_attempts(student_id,course_id,question_count,score,percentage,passed)
 values(v_uid,v_course.id,v_total,v_score,v_pct,v_passed) returning id into v_attempt;
 if v_passed then
  v_cert:='STS-'||to_char(now() at time zone 'utc','YYYY')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
  insert into public.certificates(attempt_id,student_id,certificate_number) values(v_attempt,v_uid,v_cert);
 end if;
 return jsonb_build_object('attempt_id',v_attempt,'score',v_score,'total',v_total,'percentage',v_pct,'passed',v_passed,'certificate_number',v_cert);
end;
$$;
revoke all on function public.submit_sts_exam(text,integer,jsonb) from public;
grant execute on function public.submit_sts_exam(text,integer,jsonb) to authenticated;
