-- SQL para criar esquema básico no Supabase

-- tabela profiles para gerenciamento de usuários
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  role text not null,
  created_at timestamptz default now()
);

-- tabela schedules para solicitações
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

-- índices úteis
create index if not exists idx_schedules_status on schedules(status);
create index if not exists idx_schedules_requested_by on schedules(requested_by);
create index if not exists idx_schedules_created_at on schedules(created_at);

-- inserir usuário inicial (karen) com role admin
-- ATENÇÃO: para criar usuário do Supabase Auth é preciso usar a API Admin do Supabase; aqui criamos apenas o profile
insert into profiles (email, full_name, role) values ('karen@adm.com', 'Karen (Admin)', 'admin') on conflict (email) do nothing;

-- Observação: crie a conta no Auth do Supabase com o email e senha mwf17 usando o painel ou a API Admin.
