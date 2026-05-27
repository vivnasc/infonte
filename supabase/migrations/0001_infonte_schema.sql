-- Infonte, esquema isolado num schema próprio (`infonte`)
-- para coexistir com outras apps no mesmo Supabase.
--
-- Depois de correr este ficheiro, abrir Supabase > Settings > API e
-- adicionar `infonte` à lista de "Exposed schemas" (DB > API),
-- senão o PostgREST não responde.

create extension if not exists "pgcrypto";

create schema if not exists infonte;

-- Acesso à API REST do PostgREST
grant usage on schema infonte to anon, authenticated, service_role;
alter default privileges in schema infonte
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema infonte
  grant usage, select on sequences to anon, authenticated;

-- Utilizadoras (perfil estendido sobre auth.users)
create table if not exists infonte.utilizadoras (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique references auth.users(id) on delete cascade,
  email text unique not null,
  nome text,
  comprou boolean default false,
  is_admin boolean default false,
  criada_em timestamptz default now()
);

-- Conteúdo das 7 etapas
create table if not exists infonte.etapas (
  id integer primary key,
  slug text not null,
  titulo text not null,
  corpo_md text not null,
  idioma text default 'pt'
);

-- Respostas (texto livre por bloco)
create table if not exists infonte.respostas (
  id uuid primary key default gen_random_uuid(),
  utilizadora_id uuid references infonte.utilizadoras(id) on delete cascade,
  bloco_id text not null,
  valor text,
  criada_em timestamptz default now(),
  atualizada_em timestamptz default now(),
  unique (utilizadora_id, bloco_id)
);

-- Progresso por etapa
create table if not exists infonte.progresso (
  id uuid primary key default gen_random_uuid(),
  utilizadora_id uuid references infonte.utilizadoras(id) on delete cascade,
  etapa integer not null check (etapa between 1 and 7),
  desbloqueada_em timestamptz,
  concluida_em timestamptz,
  email_aberta_enviado_em timestamptz,
  unique (utilizadora_id, etapa)
);

-- Compras
create table if not exists infonte.compras (
  id uuid primary key default gen_random_uuid(),
  utilizadora_id uuid references infonte.utilizadoras(id) on delete cascade,
  paypal_order_id text,
  valor numeric,
  moeda text,
  estado text default 'pendente',
  criada_em timestamptz default now()
);

create index if not exists respostas_utilizadora_idx on infonte.respostas(utilizadora_id);
create index if not exists progresso_utilizadora_idx on infonte.progresso(utilizadora_id);
create index if not exists compras_utilizadora_idx on infonte.compras(utilizadora_id);

-- Nota: NÃO usamos trigger em auth.users porque este Supabase é partilhado
-- com outros produtos. A linha em infonte.utilizadoras é criada pela app
-- (lazy) na primeira vez que a pessoa acede à Infonte, via a função
-- garantir_utilizadora() chamada pelo código servidor.

-- Trigger atualizada_em em respostas
create or replace function infonte.touch_atualizada_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizada_em = now();
  return new;
end;
$$;

drop trigger if exists trg_respostas_touch on infonte.respostas;
create trigger trg_respostas_touch
  before update on infonte.respostas
  for each row execute function infonte.touch_atualizada_em();
