-- Infonte, campanha 30 dias (tudo no schema infonte)

create table if not exists infonte.campanha_posts (
  id uuid primary key default gen_random_uuid(),
  dia integer not null unique check (dia between 1 and 30),
  semana integer not null check (semana between 1 and 4),
  tema text not null,
  formato text,                       -- 'carrossel', 'reel', 'post-unico'
  texto_imagem text,                  -- o que vai na arte (slides ou frase)
  legenda text,                       -- corpo da legenda
  pergunta text,                      -- a pergunta no fim
  hashtags text,                      -- 8 a 12, separadas por espaço
  link text,                          -- url destino (lista, site)
  imagem_url text,                    -- URL da arte final
  redes text[] default array['instagram','tiktok']::text[],
  data_publicacao timestamptz,        -- quando agendar
  estado text default 'rascunho',     -- rascunho | pronto | agendado | publicado
  notas text,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

create index if not exists campanha_dia_idx on infonte.campanha_posts(dia);
create index if not exists campanha_estado_idx on infonte.campanha_posts(estado);

create or replace function infonte.touch_campanha_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_campanha_touch on infonte.campanha_posts;
create trigger trg_campanha_touch
  before update on infonte.campanha_posts
  for each row execute function infonte.touch_campanha_atualizado_em();

alter table infonte.campanha_posts enable row level security;

drop policy if exists "admin lê posts" on infonte.campanha_posts;
create policy "admin lê posts"
  on infonte.campanha_posts for select
  using (
    exists (
      select 1 from infonte.utilizadoras u
      where u.auth_id = auth.uid() and u.is_admin = true
    )
  );

drop policy if exists "admin insere posts" on infonte.campanha_posts;
create policy "admin insere posts"
  on infonte.campanha_posts for insert
  with check (
    exists (
      select 1 from infonte.utilizadoras u
      where u.auth_id = auth.uid() and u.is_admin = true
    )
  );

drop policy if exists "admin atualiza posts" on infonte.campanha_posts;
create policy "admin atualiza posts"
  on infonte.campanha_posts for update
  using (
    exists (
      select 1 from infonte.utilizadoras u
      where u.auth_id = auth.uid() and u.is_admin = true
    )
  );

drop policy if exists "admin apaga posts" on infonte.campanha_posts;
create policy "admin apaga posts"
  on infonte.campanha_posts for delete
  using (
    exists (
      select 1 from infonte.utilizadoras u
      where u.auth_id = auth.uid() and u.is_admin = true
    )
  );

-- Helper para tornar uma utilizadora admin pelo email
-- Usa: select infonte.tornar_admin('viv.saraiva@gmail.com');
create or replace function infonte.tornar_admin(p_email text)
returns void
language sql
security definer
set search_path = infonte, public
as $$
  update infonte.utilizadoras set is_admin = true where email = p_email;
$$;
