create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null default 'Sessão de treino',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  constraint appointments_time_order check (ends_at > starts_at)
);

create index if not exists appointments_trainer_starts_idx on public.appointments(trainer_id, starts_at);
create index if not exists appointments_student_starts_idx on public.appointments(student_id, starts_at);

alter table public.appointments enable row level security;

drop policy if exists appointments_select_related on public.appointments;
create policy appointments_select_related on public.appointments for select using (
  trainer_id = auth.uid() or exists (
    select 1 from public.students s
    where s.id = appointments.student_id and s.user_id = auth.uid()
  )
);

drop policy if exists appointments_insert_trainer on public.appointments;
create policy appointments_insert_trainer on public.appointments for insert with check (
  trainer_id = auth.uid() and exists (
    select 1 from public.students s
    where s.id = appointments.student_id and s.trainer_id = auth.uid()
  )
);

drop policy if exists appointments_update_trainer on public.appointments;
create policy appointments_update_trainer on public.appointments for update using (
  trainer_id = auth.uid()
) with check (
  trainer_id = auth.uid() and exists (
    select 1 from public.students s
    where s.id = appointments.student_id and s.trainer_id = auth.uid()
  )
);

drop policy if exists appointments_delete_trainer on public.appointments;
create policy appointments_delete_trainer on public.appointments for delete using (trainer_id = auth.uid());

create table if not exists public.weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  energy smallint not null check (energy between 1 and 5),
  sleep_quality smallint not null check (sleep_quality between 1 and 5),
  soreness smallint not null check (soreness between 1 and 5),
  adherence smallint not null check (adherence between 0 and 100),
  pain text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists weekly_checkins_student_created_idx on public.weekly_checkins(student_id, created_at desc);

alter table public.weekly_checkins enable row level security;

drop policy if exists weekly_checkins_select_related on public.weekly_checkins;
create policy weekly_checkins_select_related on public.weekly_checkins for select using (
  exists (
    select 1 from public.students s
    where s.id = weekly_checkins.student_id
      and (s.trainer_id = auth.uid() or s.user_id = auth.uid())
  )
);

drop policy if exists weekly_checkins_insert_student on public.weekly_checkins;
create policy weekly_checkins_insert_student on public.weekly_checkins for insert with check (
  submitted_by = auth.uid() and exists (
    select 1 from public.students s
    where s.id = weekly_checkins.student_id and s.user_id = auth.uid()
  )
);

drop policy if exists weekly_checkins_delete_student on public.weekly_checkins;
create policy weekly_checkins_delete_student on public.weekly_checkins for delete using (
  submitted_by = auth.uid() and exists (
    select 1 from public.students s
    where s.id = weekly_checkins.student_id and s.user_id = auth.uid()
  )
);
