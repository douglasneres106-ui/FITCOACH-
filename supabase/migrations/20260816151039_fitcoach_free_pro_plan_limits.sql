create or replace function public.enforce_trainer_student_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_limit integer := 10;
begin
  if exists (
    select 1
    from public.trainer_plan_preferences
    where trainer_id = new.trainer_id
      and billing_cycle in ('monthly','semiannual')
  ) then
    plan_limit := 30;
  end if;

  if (select count(*) from public.students where trainer_id = new.trainer_id) >= plan_limit then
    raise exception 'Limite do plano atingido: até % alunos.', plan_limit;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_trainer_student_limit() from public;
revoke all on function public.enforce_trainer_student_limit() from anon;
revoke all on function public.enforce_trainer_student_limit() from authenticated;
