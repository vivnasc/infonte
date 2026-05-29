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
   CRON_SECRET=<string aleatória longa>
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=...   (depois)
   PAYPAL_CLIENT_SECRET=...           (depois)
   PAYPAL_ENV=sandbox                 (live só quando estiver tudo testado)
   ADMIN_EMAIL=viv.saraiva@gmail.com
   ADMIN_PASSWORD=<palavra-passe forte só tua>
   ANTHROPIC_API_KEY=...   (gerar posts da tarde e prompts MJ)
   REPLICATE_API_TOKEN=... (gerar imagens automáticas via FLUX 1.1 Pro)
   ```

   `REPLICATE_API_TOKEN` liga o pipeline automático de imagens. No
   editor de cada dia há "Gerar imagem automática" que chama a Claude
   para o prompt, FLUX 1.1 Pro para a imagem, e faz upload directo
   para o Supabase Storage. Em /admin/campanha há três botões de
   lote (1-10, 11-20, 21-30) para correr os 30 dias.

   **GitHub Actions para render HD dos slides** (Playwright em CI, sem
   o timeout do Vercel). Liga-se via:

   - Vercel envs: `GITHUB_DISPATCH_TOKEN` (PAT com scope `actions:write`),
     `GITHUB_REPO_OWNER` (vivnasc), `GITHUB_REPO_NAME` (infonte),
     `GITHUB_DISPATCH_REF` (main).
   - GitHub repo secrets (Settings > Secrets and variables > Actions):
     `INFONTE_SUPABASE_SERVICE_ROLE_KEY` e `NEXT_PUBLIC_SUPABASE_URL`.

   O endpoint `/api/admin/campanha/render-submit` dispara o workflow
   `.github/workflows/render-infonte-artes.yml`, que corre
   `scripts/render-artes-ci.ts` em Node 20 com Chromium do Playwright,
   gera as PNGs em 2160x3840 e faz upload para
   `infonte-assets/infonte-campanha-hd/<jobId>/`. Em /admin/campanha
   há três botões para teste 3 dias, 30 dias da manhã, 30 dias da tarde.

   `ADMIN_EMAIL` e `ADMIN_PASSWORD` ligam um bypass directo do admin.
   Ao submeter estas credenciais em /entrar, a app põe um cookie
   assinado com `SUPABASE_SERVICE_ROLE_KEY` e redireciona para /admin,
   sem criar conta no Supabase Auth (que é partilhado com outras apps).
   As páginas /admin/* lêem com service-role, por isso passam por cima
   do RLS sem precisar de sessão Supabase.

6. **Tornar-se admin via Supabase** (apenas se não usares o bypass acima):
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

---

## Para a próxima sessão Claude, lê antes de propor seja o que for

A Vivianne está esgotada de iterações. Esta secção lista o que correu mal
na sessão de 2026-05-29 para não repetires.

### Padrão aprovado, replicar SEM inventar

O fluxo da Infonte é cópia adaptada do SyncHim. Ler estes três docs
antes de qualquer mudança grande:

1. https://github.com/vivnasc/SyncHim/blob/main/PIPELINE-CIRCUITO-COMPLETO.md
2. https://github.com/vivnasc/SyncHim/blob/main/PIPELINE-UX-PRODUCAO.md
3. https://github.com/vivnasc/SyncHim/blob/main/EXPERIENCIA-PRODUCAO-CONTEUDO.md

Estrutura da app (não desviar):

- `/admin` = painel SyncHim. Próxima acção sugerida + funil 6 colunas
  + tabela cobertura semanal com botões render por semana +
  tabela de workflows GitHub Actions (auto-actualiza 15s, com botão
  cancelar inline) + sincronizar + agendar tudo + seeds.
- `/admin/campanha` = lista de 60 posts em 4 semanas, pílulas estado,
  fases (diagnóstico → conteúdo → imagens → render → exportar).
- `/admin/campanha/[dia]` = editor 3 colunas (preview slide grande
  esquerda, form ao meio com texto/legenda/pergunta/hashtags/drop
  imagens, à direita slides nav + publicação + acções), com setas
  ← dia X dia Y → no topo.
- `/admin/preview-tudo` = grelha de todos os posts × slides com
  toggle "antes (HTML)" / "depois (PNG renderizado)".
- `/admin/biblioteca` = galeria imagens em Storage.

### Erros desta sessão a não repetir

1. **Não inventes wizards/orquestradores que ela não pede.** Acabei
   por escrever ModoGuiado, ProduzirTudo, ReconstruirCampanha,
   PreviewSemana — 1148 linhas de sprawl que foi preciso apagar.
   O fluxo SyncHim é: painel → editor → exportar. Não há wizard.
2. **`tsc --noEmit` não chega.** Corre sempre `npx next build` local
   antes de empurrar. Vercel apanha erros de JSX que o tsc deixa passar.
   Cada build falhado consome créditos do plano Pro $20/mês dela.
3. **Não substituas o brief dela.** O conteúdo está em
   `infonte-campanha-30-dias/*.md`. Cada dia tem slides numerados,
   legenda, pergunta. O parser do seed extrai isto. O `formatar-bold`
   deve ser ADITIVO (envolver palavras-chave com `**`), não destruir
   estrutura (eu reescrevi os textos dela em 4 linhas sem numeração
   e parti todos os carrosséis).
4. **gerar-tarde tem de respeitar as regras de voz dela**: sem
   "universo", "manifesta", "mindset", "abundância" sozinha,
   "energia", "vibração", "alma", "cura", "luz", "alinhamento",
   "abraça-te", "ama-te", "hustle", "growth". A tarde é o "Eco" do
   manhã, frase visceral de reconhecimento, NUNCA repetição do manhã.
5. **Tema da tarde não pode parecer duplicação.** Usar `Eco · X` ou
   título próprio, nunca `X (emocional)`.
6. **Nunca pedir à Vivianne para ir ao GitHub.** Workflows são geridos
   dentro do estúdio em `/admin` (componente `WorkflowsRender`).
   Cancelar runs, ver status, tudo no estúdio.
7. **Não forçar single-statements em mini-carrosséis.** Quem é
   statement único no brief fica 1 slide. Quem tem numerados vira
   carrossel com capa + N + cta. parseTextoImagemToSlides já faz isto
   correctamente — não voltar a quebrar.
8. **GitHub Actions workflow tem que usar Node 22.** Node 20 não tem
   WebSocket nativo, supabase-realtime-js falha. `ubuntu-22.04` (não
   `ubuntu-latest`, que rola para 24.04 e parte deps apt).
9. **Não fazer empty trigger commits ("Trigger redeploy").** Vercel
   redeploya em cada push, gasta créditos. Se precisares mesmo de
   forçar, faz `vercel deploy` direto, não via git.
10. **Não pedir à Vivianne para decidir A/B/C/D.** Aplica o teu
    juízo. Mostra etapas intermédias. Ela diz se não gosta.
11. **render-artes-ci NÃO toca em campanha_posts.imagens.** Os PNGs
    renderizados vão só para Storage + result.json. Se actualizares
    imagens da BD com URLs dos renders, o preview HTML usa-os como
    fundo recursivo e dá visual partido.
12. **Lotes de imagens Replicate: máximo 5 dias por lote.** 10 dias em
    paralelo com 0 existentes ultrapassa o 60s do Vercel.
13. **No editor, setas ← dia X dia Y → no topo** são obrigatórias.
    Voltar à lista para mudar de dia é desnecessário.
14. **Preview sempre visível.** No editor, à esquerda em tamanho real
    escalado. Em `/admin/preview-tudo`, grelha de mini-iframes.
    Nunca esconder preview por trás de cliques.

### Conteúdo

O brief da Vivianne é o conteúdo. Não inventes nem reescrevas:

- `infonte-campanha-30-dias/00-perfil-bio.md` — bio Instagram/TikTok,
  destaques, decisões de marca
- `infonte-campanha-30-dias/01-estrutura-30-dias.md` — arco de 4
  semanas (ferida → virada → método → porta), formato por tipo,
  regras de voz, hashtags base
- `infonte-campanha-30-dias/semana-{1,2,3,4}-posts.md` — 30 dias com
  Formato, Slides ou Texto na imagem, Legenda, Pergunta

O seed populates `campanha_posts.texto_imagem`, `legenda`, `pergunta`.
formatar-bold adiciona `**bold**` às keywords listadas em
KEYWORDS_BOLD por dia, sem mexer em estrutura. gerar-tarde produz o
Eco emocional via Claude com o prompt em
`/api/admin/campanha/gerar-tarde/route.ts` (que tem as regras de voz).

### Lições operacionais

- Custos: Replicate FLUX 1.1 Pro $0.04/imagem, total ~$2.40 (60
  imagens manhã + tarde). Claude tarde ~$0.15 (30 gerações).
- Lotes idempotentes: re-clicar = $0 se prefer-existing e tudo já feito.
- Workflow Node 22, ubuntu-22.04, install playwright chromium with-deps.
- Plan Vercel Pro $20/mês, gastou ~$3 em 12h de iteração intensa
  com Modo Guiado. Sem isso teria gasto menos de $1.

### O que está pronto

Após commit `e071252`:
- Painel SyncHim limpo (sprawl apagado)
- Editor 3 colunas com setas de navegação
- Pré-visualizar tudo com toggle antes/depois
- Biblioteca, workflows na interface, sync, agendar tudo, reset rendering
- Seed parser fixed (30/30 dias OK), bold aditivo, tarde com voice rules
- Render HD via GH Actions Node 22 ubuntu-22.04

### O que falta confirmar visualmente

A Vivianne ainda não conseguiu ver:
- Dia 1 com os 5 slides reais do MANIFESTO (parser fixed mas ela
  precisa clicar `popular campanha` outra vez)
- PNGs renderizados em `depois (PNG renderizado)` (ela viu pretos —
  pode ser que os renders antigos sejam de quando `texto_imagem` estava
  vazio ou destruído pelo BOLD_MAP destrutivo)

Próximo passo dela: `/admin` → `reconstruir tudo agora` → verificar
em `/admin/campanha/1` se os 5 slides aparecem → se sim, continuar
para render e exportar.

