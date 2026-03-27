-- Sprint 3 migrations — run this in Supabase Dashboard → SQL Editor

-- 1. Scheduled Reports
create table if not exists scheduled_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  dashboard_id uuid references dashboards(id) on delete cascade,
  recipient_email text not null,
  frequency text check (frequency in ('weekly', 'monthly')),
  day_of_week int,
  day_of_month int,
  last_sent_at timestamptz,
  next_send_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table scheduled_reports enable row level security;
drop policy if exists "Users manage own reports" on scheduled_reports;
create policy "Users manage own reports" on scheduled_reports
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2. Workspaces
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- 3. Workspace Members
create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id),
  role text check (role in ('admin', 'editor', 'viewer')) default 'viewer',
  invited_email text,
  joined_at timestamptz,
  created_at timestamptz default now(),
  unique(workspace_id, user_id)
);
