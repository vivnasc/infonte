# Infonte

URL oficial: **https://infonte.vivannedossantos.com**

Percurso em sete etapas, da Sete Ecos. Aplicação web (PWA) escrita em
Next.js (App Router), Supabase, Tailwind, PayPal, Resend.

## Correr em local

```
npm install
cp .env.example .env.local   # preencher
npm run dev
```

## Stack
- Next.js 15 + TypeScript (App Router)
- Tailwind CSS, tokens de marca (creme, ocre, terra, castanho, oliva)
- Tipografia EB Garamond + Inter via next/font
- next-intl, pt por omissão e en em /en
- Supabase, auth (email+password, OAuth Google e Facebook prontos), Postgres com RLS
- PayPal REST (sandbox/live), o JS SDK pode entrar como evolução
- Resend para email
- PWA: manifest.webmanifest + sw.js
- Cron diário na Vercel para abrir as etapas

## Conteúdo
Markdown em `/content` (etapas) e em `/infonte-campanha-30-dias` (campanha).
Os seeds lêem os ficheiros e populam as tabelas:

```
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:etapas
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:campanha
```

## Admin e campanha 30 dias
Em `/admin/campanha` (visível só a quem tiver `is_admin=true`):
- 30 posts listados por semana, com estado (rascunho, pronto, agendado, publicado).
- Editor por dia: legenda, pergunta, hashtags, redes, data/hora, URL da arte.
- Pré-visualização da legenda final (legenda + pergunta + link + hashtags).
- Botão "exportar CSV Metricool" (uma linha por dia, redes separadas por `;`)
  e variante "CSV por rede" (uma linha por dia × rede).

O CSV usa as colunas `date,time,text,link,image,networks` aceites pelo
importador em massa do Metricool. A coluna `image` aceita um URL público
(p. ex. Supabase Storage); se preferires, podes fazer upload das artes
diretamente no Metricool depois de importar.

## Base de dados, schema isolado
A app vive toda no schema `infonte` (não toca em `public`), para coexistir
no mesmo Supabase com outras apps.

SQL em `supabase/migrations`, correr no SQL editor pela ordem:
1. `0001_schema.sql` (cria schema infonte, tabelas, triggers, função handle_new_user)
2. `0002_rls.sql` (Row Level Security em todas as tabelas)
3. `0003_campanha.sql` (tabela campanha_posts + RLS de admin)

**Importante:** depois de correr o `0001`, ir a Supabase > Project Settings >
API > "Exposed schemas" e adicionar `infonte` à lista (separado por vírgula).
Sem isto o PostgREST não responde.

Para te tornares admin:
```sql
select infonte.tornar_admin('viv.saraiva@gmail.com');
```

## Variáveis de ambiente

Ver `.env.example`. Em resumo:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV` (sandbox | live)
- `RESEND_API_KEY`, `RESEND_FROM`
- `NEXT_PUBLIC_SITE_URL=https://infonte.vivannedossantos.com`
- `CRON_SECRET` (cron da Vercel só corre com Bearer <secret>)

## Deploy
1. Criar projeto no Supabase, correr as duas migrações no SQL editor.
2. Criar projeto no Vercel a partir deste repositório, branch
   `claude/awesome-davinci-SjpTr` (ou `main` depois de merge).
3. Adicionar as variáveis de ambiente acima.
4. Em Supabase Auth, ativar email + password. Os provedores Google e
   Facebook ficam disponíveis assim que forem configurados (Authentication
   > Providers).
5. Em PayPal Developer, criar app, copiar Client ID e Secret. Configurar
   o domínio do Vercel como Return URL aceite, se necessário.
6. Em Resend, criar API key, verificar domínio, definir RESEND_FROM.
7. O cron diário `/api/cron/abrir-etapas` é declarado em `vercel.json` e
   corre às 09:00 UTC. Vercel injeta o header `authorization: Bearer ...`
   se o `CRON_SECRET` for configurado.
8. Correr `npm run seed:etapas` a partir do local (ou via shell remota),
   apontando para o Supabase de produção.

## Notas de design
- Estética terra, ocre, serena. Muito espaço branco. Tipografia serif
  para corpo longo, sans para botões e interface.
- Voz íntima na segunda pessoa, sem ferida, com poder. pt-PT.
- Sem travessões em nenhum texto.
- O nome "infonte" escreve-se em minúsculas.
