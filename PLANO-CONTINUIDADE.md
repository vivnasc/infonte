# PLANO DE CONTINUIDADE INFONTE

Documento único de decisões. Lê isto antes de propor qualquer mudança.
Tudo aqui está **decidido** desde o brief da Vivianne ou consolidado
ao longo das sessões. Não voltar a perguntar.

---

## 1. Identidade da marca (do brief, fechado)

- **Nome:** infonte (sempre minúsculas)
- **Subtítulo:** "da sete ecos"
- **Conta:** @vivianne.dos.santos (rosto presente, primeira pessoa)
- **Paleta:** terra (#2E1D12), creme (#F2E8DC), ocre (#B8843D), âmbar
  (#EBAE4A), oliva (#5C5C3E), castanho (#4A2F1B)
- **Símbolo:** gota SVG (NUNCA unicode ✦ ou similar)
- **Tipografia:** EB Garamond serif para títulos + Inter sans para meta
- **Voz:** pt-PT, segunda pessoa íntima ("tu"), sem ferida, com poder
- **Caption author tag:** @vivianne.dos.santos via env
  `CAPTION_AUTHOR_TAG` injectado antes das hashtags no CSV Metricool

## 2. Estrutura da campanha (do brief, fechado)

- **30 dias**, um arco por semana:
  - Semana 1 (dias 1-7): A ferida que ninguém nomeia
  - Semana 2 (dias 8-15): A virada
  - Semana 3 (dias 16-23): O método
  - Semana 4 (dias 24-30): A porta
- **Dois posts por dia:**
  - **Manhã (10h):** didáctico, ensina, desenvolve a tese
  - **Tarde (13h):** emocional, reconhece, NÃO ensina, NÃO vende
- **Total: 60 posts** = 30 manhã + 30 tarde
- **Dias âncora (single único por design):** 7, 15, 23 (resumos
  semanais). NÃO expandir em carrossel, frase única é o impacto.

## 3. Voz editorial (fechado, não negociar)

**Banidas (NUNCA usar):**
- universo, manifesta, mindset
- abundância sozinha (só ligada a contexto)
- energia, vibração, frequência
- alma, cura, luz, alinhamento
- abraça-te, ama-te, tu mereces tudo
- hustle, growth, abundance mindset

**Estilo:**
- Frases curtas, verbos fortes, concreto sobre abstracto
- Sem travessões longos (— en/em-dash). Só vírgula, ponto, parênteses
- Início de frases em maiúscula
- "Quem se bastou a falar para quem persegue", não guru

## 4. Estrutura de slides (fechado)

### Carrosséis explícitos do brief
Os dias com `Slides:` numerados no markdown **respeitam EXACTAMENTE
o número que a Vivianne escreveu**. Não adicionar, não remover.

- Dia 1 MANIFESTO: 5 slides
- Dia 5 A MULHER TALENTOSA: 3 slides
- Dia 9 BASTAR-SE: 3 slides
- Dia 12 SABOTAR O BOM: 4 slides
- Dia 17 CONTAR O QUE JÁ TENS: número do brief
- Dia 18 OS TRÊS FILTROS: número do brief
- Dia 20 PARTIR O SONHO: número do brief
- Dia 22 O ENCONTRO CONTIGO: número do brief
- Dia 26 O QUE NÃO É: 4 slides
- Dia 27 AS SETE ETAPAS: 7 slides
- (outros que tenham `Slides:` no markdown)

### Expansões via Claude (singles → carrosséis)
Os dias com `Texto na imagem:` (single statement) **excepto os âncora
7/15/23** são expandidos em **10 slides** via Claude:

**Manhã (10 slides didáctico):**
1. Hook impactante
2. Reconhecimento (onde aparece na vida)
3. Quebra (contradição inesperada)
4. Porquê profundo (camada 1)
5. O que está por trás (camada 2)
6. Cena concreta
7. Consequência (custo de não ver)
8. O que abre quando se vê
9. Pergunta que para o scroll
10. Âncora / verdade que fica

**Tarde (10 slides emocional):**
1. Feeling raw
2. Onde aparece no corpo
3. Onde aparece no dia
4. O que está por trás (camada 1)
5. Mais fundo (camada 2)
6. Verdade que custa admitir
7. Peso de carregar sozinha
8. Alívio mínimo de nomear
9. Frase que para o scroll
10. Silêncio que não conclui

### Renderização (fechado)
- **Primeiro slide** = layout "capa" (foto-cheia se tiver imagem,
  statement se não tiver)
- **Slides do meio** = layout "conteudo" (foto-cheia ou claro/statement,
  alternando)
- **Último slide** = layout "cta" (fecho com estilo distinto, gota,
  link na bio em maiúsculas)
- **NÃO adicionar capa fake com tema** (era duplicação do header)
- **NÃO adicionar CTA hardcoded** atrás dos slides do brief

## 5. CTA (fechado)

- **Manhã:** o último slide do carrossel (do brief ou expansão) é o
  "fecho", com estilo CTA visual. Conteúdo: âncora/marca/link.
  Para os dias do brief que já tinham CTA inline (dia 1 "infonte.
  clareza, foco, acção. (gota)"), respeita o que está escrito.
  Para expansões, slide 10 é "verdade que fica", NÃO venda agressiva.
- **Tarde:** SEM CTA. A tarde reconhece, não vende. Último slide é
  "silêncio que não conclui".
- **Caption autor tag** (`@vivianne.dos.santos`) vai na legenda do
  CSV Metricool, antes das hashtags, automaticamente.

## 6. Imagens (fechado)

- **Imagens MJ/Replicate** ficam em `campanha_posts.imagens` (array)
  e `imagem_url` (a primeira). São FUNDOS dos slides.
- **PNGs renderizados HD** vão para `infonte-assets/infonte-campanha-hd/<jobId>/`
  no Storage. **NUNCA escrever em `campanha_posts.imagens`** com
  URLs de renders (criaria loop visual no preview).
- **Replicate FLUX 1.1 Pro** com prompt da Claude, ~$0.04/imagem.
- **Lotes máximos de 5 dias por chamada** para caber em 60s do Vercel.
- **Estratégia default:** `prefer-existing` (poupa créditos).
- Claude tem liberdade para sugerir cenas com pessoas em interacção,
  objectos, paisagens ou abstracto. **PROIBIDO:** close-ups de cara,
  retratos de cabeça, faces à câmara. Pessoas a distância média/longa,
  de lado ou costas, em ambientes.

## 7. Render HD (fechado)

- **Playwright em GitHub Actions**, NÃO no Vercel runtime.
- **Node 22** (não 20 — supabase-realtime-js precisa de WebSocket
  nativo).
- **`ubuntu-22.04`** explícito (não `ubuntu-latest`, que rola para
  24.04 e parte deps apt).
- **Resolução:** 2160x3840 (deviceScaleFactor 2 sobre 1080x1920).
- **Workflow:** `.github/workflows/render-infonte-artes.yml`.
- **Script:** `scripts/render-artes-ci.ts`.
- **Geridos dentro do estúdio** em `/admin` (componente
  `WorkflowsRender`). NUNCA mandar a Vivianne ao GitHub.

## 8. Agendamento (fechado)

- **Distribuição:** 30 dias consecutivos a partir da data inicial
  escolhida. Manhã 10h, tarde 13h (configuráveis).
- **Timezone:** Maputo `+02:00` por defeito (env `CAMPAIGN_TZ_OFFSET`).
- **Estado:** `agendado` após click em "agendar tudo".
- **Botão único:** `AgendarTudo` no painel, escolhe data e horas,
  preenche os 60 posts numa chamada.

## 9. Export Metricool (fechado)

- **CSV com 6 colunas:** date, time, text, link, image, networks.
- **2 modos:** default (1 linha por dia, redes em ;) e por-rede
  (1 linha por dia × rede).
- **Caption author tag** injectada automaticamente antes das hashtags.
- **Sem ZIP de PNGs** (Metricool puxa pela URL).
- **Endpoint:** `/api/admin/campanha/exportar.csv`.

## 10. Arquitectura da app (fechado, SyncHim-style)

- `/admin` — painel: próxima acção, funil 6 colunas, cobertura semanal
  com render bulk por semana, workflows (auto-actualiza 15s, cancelar
  inline), sincronizar, AgendarTudo, ReconstruirCampanha, BotaoReset,
  configuração inicial (seeds)
- `/admin/campanha` — lista 60 posts, 4 semanas, pílulas estado, fases
- `/admin/campanha/[dia]` — editor 3 colunas:
  - **ESQUERDA (340px, sticky):** EditorPreviewPane, preview grande
    do slide actual com setas anterior/próximo
  - **MEIO (1fr):** form (formato, texto, legenda, pergunta, hashtags,
    link, drop imagens, notas)
  - **DIREITA (320px):** EditorSlidesNav + agendar + prompt MJ +
    Replicate + arte PNG + preview legenda + guardar
  - **Topo:** setas `← dia X · dia Y →` para navegar sem voltar à lista
- `/admin/preview-tudo` — grelha de todos os posts × slides com toggle
  "antes (HTML)" / "depois (PNG renderizado)"
- `/admin/biblioteca` — galeria de imagens em Storage

## 11. Erros que NÃO se repetem

1. **Não inventes wizards/orquestradores que ela não pede.** 1148
   linhas de sprawl foram apagadas (ModoGuiado, ProduzirTudo, etc.).
2. **`npx next build` antes de cada push.** `tsc --noEmit` não chega.
3. **Não substituas o brief dela.** Os textos vêm dos markdowns.
   `formatar-bold` é ADITIVO (envolve keywords), não destrutivo.
4. **Workflows dentro do estúdio.** Nunca dizer "vai ao GitHub".
5. **Não pedir A/B/C/D.** Aplicar juízo, mostrar resultado, ela
   corrige se preciso.
6. **Não fazer empty trigger commits.** Cada push gasta créditos
   Vercel Pro.
7. **Lotes Replicate máx 5 dias.** Maior dá 504 timeout.
8. **`render-artes-ci.ts` NÃO toca em `campanha_posts.imagens`.**
9. **Setas anterior/próximo no editor são obrigatórias.**
10. **Preview sempre visível**, não esconder atrás de cliques.
11. **Não forçar singles em mini-carrosséis genéricos** com capa-tema
    duplicada e CTA hardcoded.
12. **Capa do carrossel = primeiro slide do brief**, não rótulo do tema.
13. **Singles expandem para 10 slides via Claude**, não 3 nem 5.
14. **Tarde respeita arco** (tu não vendes, reconheces).
15. **Não inventar conteúdo. Não reescrever a brief.** O brief é
    sagrado, em `infonte-campanha-30-dias/*.md`.

## 12. Fluxo completo de produção (ordem)

1. Seeds (idempotente):
   - Popular 7 etapas
   - Popular 30 manhã (do brief markdown)
2. Bold aditivo nas keywords da manhã
3. Expansão singles manhã → 10 slides via Claude
   (salta dias 7/15/23 âncora; salta dias já com slides numerados
   no brief)
4. Wipe das 30 tarde antigas
5. Gerar 30 tarde (Claude, voz emocional)
6. Expansão singles tarde → 10 slides via Claude
   (salta 7/15/23)
7. Imagens manhã 1-30 (6 lotes de 5, prefer-existing)
8. Imagens tarde 1-30 (6 lotes de 5, prefer-existing)
9. Render HD 30 manhã (workflow GH Actions)
10. Render HD 30 tarde (workflow GH Actions)
11. Sincronizar (lê result.json, promove a `pronto`)
12. Agendar tudo (data inicial + horas)
13. Export CSV Metricool
14. Importar no Metricool

**Botão único que orquestra 1-10:** "reconstruir tudo agora" no painel.

## 13. Custos esperados

- Replicate (60 imagens): ~$2.40 ($0.04/imagem)
- Claude tarde (30 gerações): ~$0.15
- Claude expansão singles (~44 × $0.015): ~$0.66
- **Total Claude+Replicate:** ~$3.20
- GitHub Actions: grátis dentro do plano
- Vercel Pro: $20/mês (consumo normal <$1 em 12h sem sprawl)

## 14. Estado actual (commit `284cdf1`)

- Painel SyncHim limpo
- Editor 3 colunas com setas
- Preview-tudo com toggle antes/depois
- Biblioteca, workflows na interface
- Seed parser fixed (30/30 dias OK)
- Bold aditivo (preserva números)
- Expansão singles em 10 slides (manhã didáctico + tarde emocional)
- Carrosséis renderizam EXACTAMENTE os slides do brief, sem capa fake
  nem CTA hardcoded
- Render HD em Node 22 + ubuntu-22.04

## 15. Próximo passo único

`/admin` → `reconstruir tudo agora`. Aceitar o que sai. Diz se algum
dia ficou mal — vamos a esse específico, não voltamos a discutir a
estrutura inteira.
