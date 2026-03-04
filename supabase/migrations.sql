-- Models (admin-seeded)
create table if not exists public.models (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  provider text not null,
  description text,
  logo_url text,
  supported_gen_types text[] not null default '{}',
  min_tier text not null default 'newbie' check (min_tier in ('newbie','creator','studio','pro')),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Templates (one per model + gen_type)
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  gen_type text not null,
  name text not null,
  description text,
  fields jsonb not null default '[]',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(model_id, gen_type)
);

-- User projects (DAM folders)
create table if not exists public.user_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Assets (generated results)
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.user_projects(id) on delete set null,
  prompt_id uuid references public.prompts(id) on delete set null,
  model_id uuid references public.models(id) on delete set null,
  gen_type text,
  url text not null,
  thumbnail_url text,
  width integer,
  height integer,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- RLS
alter table public.models enable row level security;
alter table public.templates enable row level security;
alter table public.user_projects enable row level security;
alter table public.assets enable row level security;

-- Models + templates: readable by all authenticated users
create policy "models_select_auth" on public.models for select to authenticated using (true);
create policy "templates_select_auth" on public.templates for select to authenticated using (true);

-- User projects: own only
create policy "user_projects_select_own" on public.user_projects for select using (auth.uid() = user_id);
create policy "user_projects_insert_own" on public.user_projects for insert with check (auth.uid() = user_id);
create policy "user_projects_update_own" on public.user_projects for update using (auth.uid() = user_id);
create policy "user_projects_delete_own" on public.user_projects for delete using (auth.uid() = user_id);

-- Assets: own only
create policy "assets_select_own" on public.assets for select using (auth.uid() = user_id);
create policy "assets_insert_own" on public.assets for insert with check (auth.uid() = user_id);
create policy "assets_delete_own" on public.assets for delete using (auth.uid() = user_id);
