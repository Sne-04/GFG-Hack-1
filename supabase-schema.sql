-- DataMind AI — Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the required tables.

-- Profiles table (extends Supabase Auth users)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text,
  company text,
  role text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = user_id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = user_id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Saved queries
create table if not exists queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  query_text text not null,
  result_json jsonb,
  csv_name text,
  created_at timestamptz default now()
);

alter table queries enable row level security;
create policy "Users can view own queries" on queries for select using (auth.uid() = user_id);
create policy "Users can insert own queries" on queries for insert with check (auth.uid() = user_id);

-- Saved dashboards
create table if not exists dashboards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  csv_name text,
  schema_json jsonb,
  result_json jsonb,
  query_text text,
  is_favorite boolean default false,
  created_at timestamptz default now()
);

alter table dashboards enable row level security;
create policy "Users can view own dashboards" on dashboards for select using (auth.uid() = user_id);
create policy "Users can insert own dashboards" on dashboards for insert with check (auth.uid() = user_id);
create policy "Users can update own dashboards" on dashboards for update using (auth.uid() = user_id);
create policy "Users can delete own dashboards" on dashboards for delete using (auth.uid() = user_id);

-- API usage tracking
create table if not exists api_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  month text not null, -- e.g. '2026-03'
  query_count int default 0,
  tokens_consumed int default 0,
  created_at timestamptz default now(),
  unique(user_id, month)
);

alter table api_usage enable row level security;
create policy "Users can view own usage" on api_usage for select using (auth.uid() = user_id);
create policy "Users can upsert own usage" on api_usage for insert with check (auth.uid() = user_id);
create policy "Users can update own usage" on api_usage for update using (auth.uid() = user_id);
