import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { limparTravessoes } from "@/lib/limpar-texto";

export const runtime = "nodejs";
export const maxDuration = 60;

// Expande posts single-statement em mini-carrosséis de 3 slides via
// Claude, respeitando o tom de cada slot:
//   - manhã: didáctico, desenvolve a ideia (hook → razão → consequência)
//   - tarde: emocional, aprofunda o reconhecimento (raw → fundo → verdade)
//
// Salta posts que já têm slides numerados (idempotente). Salta posts
// "âncora" que devem ficar como statement único (resumos, tese central).
//
// POST sem body. Query params:
//   slot=manha|tarde  (default: ambos)
//   inicio=1..30      (default: 1)
//   fim=1..30         (default: 30)

const PROMPT_MANHA = (texto: string, legenda: string, tema: string) => `És a Vivianne dos Santos, autora da Infonte. Vais escrever um carrossel DIDÁCTICO de 10 slides que ENSINA um conceito em profundidade. Estilo SyncHim: cada slide constrói sobre o anterior, define mecanismo, dá exemplos concretos, liberta da culpa, mostra alternativa.

TEMA HOJE: ${tema}
Frase inicial actual: "${texto}"
Legenda completa (para contexto teu, não para reproduzir): "${legenda}"

NÃO É post de venda. NÃO menciones produto, método, etapa, infonte, link na bio. Ensina o conceito.

ESTRUTURA OBRIGATÓRIA dos 10 slides:
1. Hook: frase impactante que afirma a tese (podes usar a actual ou variação muito próxima)
2. Define: nomeia exactamente o que está em causa. Dá-lhe nome.
3. Mecanismo: descreve COMO funciona. A engrenagem, o ciclo, o padrão.
4. Cena 1: exemplo concreto. Uma situação real e curta onde isto aparece (cozinha, secretária, conversa, decisão).
5. Cena 2: segundo exemplo, num contexto diferente. Mostra que é padrão, não acaso.
6. Por que não é culpa: liberta a leitora. Mostra a origem (cultural, familiar, sistema). Ela não está partida.
7. O custo: o que ela perde por não ver isto. Concreto, não abstracto.
8. A virada: o que muda QUANDO se vê. Não promete cura, mostra movimento.
9. Pergunta-âncora: uma pergunta que a faz olhar para a vida dela agora. Pede 1 frase de resposta.
10. Verdade-âncora: frase final que fica. NÃO é CTA. É o "agora sabes".

CADA SLIDE: 1-3 linhas curtas. Frase completa em cada slide, lê-se sozinha.

DESTAQUE OBRIGATÓRIO: em CADA slide, envolve com **negrito** entre 1 e 3 palavras-chave que mais doem ou que carregam o significado. Sai em dourado no slide. Não enches a frase de bolds, só os pontos de tensão.

REGRAS DE VOZ (não negociáveis):
- pt-PT, segunda pessoa (tu), íntima, sem ferida, com poder
- NUNCA usar travessão longo (—) nem en-dash (–). Sem excepção. Usa vírgulas, pontos, dois pontos, parênteses
- Sem guru: NUNCA "universo", "manifesta", "mindset", "abundância" sozinha, "energia", "vibração", "alma", "cura", "luz", "alinhamento"
- Sem coach: "abraça-te", "ama-te", "tu mereces tudo"
- Sem inglês de marketing: "hustle", "growth"
- Sem CTA de venda nem menção a produto
- Verbos fortes, concreto sobre abstracto

Devolve APENAS as 10 linhas numeradas:
1. [linha]
2. [linha]
3. [linha]
4. [linha]
5. [linha]
6. [linha]
7. [linha]
8. [linha]
9. [linha]
10. [linha]

Sem prefácio, sem aspas, sem markdown extra.`;

const PROMPT_TARDE = (texto: string, tema: string) => `És a Vivianne dos Santos. Vais escrever um carrossel EMOCIONAL de 10 slides para as 13h. NÃO ensina. RECONHECE.

Estilo: cada slide aprofunda o sentir. Nomeia. Não dá solução, não dá conselho, não vende. A leitora chega no fim mais vista, não mais informada.

TEMA HOJE: ${tema}
Frase inicial actual: "${texto}"

ESTRUTURA OBRIGATÓRIA dos 10 slides:
1. Feeling raw: a frase actual ou eco muito próximo
2. Nomear o sentimento: dá nome àquele aperto, peso, vazio
3. No corpo: onde isto se sente fisicamente (peito, garganta, ombros, estômago)
4. No dia: que momento, que gesto traz isto (acordar, conversar, sozinha à noite)
5. Cena 1: situação curta onde aparece sem aviso
6. Cena 2: outra situação, outro contexto
7. O que está por trás (camada 1): a primeira camada por baixo do feeling
8. Mais fundo (camada 2): a verdade que custa nomear
9. Frase que para: uma frase que a faz parar de scrollar. Sem solução.
10. Silêncio: frase que NÃO conclui. Deixa-a no sentir.

CADA SLIDE: 1-2 linhas curtas. Sussurro, não pregação.

DESTAQUE OBRIGATÓRIO: em CADA slide, envolve com **negrito** 1 a 2 palavras que carregam o peso emocional. Sai em dourado no slide. Mínimo, certeiro. Não enches a frase.

REGRAS DE VOZ (não negociáveis):
- pt-PT, segunda pessoa (tu), íntima
- NUNCA usar travessão longo (—) nem en-dash (–). Sem excepção. Usa vírgulas, pontos, dois pontos, parênteses
- Sem solução, sem conselho, sem CTA, sem menção a produto
- Sem guru: NUNCA "universo", "manifesta", "mindset", "abundância" sozinha, "energia", "vibração", "alma", "cura", "luz", "alinhamento"
- Sem coach: "abraça-te", "ama-te", "tu mereces tudo"
- Tom: quem também sente isto a sussurrar para quem sente. Não consoladora, não salvadora.

Devolve APENAS as 10 linhas numeradas:
1. [linha]
2. [linha]
3. [linha]
4. [linha]
5. [linha]
6. [linha]
7. [linha]
8. [linha]
9. [linha]
10. [linha]

Sem prefácio, sem aspas.`;

// Dias âncora que ficam single (frase única forte por design):
// resumos semanais, tese central, revelação da marca.
const ANCORA_MANHA = new Set([7, 15, 23]); // resumos
const ANCORA_TARDE = new Set([7, 15, 23]);

function temSlidesNumerados(texto: string): boolean {
  const m = texto.match(/^\d+\.\s*.+$/gm);
  return !!(m && m.length >= 2);
}

async function expandirComClaude(
  apiKey: string,
  texto: string,
  legenda: string,
  tema: string,
  slot: "manha" | "tarde"
): Promise<string | null> {
  const prompt = slot === "manha"
    ? PROMPT_MANHA(texto, legenda, tema)
    : PROMPT_TARDE(texto, tema);
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  const out = j.content?.[0]?.text?.trim();
  if (!out) return null;
  // Verificar que tem pelo menos 10 linhas numeradas
  const lines = out.split("\n").filter((l: string) => /^\d+\.\s+.+/.test(l.trim()));
  if (lines.length < 10) return null;
  // Sanitiza travessões mesmo que o prompt os proíba (Claude às
  // vezes meta um — em apostos).
  return limparTravessoes(lines.slice(0, 10).join("\n"));
}

export async function POST(request: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ erro: "ANTHROPIC_API_KEY ausente" }, { status: 500 });

  const url = new URL(request.url);
  const slotFiltro = url.searchParams.get("slot");
  const inicio = Math.max(1, parseInt(url.searchParams.get("inicio") ?? "1", 10));
  const fim = Math.min(30, parseInt(url.searchParams.get("fim") ?? "30", 10));

  const sb = criarClienteAdmin();
  const log: string[] = [];
  let expandidos = 0;
  let saltadosJaCarrossel = 0;
  let saltadosAncora = 0;
  let erros = 0;

  const slots: ("manha" | "tarde")[] =
    slotFiltro === "manha" ? ["manha"] : slotFiltro === "tarde" ? ["tarde"] : ["manha", "tarde"];

  for (const slot of slots) {
    const ancora = slot === "manha" ? ANCORA_MANHA : ANCORA_TARDE;
    for (let dia = inicio; dia <= fim; dia++) {
      if (ancora.has(dia)) {
        saltadosAncora++;
        log.push(`Dia ${dia} ${slot}: âncora, mantém single`);
        continue;
      }
      const { data: post } = await sb
        .from("campanha_posts")
        .select("id, texto_imagem, legenda, tema")
        .eq("dia", dia)
        .eq("slot", slot)
        .maybeSingle();
      if (!post || !post.texto_imagem?.trim()) {
        log.push(`Dia ${dia} ${slot}: sem texto, saltado`);
        continue;
      }
      if (temSlidesNumerados(post.texto_imagem)) {
        saltadosJaCarrossel++;
        log.push(`Dia ${dia} ${slot}: já carrossel, saltado`);
        continue;
      }

      const expandido = await expandirComClaude(
        apiKey,
        post.texto_imagem,
        post.legenda ?? "",
        post.tema ?? "",
        slot
      );
      if (!expandido) {
        erros++;
        log.push(`Dia ${dia} ${slot}: Claude falhou`);
        continue;
      }
      const { error } = await sb
        .from("campanha_posts")
        .update({ texto_imagem: expandido, formato: "carrossel" })
        .eq("id", post.id);
      if (error) {
        erros++;
        log.push(`Dia ${dia} ${slot}: erro update ${error.message}`);
      } else {
        expandidos++;
        log.push(`Dia ${dia} ${slot}: expandido`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    expandidos,
    saltadosJaCarrossel,
    saltadosAncora,
    erros,
    log,
  });
}
