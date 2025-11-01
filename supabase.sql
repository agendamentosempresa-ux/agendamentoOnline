-- SQL para criar esquema bsico no Supabase

-- tabela profiles para gerenciamento de usurios
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  role text not null,
  created_at timestamptz default now()
);

-- tabela schedules para solicitaes
create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  status text not null default 'pendente',
  requested_by uuid references profiles(id) on delete set null,
  requested_by_name text,
  data jsonb,
  observacoes text,
  created_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id),
  check_in_status text,
  check_in_at timestamptz
);

-- tabela logs para rastreamento de atividades
create table if not exists logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  description text,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- ndices teis
create index if not exists idx_schedules_status on schedules(status);
create index if not exists idx_schedules_requested_by on schedules(requested_by);
create index if not exists idx_schedules_created_at on schedules(created_at);
create index if not exists idx_logs_user_id on logs(user_id);
create index if not exists idx_logs_action on logs(action);
create index if not exists idx_logs_created_at on logs(created_at);