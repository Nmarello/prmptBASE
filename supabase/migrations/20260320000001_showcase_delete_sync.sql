-- Sync deletes from assets → showcase_assets
create or replace function delete_showcase_asset()
returns trigger language plpgsql security definer as $$
begin
  delete from showcase_assets where id = old.id;
  return old;
end;
$$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_delete_showcase') then
    create trigger trg_delete_showcase
      after delete on assets
      for each row execute function delete_showcase_asset();
  end if;
end $$;

-- Clean up stale entries: remove showcase_assets that no longer exist in assets
delete from showcase_assets
where id not in (select id from assets where user_id = 'f9965304-4af9-4eba-a762-7b7c892473e1');

-- Also remove entries with empty URLs
delete from showcase_assets where url = '' or url is null;
