-- Add Complete Accounting as a paid course.
-- Run once in Supabase SQL Editor after the website files are deployed.
begin;
alter table public.courses drop constraint if exists courses_slug_check;
alter table public.courses add constraint courses_slug_check
 check (slug in ('gst','income-tax','complete-accounting'));
alter table public.course_payments drop constraint if exists course_payments_course_slug_check;
alter table public.course_payments add constraint course_payments_course_slug_check
 check (course_slug in ('gst','income-tax','combo','complete-accounting'));
alter table public.course_payments drop constraint if exists course_payments_amount_inr_check;
alter table public.course_payments add constraint course_payments_amount_inr_check
 check (amount_inr in (999,1499,1999));
insert into public.courses(slug,title,description,is_published)
values ('complete-accounting','Complete Accounting Course',
'Tally Prime, BUSY Accounting Software, GST accounting, purchase and sales entries, inventory management, banking, bank reconciliation, accounting reports and other accounting software.',false)
on conflict (slug) do update set title=excluded.title,description=excluded.description;
notify pgrst,'reload schema';
commit;
