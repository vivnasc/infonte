# Supabase, Infonte

Migrações para correr no Supabase (SQL editor ou Supabase CLI).

## Ordem
1. `migrations/0001_schema.sql`, cria as cinco tabelas e os triggers.
2. `migrations/0002_rls.sql`, ativa RLS e cria as policies.

## Convenção
- A app autenticada usa a anon key e respeita RLS.
- As rotas de API que precisam de escrever em `progresso` ou `compras` usam a `SUPABASE_SERVICE_ROLE_KEY`.
- A criação da linha em `utilizadoras` é automática via trigger ao registar.

## Seed das etapas
```
npm run seed:etapas
```
Lê `/content/*.md` e faz upsert na tabela `etapas`. Precisa de
`NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no ambiente.
