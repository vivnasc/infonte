import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { limparTravessoes } from "@/lib/limpar-texto";

export const runtime = "nodejs";
export const maxDuration = 60;

// Aplica destaque em **bold** aos carrosséis JÁ expandidos via
// Claude, sem reescrever conteúdo. Apenas envolve 1-3 palavras-chave
// por slide. Usado quando os carrosséis foram expandidos antes de
// os prompts pedirem bold ao Claude.
//
// POST query params: slot=manha|tarde (default ambos)
//                    inicio=1..30 fim=1..30
// Idempotente: se já tem **...** em pelo menos metade dos slides,
// salta.

function jaTemBoldSuficiente(texto: string): boolean {
  const linhas = texto.match(/^\d+\.\s*.+$/gm) ?? [];
  if (linhas.length === 0) return false;
  const comBold = linhas.filter((l) => /\*\*[^*]+\*\*/.test(l)).length;
  return comBold >= Math.ceil(linhas.length / 2);
}

async function aplicarBoldComClaude(
  apiKey: string,
  texto: string,
  slot: "manha" | "tarde"
): Promise<string | null> {
  const tomBold = slot === "manha"
    ? "1 a 3 palavras-chave que carregam o significado ou tensão didáctica"
    : "1 a 2 palavras que carregam o peso emocional";

  const prompt = `Vou dar-te 10 linhas numeradas. A tua tarefa: em CADA linha, envolve com **negrito** ${tomBold}. Sai em dourado no slide.

REGRAS:
- NÃO mudes nada do texto. Mantém pontuação, ordem, palavras.
- Não traduzas, não reformules.
- Só adicionas marcadores **palavra**. Nada mais.
- Se uma linha já tiver **bold**, mantém o que está e não adiciones mais.
- Mínimo, certeiro. Não enches a frase de bolds.

TEXTO:
${texto}

Devolve APENAS as mesmas 10 linhas numeradas com bold aplicado. Sem prefácio, sem aspas, sem comentários.`;

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
  const lines = out.split("\n").filter((l: string) => /^\d+\.\s+.+/.test(l.trim()));
  if (lines.length < 5) return null;
  return limparTravessoes(lines.join("\n"));
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
  let atualizados = 0;
  let saltadosJaTem = 0;
  let saltadosSemCarrossel = 0;
  let erros = 0;

  const slots: ("manha" | "tarde")[] =
    slotFiltro === "manha" ? ["manha"] : slotFiltro === "tarde" ? ["tarde"] : ["manha", "tarde"];

  for (const slot of slots) {
    for (let dia = inicio; dia <= fim; dia++) {
      const { data: post } = await sb
        .from("campanha_posts")
        .select("id, texto_imagem")
        .eq("dia", dia)
        .eq("slot", slot)
        .maybeSingle();

      if (!post || !post.texto_imagem?.trim()) {
        log.push(`Dia ${dia} ${slot}: sem texto, saltado`);
        continue;
      }

      const linhasNum = post.texto_imagem.match(/^\d+\.\s*.+$/gm) ?? [];
      if (linhasNum.length < 5) {
        saltadosSemCarrossel++;
        log.push(`Dia ${dia} ${slot}: não é carrossel longo, saltado`);
        continue;
      }

      if (jaTemBoldSuficiente(post.texto_imagem)) {
        saltadosJaTem++;
        log.push(`Dia ${dia} ${slot}: já tem bold, saltado`);
        continue;
      }

      const comBold = await aplicarBoldComClaude(apiKey, post.texto_imagem, slot);
      if (!comBold) {
        erros++;
        log.push(`Dia ${dia} ${slot}: Claude falhou`);
        continue;
      }
      const { error } = await sb
        .from("campanha_posts")
        .update({ texto_imagem: comBold })
        .eq("id", post.id);
      if (error) {
        erros++;
        log.push(`Dia ${dia} ${slot}: erro update ${error.message}`);
      } else {
        atualizados++;
        log.push(`Dia ${dia} ${slot}: bold aplicado`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    atualizados,
    saltadosJaTem,
    saltadosSemCarrossel,
    erros,
    log,
  });
}
