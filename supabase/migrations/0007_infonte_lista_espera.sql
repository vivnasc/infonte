-- Infonte, lista de espera para o lançamento de 1 de Julho 2026.
-- Quem se inscreve até ao lançamento recebe um código de desconto (25%)
-- e o aviso de acesso antecipado.
--
-- A tabela vive no schema `infonte` (partilhado com outras apps no mesmo
-- Supabase). RLS fica activo e bloqueado: ninguém lê nem escreve via
-- anon/authenticated. Tudo passa pelo service-role (endpoint /api/lista-espera
-- e as páginas /admin/*, que usam o bypass de admin já existente).

create table if not exists infonte.lista_espera (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  fonte text,                  -- "instagram", "tiktok", "direto", etc (UTM)
  criado_em timestamptz default now(),
  codigo_desconto text,        -- gerado no insert, ex: "INFONTE-EARLY-XXXX"
  convertido_em timestamptz,   -- preenchido quando comprar no lançamento
  notas text
);

create index if not exists lista_espera_criado_em_idx
  on infonte.lista_espera (criado_em desc);

-- RLS: tabela fechada. Sem políticas para anon/authenticated, por isso só
-- o service_role (que contorna RLS) consegue ler e escrever.
alter table infonte.lista_espera enable row level security;

-- O service_role precisa de privilégios de tabela explícitos (ver 0006).
grant select, insert, update, delete
  on infonte.lista_espera to service_role;
