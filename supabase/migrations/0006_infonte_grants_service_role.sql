-- Infonte, conceder permissões de tabela ao service_role no schema infonte.
-- A migração 0001 garantiu USAGE no schema mas só atribuiu privilégios de
-- tabela por default a anon e authenticated. As rotas /api/admin/* usam
-- o cliente com service-role e estavam a apanhar "permission denied for
-- table ...". RLS continua activo, o service_role contorna-o como sempre.

grant usage on schema infonte to service_role;

grant select, insert, update, delete
  on all tables in schema infonte to service_role;

grant usage, select
  on all sequences in schema infonte to service_role;

alter default privileges in schema infonte
  grant select, insert, update, delete on tables to service_role;

alter default privileges in schema infonte
  grant usage, select on sequences to service_role;
