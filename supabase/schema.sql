-- prmptBASE schema
-- Run in: https://supabase.com/dashboard/project/<ref>/sql/new

-- 1. Profiles (auto-created on signup via trigger)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  tier text not null default 'newbie' check (tier in ('newbie', 'creator', 'studio', 'pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Agents (prompt builder agents per user)
create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  type text not null default 'sora', -- sora | dalle | midjourney | etc.
  config jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. Prompts (saved prompt templates)
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  title text not null,
  content text not null,
  tags text[] default '{}',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Prompt runs (history / usage tracking)
create table if not exists public.prompt_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prompt_id uuid references public.prompts(id) on delete set null,
  agent_type text,
  input_content text,
  result_url text,
  tokens_used integer,
  created_at timestamptz not null default now()
);

-- 5. Subscriptions (Stripe billing)
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  tier text not null default 'newbie' check (tier in ('newbie', 'creator', 'studio', 'pro')),
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled', 'trialing')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.agents enable row level security;
alter table public.prompts enable row level security;
alter table public.prompt_runs enable row level security;
alter table public.subscriptions enable row level security;

-- Profiles: users can only see/edit their own
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Agents: own rows only
create policy "agents_select_own" on public.agents for select using (auth.uid() = user_id);
create policy "agents_insert_own" on public.agents for insert with check (auth.uid() = user_id);
create policy "agents_update_own" on public.agents for update using (auth.uid() = user_id);
create policy "agents_delete_own" on public.agents for delete using (auth.uid() = user_id);

-- Prompts: own + public read
create policy "prompts_select_own_or_public" on public.prompts for select
  using (auth.uid() = user_id or is_public = true);
create policy "prompts_insert_own" on public.prompts for insert with check (auth.uid() = user_id);
create policy "prompts_update_own" on public.prompts for update using (auth.uid() = user_id);
create policy "prompts_delete_own" on public.prompts for delete using (auth.uid() = user_id);

-- Prompt runs: own only
create policy "prompt_runs_select_own" on public.prompt_runs for select using (auth.uid() = user_id);
create policy "prompt_runs_insert_own" on public.prompt_runs for insert with check (auth.uid() = user_id);

-- Subscriptions: own only
create policy "subscriptions_select_own" on public.subscriptions for select using (auth.uid() = user_id);
