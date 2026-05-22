# Infonte

URL oficial: **https://infonte.vivannedossantos.com**

Percurso em sete etapas, da Sete Ecos. Aplicação web (PWA) escrita em
Next.js (App Router), Supabase, Tailwind, PayPal, Resend.

> Tudo neste projeto opera via web. Nada precisa de ambiente local. Ver
> [CLAUDE.md](./CLAUDE.md) para o contexto operacional completo.

## Stack
- Next.js 15 + TypeScript (App Router), deployed na Vercel
- Tailwind CSS, tokens de marca (creme, ocre, terra, castanho, oliva)
- Tipografia EB Garamond + Inter via next/font
- next-intl, pt por omissão e en em /en
- Supabase (Postgres + Auth) num **schema próprio `infonte`**, isolado
  para coexistir com outras apps na mesma instância
- PayPal REST (sandbox/live)
- Resend para email
- PWA: manifest.webmanifest + sw.js
- Cron diário na Vercel para abrir as etapas

## Base de dados, schema isolado
A app vive toda no schema `infonte` (não toca em `public`). SQL em
`supabase/migrations`, correr no SQL editor pela ordem:
1. `0001_schema.sql` (cria schema infonte, tabelas, triggers, handle_new_user)
2. `0002_rls.sql` (Row Level Security em todas as tabelas)
3. `0003_campanha.sql` (tabela campanha_posts + RLS de admin)

**Crítico:** depois do `0001`, ir a Supabase > Project Settings > API >
"Exposed schemas" e adicionar `infonte` à lista. Sem isto o PostgREST
devolve 404 a todas as queries.

Para te tornares admin (depois de teres feito login uma vez):
```sql
select infonte.tornar_admin('viv.saraiva@gmail.com');
```

## Conteúdo
Markdown em `/content` (etapas) e em `/infonte-campanha-30-dias` (campanha),
empacotado com o deploy. Para carregar para a base de dados, **entrar em
`/admin`** e usar os botões "popular etapas" e "popular campanha".

## Admin e campanha 30 dias
Em `/admin/campanha` (visível só a quem tiver `is_admin=true`):
- 30 posts listados por semana, com estado (rascunho, pronto, agendado,
  publicado)
- Editor por dia: legenda, pergunta, hashtags, redes, data/hora, URL da arte
- Pré-visualização da legenda final
- Botão "exportar CSV Metricool" (uma linha por dia, redes separadas
  por `;`) e variante "CSV por rede"

O CSV usa as colunas `date,time,text,link,image,networks` aceites pelo
importador em massa do Metricool.

## Variáveis de ambiente (configuradas na Vercel)
- `NEXT_PUBLIC_SITE_URL=https://infonte.vivannedossantos.com`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`, `RESEND_FROM`
- `CRON_SECRET` (cron da Vercel só corre com Bearer <secret>)
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV` (depois)

## Deploy
Commit em `main` -> Vercel faz redeploy automático. Para o domínio
personalizado, adicionar em Vercel > Settings > Domains e criar o CNAME
correspondente no Hostinger.

## Notas de design
- Estética terra, ocre, serena. Muito espaço branco. Tipografia serif
  para corpo longo, sans para botões e interface.
- Voz íntima na segunda pessoa, sem ferida, com poder. pt-PT.
- Sem travessões em nenhum texto.
- O nome "infonte" escreve-se em minúsculas.
