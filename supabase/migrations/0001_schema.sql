-- Infonte, esquema inicial
-- Tabelas: utilizadoras, etapas, respostas, progresso, compras

create extension if not exists "pgcrypto";

-- Utilizadoras (perfil estendido sobre auth.users)
create table if not exists public.utilizadoras (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique references auth.users(id) on delete cascade,
  email text unique not null,
  nome text,
  comprou boolean default false,
  criada_em timestamptz default now()
);

-- Conteúdo das 7 etapas
create table if not exists public.etapas (
  id integer primary key,
  slug text not null,
  titulo text not null,
  corpo_md text not null,
  idioma text default 'pt'
);

-- Respostas (texto livre por bloco)
create table if not exists public.respostas (
  id uuid primary key default gen_random_uuid(),
  utilizadora_id uuid references public.utilizadoras(id) on delete cascade,
  bloco_id text not null,
  valor text,
  criada_em timestamptz default now(),
  atualizada_em timestamptz default now(),
  unique (utilizadora_id, bloco_id)
);

-- Progresso por etapa
create table if not exists public.progresso (
  id uuid primary key default gen_random_uuid(),
  utilizadora_id uuid references public.utilizadoras(id) on delete cascade,
  etapa integer not null check (etapa between 1 and 7),
  desbloqueada_em timestamptz,
  concluida_em timestamptz,
  email_aberta_enviado_em timestamptz,
  unique (utilizadora_id, etapa)
);

-- Compras
create table if not exists public.compras (
  id uuid primary key default gen_random_uuid(),
  utilizadora_id uuid references public.utilizadoras(id) on delete cascade,
  paypal_order_id text,
  valor numeric,
  moeda text,
  estado text default 'pendente',
  criada_em timestamptz default now()
);

-- Índices úteis
create index if not exists respostas_utilizadora_idx on public.respostas(utilizadora_id);
create index if not exists progresso_utilizadora_idx on public.progresso(utilizadora_id);
create index if not exists compras_utilizadora_idx on public.compras(utilizadora_id);

-- Trigger para criar utilizadora ao registar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.utilizadoras (auth_id, email)
  values (new.id, new.email)
  on conflict (auth_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger atualizada_em em respostas
create or replace function public.touch_atualizada_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizada_em = now();
  return new;
end;
$$;

drop trigger if exists trg_respostas_touch on public.respostas;
create trigger trg_respostas_touch
  before update on public.respostas
  for each row execute function public.touch_atualizada_em();
