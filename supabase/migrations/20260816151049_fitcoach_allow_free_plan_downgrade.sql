drop policy if exists trainer_plan_preferences_delete_own on public.trainer_plan_preferences;
create policy trainer_plan_preferences_delete_own on public.trainer_plan_preferences
for delete using (trainer_id = auth.uid());
