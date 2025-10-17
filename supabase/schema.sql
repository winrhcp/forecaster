-- Supabase schema for Forecaster
create extension if not exists pgcrypto;

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  poll_id text not null,
  fid bigint not null,
  choice text not null,
  created_at timestamptz default now(),
  unique (poll_id, fid)
);

-- Optional: multi-poll support
create table if not exists polls (
  id text primary key,
  question text not null,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '1 day')
);
