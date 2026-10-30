-- Smart Tax Solution: certificate verification RPC expected by the student portal.
-- Run this file in Supabase SQL Editor, then reload the schema cache.
drop function if exists public.verify_sts_certificate(text);

create function public.verify_sts_certificate(p_certificate_number text)
returns table(
 certificate_number text,
 student_name text,
 course_title text,
 issued_at timestamptz,
 status text
)
language sql
stable
security definer
set search_path=''
as $$
 select c.certificate_number,
        coalesce(p.full_name,'Student') as student_name,
        co.title as course_title,
        c.issued_at,
        case when c.revoked_at is null then 'VALID' else 'REVOKED' end as status
 from public.certificates c
 join public.profiles p on p.id=c.student_id
 join public.exam_attempts a on a.id=c.attempt_id
 join public.courses co on co.id=a.course_id
 where c.certificate_number=p_certificate_number;
$$;

revoke all on function public.verify_sts_certificate(text) from public;
grant execute on function public.verify_sts_certificate(text) to anon, authenticated;

-- Ask PostgREST/Supabase API to refresh its function schema cache.
notify pgrst, 'reload schema';
