# PROMPT PARA CLAUDE CODE, APP INFONTE

Copia tudo abaixo da linha e cola no Claude Code, na raiz de um projeto novo.

────────────────────────────────────────────────────────

Vais construir a Infonte, uma aplicação web (PWA) de um percurso de desenvolvimento pessoal em 7 etapas, em português de Portugal. Lê este prompt todo antes de escrever código, e executa por fases, parando no fim de cada fase para me mostrares.

## O QUE É

A Infonte é um percurso fechado de 7 etapas que leva a utilizadora da dispersão mental à ação concreta. A tese: a abundância não responde a quem a persegue, responde a quem se basta. Cada etapa entrega uma ferramenta prática que fica para a vida. Não há diagnóstico, não há ramificações, não há níveis. É linear: etapa 1 a 7, em ordem.

A autora é Vivianne dos Santos (nome e rosto reais). A marca é Infonte, da Sete Ecos.

## STACK OBRIGATÓRIA

- Next.js (App Router) + TypeScript
- Supabase (Postgres + Auth + Storage)
- Tailwind CSS
- next-intl (lança em PT, estrutura pronta para EN)
- PayPal para pagamento (NÃO Stripe; restrição de Moçambique)
- Resend para emails
- Deploy na Vercel
- PWA (manifest + service worker)

## IDENTIDADE VISUAL

Estética terra, ocre, serena, alinhada com a marca Sete Ecos. Tokens:
- Fundo claro: #F2E8DC (creme)
- Texto: #2A2018 (castanho muito escuro)
- Terracota/ocre (destaques, botões): #B8843D
- Castanho profundo (acentos): #5C3D24
- Verde-oliva suave (apoio): #6B6B47
- Títulos e corpo longo: serif elegante (ex: EB Garamond)
- Interface (botões, labels): sans (ex: Inter)
- Regra de escrita em TODO o texto que geras: nunca uses travessões (nem em-dash nem en-dash). Usa vírgula, ponto, dois pontos ou parênteses.
- Tom geral calmo, espaçado, que deixa respirar. Muito espaço branco. Nada de urgência, nada de stress visual.

## DADOS (Supabase)

```sql
CREATE TABLE IF NOT EXISTS utilizadoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  comprou BOOLEAN DEFAULT false,
  criada_em TIMESTAMPTZ DEFAULT now()
);

-- Conteúdo das 7 etapas
CREATE TABLE IF NOT EXISTS etapas (
  id INTEGER PRIMARY KEY,        -- 1 a 7
  slug TEXT NOT NULL,           -- esvaziar, bastar-se, clarear, focar, materializar, sustentar, tornar-se-fonte
  titulo TEXT NOT NULL,
  corpo_md TEXT NOT NULL,
  idioma TEXT DEFAULT 'pt'
);

-- Respostas dos campos de cada etapa
CREATE TABLE IF NOT EXISTS respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilizadora_id UUID REFERENCES utilizadoras(id),
  bloco_id TEXT NOT NULL,       -- ver lista abaixo
  valor TEXT,
  criada_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE (utilizadora_id, bloco_id)
);

-- Progresso e gating temporal
CREATE TABLE IF NOT EXISTS progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilizadora_id UUID REFERENCES utilizadoras(id),
  etapa INTEGER NOT NULL,        -- 1 a 7
  desbloqueada_em TIMESTAMPTZ,
  concluida_em TIMESTAMPTZ,
  UNIQUE (utilizadora_id, etapa)
);

-- Compra
CREATE TABLE IF NOT EXISTS compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilizadora_id UUID REFERENCES utilizadoras(id),
  paypal_order_id TEXT,
  valor NUMERIC,
  moeda TEXT,
  estado TEXT DEFAULT 'pendente',  -- pendente, paga
  criada_em TIMESTAMPTZ DEFAULT now()
);
```

Ativa RLS em utilizadoras, respostas, progresso, compras: cada utilizadora só lê e escreve as suas linhas (auth_id = auth.uid()). A tabela etapas é de leitura para autenticadas (mas o corpo das etapas 2 a 7 só deve ser servido a quem comprou; ver regra de acesso).

## BLOCO_ID DOS CAMPOS (exatamente estes)

Cada etapa tem um ou dois campos de texto livre que a utilizadora preenche e que ficam guardados:
- Etapa 1: `esvaziamento_etapa_1`
- Etapa 2: `inventario_etapa_2` e `receber_etapa_2`
- Etapa 3: `direcao_etapa_3`
- Etapa 4: `foco_etapa_4`
- Etapa 5: `primeiro_passo_etapa_5`
- Etapa 6: `realinhamento_etapa_6`
- Etapa 7: não tem campo de input, mostra os anteriores.

## SEED DO CONTEÚDO

Os 7 ficheiros markdown estão em `/content/` no repositório, com nomes `etapa-01-esvaziar.md` até `etapa-07-tornar-se-fonte.md`, mais `00-autora-bio.md` (a bio da autora) e `LEIA.md` (ignora este no seed). Escreve `scripts/seed-etapas.ts` que lê cada ficheiro e popula a tabela `etapas` (id do número no nome, slug do nome, titulo da primeira linha de título visível, corpo_md do resto). Idempotente (upsert por id). A bio da autora vai para uma página estática /sobre, não para a tabela etapas.

No corpo do markdown há marcadores que a app interpreta ao renderizar:
- `[ campo de texto, guardado em respostas, bloco_id "X" ]` -> renderiza um textarea que guarda em respostas com aquele bloco_id (autosave ao sair do campo).
- `[ Mostrar resposta "X" ]` (só na etapa 7) -> busca e mostra o valor que a utilizadora guardou nesse bloco_id.
- `[ Infonte ] / [ Vivianne dos Santos ] / [ Sete Ecos ]` no fim -> renderiza o bloco de assinatura da marca.

## REGRA DE ACESSO E GATING

- Etapa 1 é grátis (amostra). Qualquer pessoa registada pode fazer a Etapa 1 inteira, incluindo o campo.
- No fim da Etapa 1, mostra a oferta de compra (percurso completo, preço único, acesso vitalício). Só após compra (PayPal) é que as Etapas 2 a 7 ficam acessíveis.
- Gating temporal: cada etapa abre 3 dias (72h) depois de a anterior ter sido desbloqueada. Ao desbloquear, grava `desbloqueada_em`. A etapa seguinte só fica acessível 72h depois. 7 etapas com 3 dias entre cada dá um percurso de cerca de 3 semanas.
- A utilizadora pode sempre revisitar etapas já abertas e reler/reeditar as suas respostas (as ferramentas ficam para a vida, é um princípio do produto).

## ETAPA 7, DEVOLUÇÃO DINÂMICA

A Etapa 7 (Bloco A) mostra à utilizadora o que ela escreveu ao longo do percurso. Renderiza, nos sítios marcados com `[ Mostrar resposta "X" ]`, os valores guardados de: `esvaziamento_etapa_1`, `inventario_etapa_2`, `receber_etapa_2`, `direcao_etapa_3`, `foco_etapa_4`, `primeiro_passo_etapa_5`. Se algum estiver vazio, mostra um texto suave tipo "(não preencheste esta, podes voltar a ela)".

## PAGAMENTO (PayPal)

Percurso único, um preço, acesso vitalício. Mostra valor em R$ e US$ (processa na moeda da conta PayPal). PayPal JS SDK no frontend, verificação no backend (rota de API confirma a ordem e grava compra estado 'paga', e marca utilizadoras.comprou = true). Sem chaves no código, usa variáveis de ambiente.

## EMAILS (Resend)

- Magic link de entrada.
- Confirmação de compra.
- "A tua próxima etapa abriu" quando passar o gating de 3 dias (cron da Vercel diário que verifica progresso e dispara). Usa RESEND_API_KEY em ambiente.

## PÁGINAS

- Landing (a tese, o que a pessoa ganha no fim: clareza, foco, e um sonho partido em ações; CTA "começar a etapa 1, grátis").
- /sobre (bio da autora Vivianne, da `00-autora-bio.md`, com foto).
- Registo/entrada (magic link).
- Etapa 1 (grátis) -> oferta de compra no fim.
- Etapas 2 a 7 (após compra, com gating).
- Painel simples: ver em que etapa vai, quando abre a próxima, reler respostas.

## INTERNACIONALIZAÇÃO

next-intl, locale 'pt' por omissão, estrutura pronta para 'en'. Texto de interface em ficheiros de mensagens. O conteúdo das etapas vem da BD; a coluna idioma já existe para futura versão EN.

## VARIÁVEIS DE AMBIENTE

`.env.example` com Supabase (URL, anon, service), PayPal (client id, secret), Resend (api key), NEXT_PUBLIC_SITE_URL. Nunca commitar segredos.

## ORDEM DE EXECUÇÃO (para no fim de cada fase)

1. Setup (Next.js + Tailwind + next-intl + tokens visuais + layout calmo com a paleta terra e as fontes).
2. Supabase: migrações das tabelas e policies RLS.
3. Seed das 7 etapas a partir de /content. Confirma que entraram.
4. Auth (magic link) e modelo de utilizadora.
5. Renderizador de etapas: interpreta os marcadores (textarea com autosave, assinatura) e faz o gating temporal de 3 dias.
6. Etapa 1 grátis + oferta + PayPal + desbloqueio das etapas 2 a 7.
7. Etapa 7 com a devolução dinâmica das respostas.
8. Emails (Resend) + cron de abertura de etapas.
9. Landing + /sobre + painel.
10. PWA (manifest + service worker) e preparação de deploy na Vercel.

Começa pela Fase 1. No fim de cada fase, para e mostra-me o que fizeste antes de continuar.
