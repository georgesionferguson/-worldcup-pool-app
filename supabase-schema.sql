-- Run this in the Supabase SQL editor for your project.

create extension if not exists pgcrypto;

create table pools (
  id uuid primary key default gen_random_uuid(),
  admin_token uuid not null default gen_random_uuid(),
  name text not null,
  num_players int not null,
  players jsonb not null default '[]'::jsonb,
  assigned boolean not null default false,
  language text not null default 'en',
  trade_mode boolean not null default false,
  trades jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table pools enable row level security;

-- Public, read-only view that hides admin_token.
create view pools_public as
  select id, name, num_players, players, assigned, language, trade_mode, trades, created_at
  from pools;

-- Allow anyone (anon key) to read from the public view.
grant select on pools_public to anon;

-- No policies are created on `pools` itself, and no grants to `anon` —
-- it's only accessible via the service role key from serverless functions.
