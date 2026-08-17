-- Limites oficiais de alunos por ciclo:
-- Free: 10 | Pro Semestral: 15 | Pro Mensal: 30
create or replace function public.enforce_trainer_student_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  plan_limit integer := 10;
  billing_cycle text := 'free';
begin
  select coalesce(billing_cycle, 'free')
    into billing_cycle
  from public.trainer_plan_preferences
  where trainer_id = new.trainer_id;

  plan_limit := case billing_cycle
    when 'monthly' then 30
    when 'semiannual' then 15
    else 10
  end;

  if (select count(*) from public.students where trainer_id = new.trainer_id) >= plan_limit then
    raise exception 'Limite do plano atingido: até % alunos.', plan_limit;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_trainer_student_limit() from public;
revoke all on function public.enforce_trainer_student_limit() from anon;
revoke all on function public.enforce_trainer_student_limit() from authenticated;
