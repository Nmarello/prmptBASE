-- prmptVAULT is shutting down on 2026-10-19: refuse new accounts at the database so every
-- path (email/password, Google, Apple, admin) is closed. Existing users still sign in —
-- sign-ins update auth.users, they never insert. Drop this trigger to reopen signups.

create or replace function public.block_new_signups()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'New signups are closed: prmptVAULT is shutting down on October 19, 2026.';
end;
$$;

create or replace trigger block_new_signups
  before insert on auth.users
  for each row execute function public.block_new_signups();
