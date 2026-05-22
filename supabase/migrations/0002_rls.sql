-- Infonte, Row Level Security

alter table public.utilizadoras enable row level security;
alter table public.etapas enable row level security;
alter table public.respostas enable row level security;
alter table public.progresso enable row level security;
alter table public.compras enable row level security;

-- Helper: auth_id da utilizadora corrente
create or replace function public.utilizadora_id_de(uid uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.utilizadoras where auth_id = uid limit 1;
$$;

-- utilizadoras: cada uma vê e edita só a sua linha
drop policy if exists "utilizadora vê o seu perfil" on public.utilizadoras;
create policy "utilizadora vê o seu perfil"
  on public.utilizadoras for select
  using (auth.uid() = auth_id);

drop policy if exists "utilizadora atualiza o seu perfil" on public.utilizadoras;
create policy "utilizadora atualiza o seu perfil"
  on public.utilizadoras for update
  using (auth.uid() = auth_id);

-- etapas: leitura para autenticadas
-- (o gating de conteúdo das etapas 2 a 7 a quem ainda não comprou é aplicado na API)
drop policy if exists "autenticadas leem etapas" on public.etapas;
create policy "autenticadas leem etapas"
  on public.etapas for select
  to authenticated
  using (true);

-- respostas: cada utilizadora só as suas
drop policy if exists "respostas próprias select" on public.respostas;
create policy "respostas próprias select"
  on public.respostas for select
  using (utilizadora_id = public.utilizadora_id_de(auth.uid()));

drop policy if exists "respostas próprias insert" on public.respostas;
create policy "respostas próprias insert"
  on public.respostas for insert
  with check (utilizadora_id = public.utilizadora_id_de(auth.uid()));

drop policy if exists "respostas próprias update" on public.respostas;
create policy "respostas próprias update"
  on public.respostas for update
  using (utilizadora_id = public.utilizadora_id_de(auth.uid()))
  with check (utilizadora_id = public.utilizadora_id_de(auth.uid()));

-- progresso: cada utilizadora só o seu (leitura). Escrita feita por API com service role.
drop policy if exists "progresso próprio select" on public.progresso;
create policy "progresso próprio select"
  on public.progresso for select
  using (utilizadora_id = public.utilizadora_id_de(auth.uid()));

-- compras: leitura própria. Escrita feita por API com service role.
drop policy if exists "compras próprias select" on public.compras;
create policy "compras próprias select"
  on public.compras for select
  using (utilizadora_id = public.utilizadora_id_de(auth.uid()));
