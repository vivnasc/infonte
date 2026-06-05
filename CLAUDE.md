# Contexto operacional, Infonte

Notas para o agente Claude Code, para não voltar a sugerir o que aqui está
desaconselhado.

---

## ESTADO ACTUAL (4 de Junho 2026)

**A campanha de 30 dias está em produção.** Começou 1 de Junho no Metricool
(IG + TikTok), termina 30 Junho. Os 60 posts foram importados em 3 rondas
(43 + 4 + 18 = 65 com 5 duplicados a limpar manualmente). Conteúdo, renders
HD e CSV estão todos a funcionar. Vercel Analytics activado.

**O que está pronto e funciona:**
- Painel `/admin` é o orchestrator único (reconstruir, render por semana,
  sync, agendar, CSV Metricool 93 colunas, biblioteca, renderizados)
- Render HD via GitHub Actions (1080×1350, 4:5, bold dourado, gota SVG)
- CSV Metricool com header oficial + filtros `?dias`, `?falhados=1`,
  `?lista=3-manha,5-tarde`
- Endpoint `diagnostico-falhados` lê dimensões reais dos PNGs
- Hashtags universais (copy-paste manual no Metricool):
  `@vivianne.dos.santos\n\n#clareza #foco #bastarse #infonte
  #desenvolvimentopessoal #mulheres #propósito #mentefocada #produtividade
  #mulheresempreendedoras #portugal #moçambique #brasil`

**Próxima tarefa pedida pela Vivianne**: lista de espera para o lançamento
do produto Infonte em **1 de Julho**. Plano completo está na secção
"TAREFA PARA A PRÓXIMA SESSÃO" mais abaixo neste ficheiro. ~1h de trabalho.
Há 4 perguntas para fazer-lhe antes de começar (% desconto, copy emails,
UTM, email duplo).

**O que NÃO fazer**:
- Não assumir que ela errou se algo está mal. Diagnostica primeiro com
  endpoint, depois propõe acção.
- Não pedir-lhe para correr `npm`, abrir GitHub, ou editar ficheiros.
  Tudo via botão no `/admin` ou URL no browser.
- Não iterar a adivinhar. Escreve endpoint de diagnóstico se há algo
  invisível para ti.
- Ler até ao fim deste ficheiro antes de propor qualquer mudança grande.

---

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

---

## Sessão 2026-05-30/31 (lançamento)

Esta foi a sessão do lançamento real. A campanha foi importada para o
Metricool em três rondas (43 → 4 → 18). Funcional mas penoso para a
Vivianne. Não voltar a fazer assim.

### Bugs caçados (e fixes)

1. **(gota) ficava literal no slide** — token do brief não era
   substituído. Fix: `substituirTokens` em `render-slides.ts` troca
   por SVG inline; `layoutFechoCta` mostra gota grande quando token
   está presente.
2. **Bold dourado não aparecia no slide 1** — KEYWORDS_BOLD não
   tinha dia 1. Adicionado. Bold passou a aplicar em RENDER-TIME via
   `aplicarBoldDinamico` no `parseTextoImagemToSlides`, não em
   formatar-bold-na-DB. Mudanças a `keywords-bold.ts` aparecem
   imediatamente no preview sem re-seed.
3. **Renders 9:16 (story) rejeitados pelo Metricool** (ratio 0.562).
   Vários dias no brief tinham `Formato: reel`. Fix: forçar
   `fmt = "feed"` (1080×1350, 4:5) em `parseTextoImagemToSlides`,
   ignorar `formato` do post. Reels viram carrosséis de imagens.
4. **Travessões no conteúdo Claude** — os próprios prompts tinham
   travessões, Claude espelhava. Fix: limpar prompts +
   `limparTravessoes` em render-time + endpoint
   `/api/admin/campanha/limpar-travessoes` para BD existente.
5. **`/admin/campanha` tinha 5 Fases duplicadas** com os mesmos
   endpoints que o painel `/admin`. Apagadas — só ficou lista de
   60 dias clicável para o editor.
6. **Sync render limit 5** — com 8 workflows simultâneos perdia 3.
   Subido para 50.
7. **CSV Metricool teve 5 bugs sequenciais**:
   - Date era DD/MM/YYYY, Metricool quer YYYY-MM-DD
   - Time era HH:MM, quer HH:MM:SS
   - TikTok rejeitava sem Post Privacy → "PUBLIC_TO_EVERYONE"
   - Cabeçalho minimal 6 colunas → cabeçalho oficial 93 colunas
   - Sem `force-dynamic`: cache Next devolvia CSV antigo após
     re-render. Adicionado.
8. **AgendarTudo: parse data com TZ offset** convertia 1 Junho
   Maputo → 31 Maio UTC. Fix: parse YYYY-MM-DD como data civil,
   incrementar dias localmente.
9. **CSV hora puxava UTC** porque Supabase devolve TIMESTAMPTZ em
   UTC. Fix: somar offset Maputo +2h ao parsear.
10. **Imagens repetidas nos slides** — pool com 1 imagem replicava
    em slides 1,3,5,7. Fix: `imagens-por-slide` gera N imagens; o
    `parseTextoImagemToSlides` alinha pool com `slidesComImagem`
    map (imagens[0]=slide1, imagens[1]=slide3, etc), não cycle.
11. **CTA ignorava imagem dele** — `imagens-por-slide` gerava imagem
    para slide CTA mas o `layoutFechoCta` só usava gradiente. Fix:
    usar imagemUrl como fundo com scrim escuro.
12. **Biblioteca não contava imagens-por-slide** como Replicate —
    regex só reconhecia `dia-XX-replicate.png` (formato antigo).
    Adicionado padrão `dia-XX[-tarde]-sN.png`.

### Componentes/endpoints adicionados

- `BotaoImagensPorSlide` (no painel) — orquestra 60 chamadas
  sequenciais para gerar 5 imagens por carrossel
- `BotaoRenderDias29e30` — botão único: expand + imagens + render
  para dia 29 e 30 (singles do brief)
- `BotaoRenderFalhados` — botão para os ~22 dias que falharam no
  Metricool (lista hardcoded)
- `BotaoRenderFalhados` tem botão ZIP integrado (`zip-falhados`)
  com paralelização e split por slot
- `/api/admin/campanha/exportar.csv?dias=N,M` — filtro por dias
- `/api/admin/campanha/exportar.csv?falhados=1` — só os 22 falhados
- `/api/admin/campanha/exportar.csv?lista=3-manha,5-tarde` — exacto
  por (dia,slot)
- `/api/admin/campanha/diagnostico-falhados` — verifica dimensões
  reais dos PNGs e diz porque falham
- `/api/admin/campanha/aplicar-bold-carrosseis` — Claude reaplica
  bold nos carrosséis já expandidos sem mudar texto
- `/api/admin/campanha/popular-hashtags` — popula `hashtags` em
  todos os 60 posts com pool do brief, rotacionando amplas/lusófonas
- Editor: botão "re-render este dia (HD)" abaixo do guardar
- `/admin`: card "Agendar e exportar" (AgendarTudo + ↓ CSV Metricool)
  + card "rever dias falhados" + workflows + sync

### Estado da campanha no fim da sessão

- 60 posts no Metricool (alguns com duplicados de rondas múltiplas)
- Campanha começa 1 Junho 2026 (segunda-feira), termina 30 Junho
- Hashtags NÃO foram aplicadas em nenhum dos posts importados
  (endpoint existe mas a Vivianne decidiu não re-importar)
- 4 posts agendados a hora errada nas primeiras rondas (fix TZ
  veio depois)

### O que NÃO repetir nunca

1. **Não assumir que o utilizador errou.** Sempre que ela diz "o que
   vejo aqui é diferente do que vejo ali", a resposta é "vou
   descobrir porquê", não "tens a certeza?". Custou-me ~10 mensagens
   de fricção por causa disto.
2. **Não iterar a adivinhar.** Quando há um bug que não consegues
   ver, escreve um endpoint de diagnóstico (como
   `diagnostico-falhados`) que devolve a verdade, em vez de propor
   3 hipóteses.
3. **Não pedir ao utilizador que faça diagnóstico manual.** Não
   "abre o CSV no Notepad e cola-me a linha 5". Faz um endpoint
   que extrai isso server-side. O utilizador não tem terminal nem
   paciência.
4. **Quando ela diz "n vou clicar 1 por 1", adicionar botão único.**
   Não responder com URL longo que ela tem que copiar.
5. **Não criar passos novos quando ela está exausta.** Se o painel
   já tem ReconstruirCampanha, não adicionar paralelo "ProduzirTudo".
   Estender o existente.
6. **Reunir requisitos UPFRONT.** Hashtags, fonte, redes, padrão
   visual — perguntar tudo no início, não descobrir bug a bug no
   import final.
7. **CSV bugs em cadeia** — sempre que mudar formato de CSV
   externo (Metricool, etc), descarregar template oficial primeiro
   e replicar EXACTAMENTE. Não inventar formato minimal.
8. **Cache Next 15**: route handlers que retornam dados dinâmicos
   TÊM que ter `export const dynamic = "force-dynamic"`. Senão
   Vercel cacheia e devolve dados velhos sem aviso.
9. **TIMESTAMPTZ em Supabase é SEMPRE devolvido em UTC.** Quando
   apresentares ao utilizador em hora local, somar offset
   manualmente (CAMPAIGN_TZ_OFFSET ou hardcoded Maputo +02:00).
10. **`memory` em Vercel route handlers**: bundles >100MB em ZIP
    rebentam o limite default. Stream em vez de buffer, ou split
    em múltiplos endpoints menores.

### Para a próxima campanha (se houver)

A Vivianne disse "não terá próxima aqui". Se voltar:

1. **Pergunta logo**:
   - Hashtags pretendidas (núcleo + rotativas)
   - Datas exactas
   - Quais redes (IG/TikTok/etc)
   - Quantas imagens por carrossel (1, 5, 10)
2. **Corre tudo no orchestrator único do painel**. Não inventes
   2º caminho.
3. **Antes de pedir import ao Metricool**, corre o
   `diagnostico-falhados` (adaptar para a nova campanha) e mostra
   que tudo está válido.
4. **CSV Metricool**: confirma headers oficiais antes. Eles mudam
   o template ocasionalmente.

---

## TAREFA PARA A PRÓXIMA SESSÃO: Lista de espera

A Vivianne prometeu "lista de espera" em vários posts da campanha
(dias 27, 28, 29 sobretudo, com o CTA "abri uma lista de espera,
quem entra recebe o aviso antes de todos, e uma condição especial
no lançamento"). Mas a app não tem isto. A subscrição do Infonte
abre **1 de Julho 2026**, ela quer dar **desconto a quem se
inscrever na lista** até essa data.

### Requisitos

1. **Página pública** `/lista-espera` (sem necessidade de login):
   - Form mínimo: nome + email
   - Tom editorial Infonte (cream/terra, EB Garamond, sem ruído)
   - Acima da fold: 1 frase ("Sê das primeiras a saber. Acesso
     antecipado + condição especial no lançamento.") + form +
     micro-copy de privacidade
   - Sucesso: confirmação inline ("Apontada. Email enviado.")
   - Erro de email duplicado: "Já estás na lista, obrigada."

2. **Schema Supabase** (schema `infonte`):
   ```sql
   create table infonte.lista_espera (
     id uuid primary key default gen_random_uuid(),
     nome text not null,
     email text not null unique,
     fonte text,             -- "instagram", "tiktok", "direto", etc
     criado_em timestamptz default now(),
     codigo_desconto text,   -- gerado no insert, ex: "INFONTE-EARLY-XXXX"
     convertido_em timestamptz,  -- preenchido quando comprar
     notas text
   );
   create index on infonte.lista_espera (criado_em desc);
   ```
   - RLS: bloqueado para tudo excepto service-role (admin acede
     com service-role bypass que já existe).

3. **Endpoint** `POST /api/lista-espera`:
   - Body: `{ nome, email, fonte? }`
   - Valida email (regex), trim, lowercase
   - Insere na BD (upsert por email, mantém criado_em original)
   - Gera `codigo_desconto` = `INFONTE-EARLY-${first4chars(uuid)}`
   - Dispara email para a Vivianne via Resend (já tem RESEND_API_KEY):
     "Nova inscrição na lista: nome (email), total agora N"
   - Dispara email para a registrante via Resend:
     - Subject: "Estás na lista, infonte abre 1 de Julho"
     - Body: agradecimento + código de desconto + data do
       lançamento + assinatura "Vivianne dos Santos"
   - Devolve `{ ok: true, codigoDesconto, total }`
   - Se erro Resend: insere na BD na mesma, devolve `ok: true` com
     `emailPendente: true` (Vivianne pode ver na admin)

4. **Página admin** `/admin/lista-espera`:
   - Tabela com colunas: data, nome, email, fonte, código,
     convertido (sim/não)
   - Contagem total no topo
   - Botão "exportar CSV" (nome, email, código) para usar em campanha
     de email no lançamento
   - Filtro: convertidas / não convertidas
   - Botão "marcar convertida" por linha quando ela vê venda no PayPal

5. **Integração com lançamento (1 Julho)**:
   - No checkout do Infonte, aceitar `?desconto=CODIGO` na URL
   - Se código existe em `lista_espera`, aplica desconto (ex: 25%)
     e marca `convertido_em` na BD
   - Não bloquear quem não tem código, só faz preço base

6. **Onde linkar a lista**:
   - Bio Instagram/TikTok (Vivianne actualiza manualmente)
   - Página principal `/` (botão âmbar "Lista de espera, abre 1
     de Julho")
   - Email das etapas grátis (se aplicável)

### Ordem de implementação (1 sessão de ~1h)

1. SQL no Supabase SQL Editor → cria tabela + RLS
2. Endpoint `/api/lista-espera/route.ts`
3. Página `/lista-espera/page.tsx` (server component + form action)
4. Página admin `/admin/lista-espera/page.tsx`
5. CSV export `/api/admin/lista-espera/exportar.csv`
6. Linkar na home `/page.tsx` com banner discreto
7. Documentar no CLAUDE.md o desconto e como aplicar

### O que perguntar à Vivianne antes de começar

- Qual % de desconto? (sugestão: 25% ou €30 off)
- Quer email duplo (confirmação dela + auto-reply à inscrita) ou só auto-reply?
- Quer copy específica para os emails ou uso template editorial Infonte?
- Quer rastrear UTM (`?utm_source=instagram` etc) para ver de onde
  vêm? (sugestão: sim, é uma linha de código extra)


---

## Sessão 2026-06-05: Lista de espera (FEITA)

A tarefa da lista de espera foi implementada. Decisões da Vivianne:
**25% de desconto**, **email duplo** (auto-reply à inscrita + aviso à
autora), **template editorial** infonte, **rastrear UTM**.

### O que ficou pronto

- **Migração** `supabase/migrations/0007_infonte_lista_espera.sql`,
  tabela `infonte.lista_espera` (RLS fechado, só service-role). Já
  corrida no Supabase SQL Editor.
- **Página pública** `/lista-espera` (nome + email, voz editorial).
  Captura a origem por `?utm_source=` ou `?fonte=` na coluna `fonte`.
  Linkar na bio do IG/TikTok com `?utm_source=instagram` etc.
- **Endpoint** `POST /api/lista-espera`: upsert por email (mantém
  `criado_em`), gera `INFONTE-EARLY-XXXX`, dispara os dois emails via
  Resend. Se o Resend falhar, grava na BD na mesma e devolve
  `emailPendente: true`.
- **Emails** em `src/lib/emails.ts` → `enviarEmailsListaEspera`. Aviso
  à autora vai para `ola@vivannedossantos.com` (mesmo destino das
  notificações de compra).
- **Admin** `/admin/lista-espera`: contagem, filtro convertidas/não,
  marcar convertida por linha, exportar CSV
  (`/api/admin/lista-espera/exportar.csv`).

### Como o desconto funciona (lançamento 1 Julho)

- Constante em `src/lib/lista-espera.ts`: `DESCONTO_PCT = 25`. Mudar
  aqui muda a percentagem em todo o lado.
- No checkout, `?desconto=CODIGO` no URL (ex:
  `/etapa/1?desconto=INFONTE-EARLY-3F9A`). O `BotaoPaypal` lê o código,
  mostra "25% de desconto" e envia-o ao criar a ordem.
- `criar-ordem` valida o código contra `lista_espera`. Se existir,
  aplica 25% sobre os $77 (= $57.75) e propaga o código ao return_url.
- `capturar` (return do PayPal) marca `convertido_em` na linha desse
  código quando a compra completa.
- Sem código, ou código inexistente, fica preço base. Nunca bloqueia.
- PayPal continua dependente das variáveis (PENDÊNCIA conhecida): o
  desconto só ganha efeito real quando as credenciais PayPal estiverem
  na Vercel.
