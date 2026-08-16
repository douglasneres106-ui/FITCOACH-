update public.trainer_plan_preferences
set billing_cycle = 'semiannual', updated_at = now()
where billing_cycle = 'annual';

alter table public.trainer_plan_preferences
  drop constraint if exists trainer_plan_preferences_billing_cycle_check;

alter table public.trainer_plan_preferences
  add constraint trainer_plan_preferences_billing_cycle_check
  check (billing_cycle in ('monthly','semiannual'));
