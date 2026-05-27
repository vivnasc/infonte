-- Infonte, Row Level Security no schema infonte

alter table infonte.utilizadoras enable row level security;
alter table infonte.etapas enable row level security;
alter table infonte.respostas enable row level security;
alter table infonte.progresso enable row level security;
alter table infonte.compras enable row level security;

-- Helper: utilizadora_id (do schema infonte) a partir do auth uid
create or replace function infonte.utilizadora_id_de(uid uuid)
returns uuid
language sql
stable
security definer
set search_path = infonte, public
as $$
  select id from infonte.utilizadoras where auth_id = uid limit 1;
$$;

-- utilizadoras: cada uma vê e edita só a sua linha
drop policy if exists "utilizadora vê o seu perfil" on infonte.utilizadoras;
create policy "utilizadora vê o seu perfil"
  on infonte.utilizadoras for select
  using (auth.uid() = auth_id);

drop policy if exists "utilizadora atualiza o seu perfil" on infonte.utilizadoras;
create policy "utilizadora atualiza o seu perfil"
  on infonte.utilizadoras for update
  using (auth.uid() = auth_id);

-- INSERT: a app cria a linha na primeira visita (lazy, sem trigger em auth.users)
drop policy if exists "utilizadora cria o seu perfil" on infonte.utilizadoras;
create policy "utilizadora cria o seu perfil"
  on infonte.utilizadoras for insert
  with check (auth.uid() = auth_id);

-- etapas: leitura para autenticadas (o filtro de compra é feito na app)
drop policy if exists "autenticadas leem etapas" on infonte.etapas;
create policy "autenticadas leem etapas"
  on infonte.etapas for select
  to authenticated
  using (true);

-- respostas: cada utilizadora só as suas
drop policy if exists "respostas próprias select" on infonte.respostas;
create policy "respostas próprias select"
  on infonte.respostas for select
  using (utilizadora_id = infonte.utilizadora_id_de(auth.uid()));

drop policy if exists "respostas próprias insert" on infonte.respostas;
create policy "respostas próprias insert"
  on infonte.respostas for insert
  with check (utilizadora_id = infonte.utilizadora_id_de(auth.uid()));

drop policy if exists "respostas próprias update" on infonte.respostas;
create policy "respostas próprias update"
  on infonte.respostas for update
  using (utilizadora_id = infonte.utilizadora_id_de(auth.uid()))
  with check (utilizadora_id = infonte.utilizadora_id_de(auth.uid()));

-- progresso: leitura própria. Escrita pela API com service role.
drop policy if exists "progresso próprio select" on infonte.progresso;
create policy "progresso próprio select"
  on infonte.progresso for select
  using (utilizadora_id = infonte.utilizadora_id_de(auth.uid()));

-- compras: leitura própria. Escrita pela API com service role.
drop policy if exists "compras próprias select" on infonte.compras;
create policy "compras próprias select"
  on infonte.compras for select
  using (utilizadora_id = infonte.utilizadora_id_de(auth.uid()));
