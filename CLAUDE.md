# Contexto operacional, Infonte

Notas para o agente Claude Code, para não voltar a sugerir o que aqui está
desaconselhado.

## Como a Vivianne trabalha

- **Sem desenvolvimento local.** Tudo é feito via web: Vercel para hosting,
  Supabase para base de dados (SQL Editor é web), GitHub para código,
  Claude Code para alterar código. Nunca propor `npm install`, `npm run
  dev`, `npm run seed:*` como instrução para correr na máquina dela. Se
  algo precisa de correr, tem de ser via:
  1. Botão no `/admin` da app
  2. SQL Editor do Supabase (cola e corre)
  3. Endpoint da app chamado por curl ou pelo browser
  4. Cron da Vercel
  5. Push para o repo (Vercel faz redeploy automático)

- **Branch de trabalho.** `main` é o que está deployed. Os PRs vêm do
  agente, fazem merge para `main`, e o Vercel faz o resto. Não há
  `git pull` da máquina dela.

- **Domínio.** `https://infonte.vivannedossantos.com` (DNS via Hostinger,
  CNAME a apontar a `cname.vercel-dns.com`).

## Stack

- Next.js 15 + App Router + TypeScript, deployed na Vercel.
- Supabase (Postgres + Auth) num projeto **partilhado com outras apps**.
  Por isso a Infonte vive toda no schema `infonte` (nunca em `public`).
  Os clientes Supabase já apontam `db: { schema: 'infonte' }` por omissão.
- next-intl, `pt` (default, sem prefixo) e `en` (em `/en`).
- Sem trigger em `auth.users` (partilhado com outros produtos). A linha
  em `infonte.utilizadoras` é criada lazy, na primeira visita, pela
  função `getUtilizadoraAtual()`. Isto evita poluir a tabela com
  utilizadoras de outros produtos que partilham o mesmo Supabase.
- Tailwind com tokens da paleta terra (`creme`, `ocre`, `terra-texto`,
  `castanho`, `ambar-*`, `oliva`).
- PayPal (REST), Resend (email), cron diário da Vercel.
- PWA: `manifest.webmanifest` + `sw.js`.

## Tarefas que precisam de ser feitas uma única vez na configuração

Ao montar do zero:

1. **Supabase, SQL Editor**: correr por ordem
   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_campanha.sql`

2. **Supabase, Settings > API > Exposed schemas**: adicionar `infonte`
   à lista. Isto é o que mais facilmente passa ao lado e parte tudo
   (PostgREST devolve 404 em todas as queries).

3. **Supabase, Authentication > URL Configuration**:
   - Site URL: `https://infonte.vivannedossantos.com`
   - Redirect URLs: o mesmo + `/auth/callback`, e o URL do preview do
     Vercel para testes (`https://infonte-*.vercel.app/auth/callback`).

4. **Supabase, Authentication > Providers > Email**: confirmar que
   "Confirm email" está desligado para a fase de teste, senão é preciso
   SMTP configurado para conseguir registar conta.

5. **Vercel, Settings > Environment Variables** (Production e Preview):
   ```
   NEXT_PUBLIC_SITE_URL=https://infonte.vivannedossantos.com
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   RESEND_API_KEY=...
   RESEND_FROM=infonte <ola@vivannedossantos.com>
   CRON_SECRET=<string aleatória longa>
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=...   (depois)
   PAYPAL_CLIENT_SECRET=...           (depois)
   PAYPAL_ENV=sandbox                 (live só quando estiver tudo testado)
   ```

6. **Tornar-se admin** (depois de fazer login uma vez):
   No Supabase SQL Editor:
   ```sql
   select infonte.tornar_admin('viv.saraiva@gmail.com');
   ```

7. **Seed dos conteúdos** (etapas e campanha):
   Entrar em `/admin`, secção "configuração inicial", e clicar nos botões
   "popular etapas" e "popular campanha". Os endpoints são também
   chamáveis via curl com a sessão de admin.

## Coisas que NÃO existem em local

- Não há `.env.local` da Vivianne, todas as variáveis estão na Vercel.
- Não há `node_modules` no laptop dela.
- Não há terminal aberto.

## Pendências conhecidas

- **PayPal**: a integração está pronta no código, mas as variáveis ainda
  não foram preenchidas. Funções `/api/paypal/*` devolvem 500 ou redirect
  até as credenciais existirem. O botão "abrir o percurso completo" só
  fica realmente funcional depois.
- **SMTP de confirmação de email**: a app usa Resend para os emails da
  app (etapas, compra), mas a confirmação de email do Supabase Auth
  precisa de SMTP configurado no painel do Supabase, ou de ter o
  "Confirm email" desligado.

## Convenções de escrita

- Sem travessões (em-dash nem en-dash). Vírgulas, pontos, parênteses.
- O nome "infonte" em minúsculas.
- pt-PT, voz íntima na segunda pessoa, sem ferida, com poder.
