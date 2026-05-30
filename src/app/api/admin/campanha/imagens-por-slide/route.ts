import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

// Gera imagens distintas para cada slide de um carrossel.
// Para cada slide numerado do texto_imagem, pede à Claude um prompt
// visual contextual, chama FLUX 1.1 Pro, sobe ao Storage e adiciona à
// post.imagens (substitui o que estiver lá).
//
// Query: slot=manha|tarde · inicio=1..30 · fim=1..30 · max=5 (default)
//
// Apenas processa posts que TÊM slides numerados (>=2). Singles ficam.
// Idempotente: se post já tem N imagens >= max, salta.

const QUALIDADE = `warm terra palette (#2E1D12 deep terra, #F2E8DC cream, #B8843D ocre, #EBAE4A amber gold, #6B6B47 olive), painterly editorial photography, soft natural light, gentle chiaroscuro, 9:16 vertical, no text in image, no logos, no extreme close-up faces, no faces filling the frame, no portrait headshots`;

function limparPrompt(p: string): string {
  return p.replace(/--\w+\s+[\w:.-]+/g, "").replace(/\s+/g, " ").trim();
}

async function gerarPromptsDeSlides(
  apiKey: string,
  tema: string,
  slides: string[]
): Promise<string[]> {
  const slidesNumerados = slides.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `És directora de arte da Infonte (campanha pré-launch sobre clareza/foco/bastar-se, paleta terra/ocre/âmbar).

Tema do carrossel hoje: "${tema}"
Os slides do carrossel são:
${slidesNumerados}

Para cada slide, escreve UM prompt visual em inglês para o FLUX 1.1 Pro.

Regras:
- Cada imagem deve dialogar com o conteúdo daquele slide específico (não repetir).
- Cenas com pessoas em interacção (média/longa distância) OU objectos/ambientes simbólicos OU mãos a fazer algo. NUNCA close-up de cara.
- Paleta terra/ocre/âmbar/creme.
- Tom editorial, luz natural suave.
- Sem texto, sem logos.

Devolve JSON puro, array com exactamente ${slides.length} prompts, na ordem dos slides:
{"prompts": ["prompt 1", "prompt 2", ...]}

Sem prefácio, sem markdown, só JSON.`,
      }],
    }),
  });
  if (!r.ok) throw new Error(`Claude ${r.status}`);
  const j = await r.json();
  const txt = j.content?.[0]?.text?.trim() ?? "";
  const limpo = txt.replace(/```json\n?/g, "").replace(/```/g, "").trim();
  const parsed = JSON.parse(limpo);
  if (!Array.isArray(parsed.prompts)) throw new Error("resposta sem array prompts");
  return parsed.prompts.map((p: string) => limparPrompt(`${p}, ${QUALIDADE}`));
}

async function chamarReplicate(token: string, prompt: string): Promise<string> {
  const r = await fetch(
    "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait=55",
      },
      body: JSON.stringify({
        input: { prompt, aspect_ratio: "9:16", output_format: "png", output_quality: 90, safety_tolerance: 2 },
      }),
    }
  );
  if (!r.ok) throw new Error(`Replicate ${r.status}`);
  type Pred = { id: string; status: string; output?: string | string[]; urls?: { get?: string } };
  let pred = (await r.json()) as Pred;
  const inicio = Date.now();
  while (
    (pred.status === "starting" || pred.status === "processing") &&
    Date.now() - inicio < 45_000 &&
    pred.urls?.get
  ) {
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(pred.urls.get, { headers: { Authorization: `Bearer ${token}` } });
    if (!poll.ok) break;
    pred = (await poll.json()) as Pred;
  }
  if (pred.status !== "succeeded" || !pred.output) throw new Error(`Replicate falhou: ${pred.status}`);
  const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
  if (!url) throw new Error("Replicate sem output");
  return url;
}

export async function POST(request: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!anthropicKey || !replicateToken) {
    return NextResponse.json({ erro: "envs em falta" }, { status: 500 });
  }

  const url = new URL(request.url);
  const slot = url.searchParams.get("slot") ?? "manha";
  const inicio = Math.max(1, parseInt(url.searchParams.get("inicio") ?? "1", 10));
  const fim = Math.min(30, parseInt(url.searchParams.get("fim") ?? "30", 10));
  const max = Math.max(1, Math.min(10, parseInt(url.searchParams.get("max") ?? "5", 10)));

  const sb = criarClienteAdmin();
  const BUCKET = "infonte-assets";
  const log: string[] = [];
  let gerados = 0;
  let saltados = 0;
  let erros = 0;

  for (let dia = inicio; dia <= fim; dia++) {
    const { data: post } = await sb
      .from("campanha_posts")
      .select("id, dia, tema, texto_imagem, imagens")
      .eq("dia", dia)
      .eq("slot", slot)
      .maybeSingle();

    if (!post || !post.texto_imagem?.trim()) {
      log.push(`Dia ${dia} ${slot}: sem texto, saltado`);
      continue;
    }

    // Extrair slides numerados
    const linhas = post.texto_imagem.split("\n").map((l: string) => l.trim());
    const numerados = linhas.filter((l: string) => /^\d+\.\s+/.test(l));
    if (numerados.length < 2) {
      log.push(`Dia ${dia} ${slot}: single (não carrossel), saltado`);
      continue;
    }

    const imagensActuais = (post.imagens as string[] | null) ?? [];
    if (imagensActuais.length >= max) {
      saltados++;
      log.push(`Dia ${dia} ${slot}: já tem ${imagensActuais.length} imagens, saltado`);
      continue;
    }

    // Escolher quantos slides ter imagem: capa + cta + alternados, no
    // máx "max" imagens. Pegar os primeiros N slides para gerar
    // imagens (capa, conteudos ímpares, cta).
    const total = numerados.length;
    const slidesParaImagem: number[] = [];
    slidesParaImagem.push(1); // capa
    for (let i = 2; i < total && slidesParaImagem.length < max - 1; i++) {
      if (i % 2 === 1) slidesParaImagem.push(i);
    }
    if (slidesParaImagem.length < max && total > 1) slidesParaImagem.push(total); // cta
    const slidesEscolhidos = slidesParaImagem.slice(0, max);
    const textosParaPrompts = slidesEscolhidos.map((idx) => numerados[idx - 1].replace(/^\d+\.\s*/, ""));

    try {
      const prompts = await gerarPromptsDeSlides(anthropicKey, post.tema, textosParaPrompts);
      const urls: string[] = [];
      // Replicate em paralelo de 3 para caber em 60s
      const CONC = 3;
      for (let i = 0; i < prompts.length; i += CONC) {
        const lote = prompts.slice(i, i + CONC);
        const out = await Promise.all(lote.map((p) => chamarReplicate(replicateToken, p)));
        urls.push(...out);
      }

      // Download + upload Storage
      const finais: string[] = [];
      for (let i = 0; i < urls.length; i++) {
        const buf = Buffer.from(await (await fetch(urls[i])).arrayBuffer());
        const path = `infonte-campanha/dia-${String(dia).padStart(2, "0")}${slot === "tarde" ? "-tarde" : ""}-s${i + 1}.png`;
        await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 10 * 1024 * 1024 });
        const { error: upErr } = await sb.storage.from(BUCKET).upload(path, buf, {
          contentType: "image/png",
          upsert: true,
        });
        if (upErr) throw new Error(`upload s${i + 1}: ${upErr.message}`);
        const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
        finais.push(`${pub.publicUrl}?v=${Date.now()}`);
      }

      await sb
        .from("campanha_posts")
        .update({ imagens: finais, imagem_url: finais[0] })
        .eq("id", post.id);

      gerados++;
      log.push(`Dia ${dia} ${slot}: ${finais.length} imagens geradas para slides ${slidesEscolhidos.join(", ")}`);
    } catch (e) {
      erros++;
      log.push(`Dia ${dia} ${slot}: erro ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({
    ok: erros === 0,
    gerados,
    saltados,
    erros,
    slot,
    inicio,
    fim,
    max,
    log,
  });
}
