-- Add metadata and model_name to showcase_assets for gallery lightbox
alter table showcase_assets add column if not exists metadata jsonb default '{}';
alter table showcase_assets add column if not exists model_name text;
alter table showcase_assets add column if not exists width integer;
alter table showcase_assets add column if not exists height integer;

-- Update sync trigger to include new fields
create or replace function sync_showcase_asset()
returns trigger language plpgsql security definer as $$
declare
  _model_name text;
begin
  if new.user_id = 'f9965304-4af9-4eba-a762-7b7c892473e1' then
    select name into _model_name from models where id = new.model_id;
    insert into showcase_assets (id, url, gen_type, metadata, model_name, width, height, created_at)
    values (new.id, new.url, new.gen_type, new.metadata, _model_name, new.width, new.height, new.created_at)
    on conflict (id) do update
      set url        = excluded.url,
          gen_type   = excluded.gen_type,
          metadata   = excluded.metadata,
          model_name = excluded.model_name,
          width      = excluded.width,
          height     = excluded.height;
  end if;
  return new;
end;
$$;

-- Backfill metadata + model_name for existing showcase entries
update showcase_assets sa
set metadata   = a.metadata,
    model_name = m.name,
    width      = a.width,
    height     = a.height
from assets a
left join models m on m.id = a.model_id
where sa.id = a.id;
