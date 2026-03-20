create table if not exists blog_drafts (
  id text primary key,
  title text not null,
  excerpt text,
  preview_url text,
  model_names text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table blog_drafts enable row level security;
