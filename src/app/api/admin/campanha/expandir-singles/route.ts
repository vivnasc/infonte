import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

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

const PROMPT_MANHA = (texto: string, legenda: string) => `És a Vivianne dos Santos, autora da Infonte. Tens um post DIDÁCTICO actual com uma frase única na arte:

"${texto}"

Legenda completa do post:
"${legenda}"

Expande esta ideia num carrossel de 10 slides para Instagram. Cada slide é UMA frase curta (1-2 linhas), numerada (1. 2. 3. ... 10.).

Estrutura sugerida (mas não copies à letra, varia):
- Slide 1: hook impactante (o statement actual ou variação próxima)
- Slide 2: reconhecimento (onde isto aparece concretamente na vida dela)
- Slide 3: quebra (uma contradição inesperada, o que ninguém diz)
- Slide 4: o porquê profundo (camada 1)
- Slide 5: o que está por trás (camada 2, mais fundo)
- Slide 6: cena concreta (uma situação real e curta)
- Slide 7: a consequência (o que custa não ver)
- Slide 8: o que abre quando se vê (o ganho)
- Slide 9: a pergunta que para o scroll
- Slide 10: âncora / verdade que fica (não CTA de venda)

Regras de voz (não negociáveis):
- pt-PT, segunda pessoa (tu), íntima
- Sem travessões longos
- Sem guru: NUNCA "universo", "manifesta", "mindset", "abundância" sozinha, "energia", "vibração", "frequência", "alma", "cura", "luz", "alinhamento"
- Sem coach: "abraça-te", "ama-te", "tu és luz"
- Sem inglês de marketing: "hustle", "growth", "mindset"
- Frases curtas. Verbos fortes. Concreto sobre abstracto.
- Tom: quem se bastou a falar para quem persegue. Calma com autoridade.

Devolve APENAS as 10 linhas numeradas, no formato:
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

Nada mais. Sem prefácio, sem aspas, sem explicação.`;

const PROMPT_TARDE = (texto: string, tema: string) => `És a Vivianne dos Santos. Tens um post EMOCIONAL das 13h da Infonte (eco da manhã didáctica):

Tema: "${tema}"
Frase única actual na arte: "${texto}"

Expande em 10 slides numerados que aprofundam o reconhecimento emocional. A tarde NÃO ensina, RECONHECE. Cada slide intensifica o sentir, sem soluções, sem conselho.

Estrutura sugerida (varia, não copies à letra):
- Slide 1: o feeling raw (a frase actual ou eco próximo)
- Slide 2: onde aparece no corpo (peso no peito, aperto na garganta, o que for)
- Slide 3: onde aparece no dia (que momento, que gesto)
- Slide 4: o que está por trás (camada 1)
- Slide 5: mais fundo (camada 2)
- Slide 6: a verdade que custa admitir
- Slide 7: o peso de carregar isto sozinha
- Slide 8: o que se sente quando se nomeia (alívio mínimo, não solução)
- Slide 9: a frase que para o scroll
- Slide 10: o silêncio depois (frase que NÃO conclui, deixa em aberto)

Cada slide UMA frase curta (1-2 linhas).

Regras de voz (não negociáveis):
- pt-PT, segunda pessoa (tu), íntima
- Sem solução, sem conselho, sem CTA. Só reconhecimento.
- Sem guru: NUNCA "universo", "manifesta", "mindset", "abundância" sozinha, "energia", "vibração", "alma", "cura", "luz", "alinhamento"
- Sem coach: "abraça-te", "ama-te", "tu mereces tudo"
- Tom: quem sente isto a sussurrar para quem também sente.

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
  contexto: string,
  slot: "manha" | "tarde"
): Promise<string | null> {
  const prompt = slot === "manha" ? PROMPT_MANHA(texto, contexto) : PROMPT_TARDE(texto, contexto);
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
  return lines.slice(0, 10).join("\n");
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

      const contexto = slot === "manha" ? (post.legenda ?? "") : (post.tema ?? "");
      const expandido = await expandirComClaude(apiKey, post.texto_imagem, contexto, slot);
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
