-- Run this in the Supabase SQL editor for your project to add trade support.

alter table pools add column if not exists trade_mode boolean not null default false;
alter table pools add column if not exists trades jsonb not null default '[]'::jsonb;

-- Recreate the public view to expose the new columns.
drop view if exists pools_public;
create view pools_public as
  select id, name, num_players, players, assigned, language, trade_mode, trades, created_at
  from pools;

grant select on pools_public to anon;
