-- Randomize Complete Accounting answer-option positions.
-- Run once in Supabase SQL Editor. Safe to rerun; it reshuffles options and updates answer keys together.
begin;

create temporary table sts_accounting_shuffled_options on commit drop as
with expanded as (
  select
    q.id as question_id,
    e.value as option_value,
    e.ordinality as old_position,
    row_number() over (partition by q.id order by random()) as new_position,
    k.correct_option
  from public.courses c
  join public.questions q on q.course_id = c.id
  join public.question_answer_keys k on k.question_id = q.id
  cross join lateral jsonb_array_elements(q.options) with ordinality as e(value, ordinality)
  where c.slug = 'complete-accounting'
    and q.is_active = true
),
reshaped as (
  select
    question_id,
    jsonb_agg(option_value order by new_position) as new_options,
    (max(new_position) filter (where old_position = correct_option + 1) - 1)::integer as new_correct_option
  from expanded
  group by question_id
)
select * from reshaped;

do $$
declare
  v_count integer;
begin
  select count(*) into v_count from sts_accounting_shuffled_options;
  if v_count < 50 then
    raise exception 'Only % questions could be shuffled. Expected at least 50; no changes committed.', v_count;
  end if;
  if exists (
    select 1 from sts_accounting_shuffled_options
    where new_correct_option is null or jsonb_array_length(new_options) <> 4
  ) then
    raise exception 'Invalid option or answer-key mapping detected; no changes committed.';
  end if;
end $$;

update public.questions q
set options = s.new_options
from sts_accounting_shuffled_options s
where q.id = s.question_id;

update public.question_answer_keys k
set correct_option = s.new_correct_option
from sts_accounting_shuffled_options s
where k.question_id = s.question_id;

commit;

select
  c.slug,
  count(distinct q.id) as questions_updated,
  count(distinct k.question_id) as answer_keys_updated,
  count(distinct k.correct_option) as distinct_correct_option_positions
from public.courses c
join public.questions q on q.course_id = c.id
join public.question_answer_keys k on k.question_id = q.id
where c.slug = 'complete-accounting'
  and q.is_active = true
group by c.slug;
