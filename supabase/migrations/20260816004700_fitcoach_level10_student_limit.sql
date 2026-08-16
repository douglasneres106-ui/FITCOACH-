create or replace function public.enforce_trainer_student_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.students where trainer_id = new.trainer_id) >= 30 then
    raise exception 'Limite do plano atingido: até 30 alunos.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_trainer_student_limit on public.students;
create trigger trg_enforce_trainer_student_limit
before insert on public.students
for each row
execute function public.enforce_trainer_student_limit();

revoke all on function public.enforce_trainer_student_limit() from public;
revoke all on function public.enforce_trainer_student_limit() from anon;
revoke all on function public.enforce_trainer_student_limit() from authenticated;
