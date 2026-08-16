create table if not exists public.student_chat_messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  trainer_id uuid not null references auth.users(id) on delete cascade,
  sender text not null check (sender in ('student','assistant')),
  content text not null check (char_length(content) between 1 and 4000),
  response_mode text check (response_mode is null or response_mode in ('ai','smart','safety')),
  needs_trainer_attention boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.student_chat_messages enable row level security;

create index if not exists student_chat_messages_student_created_idx
  on public.student_chat_messages(student_id, created_at desc);
create index if not exists student_chat_messages_trainer_attention_idx
  on public.student_chat_messages(trainer_id, needs_trainer_attention, created_at desc);

drop policy if exists student_chat_select_student_own on public.student_chat_messages;
create policy student_chat_select_student_own on public.student_chat_messages
for select using (
  exists (
    select 1 from public.students s
    where s.id = student_chat_messages.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists student_chat_select_trainer_own on public.student_chat_messages;
create policy student_chat_select_trainer_own on public.student_chat_messages
for select using (trainer_id = auth.uid());

drop policy if exists student_chat_insert_student_own on public.student_chat_messages;
create policy student_chat_insert_student_own on public.student_chat_messages
for insert with check (
  exists (
    select 1 from public.students s
    where s.id = student_chat_messages.student_id
      and s.user_id = auth.uid()
      and s.trainer_id = student_chat_messages.trainer_id
  )
);
