-- Add recent_models column to profiles for cross-device persistence
alter table profiles
  add column if not exists recent_models jsonb not null default '[]'::jsonb;
