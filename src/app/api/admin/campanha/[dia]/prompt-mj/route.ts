import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

const STYLE_BASE = `editorial still life photograph, painterly contemplative atmosphere, fixed palette: deep terra #2E1D12, warm cream #F2E8DC, soft ocre #B8843D, amber gold #EBAE4A, olive #6B6B47; allowed materials: raw linen, dark walnut wood, warm terracotta ceramic, natural raffia, aged paper; allowed botanicals: dried grasses, eucalyptus, cotton branches; supports: hand-troweled warm stucco wall, worn wooden table; single oblique soft afternoon light, gentle chiaroscuro; no people, no faces, no hands, no text, no logos, no watermarks; 8k, --ar 9:16`;

export async function POST(
  _request: Request,
  ctx: { params: Promise<{ dia: string }> }
) {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ erro: "acesso negado" }, { status: 403 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { erro: "ANTHROPIC_API_KEY ausente no ambiente" },
      { status: 500 }
    );
  }

  const { dia: diaStr } = await ctx.params;
  const dia = parseInt(diaStr, 10);

  const sb = criarClienteAdmin();
  const { data: post } = await sb
    .from("campanha_posts")
    .select("dia, tema, texto_imagem, legenda, formato")
    .eq("dia", dia)
    .single();

  if (!post) {
    return NextResponse.json({ erro: "post não encontrado" }, { status: 404 });
  }

  const textoContexto = post.texto_imagem || post.legenda || post.tema;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Gera um prompt Midjourney para uma imagem de fundo de um post de Instagram da marca Infonte (percurso de desenvolvimento pessoal feminino, estética terra/ocre/âmbar).

Contexto do post (dia ${post.dia}, tema "${post.tema}"):
${textoContexto}

O prompt deve:
1. Descrever uma cena contemplativa, abstracta ou simbólica que transmita a emoção do texto
2. NÃO incluir pessoas, rostos, mãos, texto ou logótipos
3. Usar a paleta terra/ocre/âmbar/creme
4. Ser específico nos materiais e na luz
5. Terminar com o estilo base abaixo

Estilo base obrigatório no fim:
${STYLE_BASE}

Devolve APENAS o prompt Midjourney, sem explicações, sem aspas, sem prefixos. Uma linha.`,
        },
      ],
    }),
  });

  if (!r.ok) {
    const t = await r.text();
    return NextResponse.json(
      { erro: `Claude API erro ${r.status}`, detalhe: t },
      { status: 500 }
    );
  }

  const j = await r.json();
  const prompt =
    j.content?.[0]?.text?.trim() ?? "Erro: resposta vazia do Claude";

  return NextResponse.json({ ok: true, dia, prompt });
}
