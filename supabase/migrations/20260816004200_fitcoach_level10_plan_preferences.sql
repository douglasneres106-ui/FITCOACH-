create table if not exists public.trainer_plan_preferences (
  trainer_id uuid primary key references auth.users(id) on delete cascade,
  billing_cycle text not null check (billing_cycle in ('monthly','semiannual','annual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trainer_plan_preferences enable row level security;

drop policy if exists trainer_plan_preferences_select_own on public.trainer_plan_preferences;
create policy trainer_plan_preferences_select_own on public.trainer_plan_preferences
for select using (trainer_id = auth.uid());

drop policy if exists trainer_plan_preferences_insert_own on public.trainer_plan_preferences;
create policy trainer_plan_preferences_insert_own on public.trainer_plan_preferences
for insert with check (trainer_id = auth.uid());

drop policy if exists trainer_plan_preferences_update_own on public.trainer_plan_preferences;
create policy trainer_plan_preferences_update_own on public.trainer_plan_preferences
for update using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

create index if not exists trainer_plan_preferences_cycle_idx on public.trainer_plan_preferences(billing_cycle);
