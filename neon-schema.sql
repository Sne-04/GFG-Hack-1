-- DataMind AI — Neon PostgreSQL Database Schema
-- Run this in your Neon SQL Editor to set up the required tables.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles table (stores user data from Clerk)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,        -- Clerk user ID (e.g., 'user_2abc...')
  email TEXT,
  name TEXT,
  company TEXT,
  role TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free',
  billing_period TEXT,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  plan_expires_at TIMESTAMPTZ,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved queries
CREATE TABLE IF NOT EXISTS queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,               -- Clerk user ID
  query_text TEXT NOT NULL,
  result_json JSONB,
  csv_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queries_user_id ON queries(user_id);

-- Saved dashboards
CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,               -- Clerk user ID
  title TEXT,
  csv_name TEXT,
  schema_json JSONB,
  result_json JSONB,
  query_text TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_share_token ON dashboards(share_token);

-- API usage tracking (daily)
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,               -- Clerk user ID
  month TEXT NOT NULL,                 -- e.g., '2026-05-09' (daily tracking key)
  query_count INT DEFAULT 0,
  tokens_consumed INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,              -- Clerk user ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);

-- Workspace members
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT,                        -- Clerk user ID (null until accepted)
  invited_email TEXT,
  role TEXT DEFAULT 'viewer',
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wm_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_wm_user ON workspace_members(user_id);

-- Scheduled reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,               -- Clerk user ID
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  frequency TEXT NOT NULL,             -- 'weekly' | 'monthly'
  day_of_week INT,
  day_of_month INT,
  is_active BOOLEAN DEFAULT TRUE,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_user ON scheduled_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_next_send ON scheduled_reports(next_send_at);
