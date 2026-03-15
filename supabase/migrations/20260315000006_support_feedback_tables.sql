-- feedback submissions
create table if not exists public.feedback (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  email        text,
  category     text not null default 'general' check (category in ('bug', 'feature', 'general')),
  message      text not null,
  status       text not null default 'new' check (status in ('new', 'reviewed', 'closed')),
  created_at   timestamptz not null default now()
);

-- support chat conversations
create table if not exists public.support_conversations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  email        text,
  messages     jsonb not null default '[]',
  status       text not null default 'open' check (status in ('open', 'resolved', 'escalated')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- tracks support refunds issued per user (for rate-limit offset)
create table if not exists public.support_refunds (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  refunded_at  date not null default current_date,
  amount       int not null default 1
);

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table public.feedback enable row level security;
alter table public.support_conversations enable row level security;
alter table public.support_refunds enable row level security;

-- feedback: anyone can submit (pre-login widget)
create policy "anon_insert_feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (true);

-- feedback: admins can read and update
create policy "admin_select_feedback"
  on public.feedback for select
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "admin_update_feedback"
  on public.feedback for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (true);

-- support_conversations: users can see their own; admins see all
create policy "user_select_own_conv"
  on public.support_conversations for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "anon_insert_conv"
  on public.support_conversations for insert
  to anon, authenticated
  with check (true);

create policy "admin_update_conv"
  on public.support_conversations for update
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (true);

-- support_refunds: service role only (edge fn uses service role)
-- no frontend policies needed
