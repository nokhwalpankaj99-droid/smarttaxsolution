-- Smart Tax Solution: security hardening and initial courses
-- Run this migration in Supabase SQL Editor after schema.sql.
-- Never place a Supabase secret/service-role key in browser code.

-- Prevent students from changing their own role through the profile update policy.
create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Only an authorized administrator can change a profile role';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before update on public.profiles
for each row execute function public.prevent_profile_role_escalation();

-- Starter courses remain unpublished until their lesson/question content is reviewed.
insert into public.courses (slug, title, description, is_published)
values
 ('gst', 'GST Practical Learning', 'GST registration, invoices, returns and input tax credit basics.', false),
 ('income-tax', 'Income Tax Learning', 'Income tax basics, TDS concepts and return-filing workflows.', false)
on conflict (slug) do nothing;

-- Ensure answer keys cannot be read by normal authenticated browser users.
drop policy if exists "answer keys visible" on public.question_answer_keys;
alter table public.question_answer_keys enable row level security;
