create table if not exists showcase_assets (
  id         uuid primary key default gen_random_uuid(),
  url        text not null,
  gen_type   text,
  created_at timestamptz default now()
);

alter table showcase_assets enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename='showcase_assets' and policyname='public read'
  ) then
    create policy "public read"
      on showcase_assets for select
      to anon, authenticated
      using (true);
  end if;
end $$;

create or replace function sync_showcase_asset()
returns trigger language plpgsql security definer as $$
begin
  if new.user_id = 'f9965304-4af9-4eba-a762-7b7c892473e1' then
    insert into showcase_assets (id, url, gen_type, created_at)
    values (new.id, new.url, new.gen_type, new.created_at)
    on conflict (id) do update
      set url      = excluded.url,
          gen_type = excluded.gen_type;
  end if;
  return new;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_sync_showcase') then
    create trigger trg_sync_showcase
      after insert or update on assets
      for each row execute function sync_showcase_asset();
  end if;
end $$;

-- Backfill existing assets
insert into showcase_assets (id, url, gen_type, created_at)
select id, url, gen_type, created_at
from   assets
where  user_id = 'f9965304-4af9-4eba-a762-7b7c892473e1'
on conflict (id) do nothing;
