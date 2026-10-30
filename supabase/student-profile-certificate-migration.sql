-- Smart Tax Solution student profile and certificate verification migration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS father_name text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mother_name text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, father_name, mother_name, address)
  VALUES (new.id,
          coalesce(new.raw_user_meta_data ->> 'full_name', ''),
          nullif(new.raw_user_meta_data ->> 'phone', ''),
          coalesce(new.raw_user_meta_data ->> 'father_name', ''),
          coalesce(new.raw_user_meta_data ->> 'mother_name', ''),
          coalesce(new.raw_user_meta_data ->> 'address', ''));
  RETURN new;
END;
$$;

DROP FUNCTION IF EXISTS public.verify_sts_certificate(text);
CREATE FUNCTION public.verify_sts_certificate(p_certificate_number text)
RETURNS TABLE(
 certificate_number text,
 student_name text,
 course_title text,
 issued_at timestamptz,
 status text,
 percentage numeric,
 score integer,
 question_count integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$
 SELECT c.certificate_number,
        coalesce(p.full_name,'Student'),
        co.title,
        c.issued_at,
        CASE WHEN c.revoked_at IS NULL THEN 'VALID' ELSE 'REVOKED' END,
        a.percentage,
        a.score,
        a.question_count
 FROM public.certificates c
 JOIN public.profiles p ON p.id=c.student_id
 JOIN public.exam_attempts a ON a.id=c.attempt_id
 JOIN public.courses co ON co.id=a.course_id
 WHERE upper(trim(c.certificate_number))=upper(trim(p_certificate_number));
$$;
REVOKE ALL ON FUNCTION public.verify_sts_certificate(text) FROM public;
GRANT EXECUTE ON FUNCTION public.verify_sts_certificate(text) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
