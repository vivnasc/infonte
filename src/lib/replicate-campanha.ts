import { criarClienteAdmin } from "@/lib/supabase/admin";

const STYLE_BASE = `editorial still life photograph, painterly contemplative atmosphere, fixed palette: deep terra #2E1D12, warm cream #F2E8DC, soft ocre #B8843D, amber gold #EBAE4A, olive #6B6B47; allowed materials: raw linen, dark walnut wood, warm terracotta ceramic, natural raffia, aged paper; allowed botanicals: dried grasses, eucalyptus, cotton branches; supports: hand-troweled warm stucco wall, worn wooden table; single oblique soft afternoon light, gentle chiaroscuro; no people, no faces, no hands, no text, no logos, no watermarks`;

// Remove flags de Midjourney (--ar, --v, etc.) que o Replicate não
// entende. O aspect ratio passa em campo separado do input.
function limparPromptParaReplicate(prompt: string): string {
  return prompt
    .replace(/--\w+\s+[\w:.-]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function gerarPromptViaClaude(
  apiKey: string,
  contexto: { dia: number; tema: string; texto: string }
): Promise<string> {
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
      messages: [{
        role: "user",
        content: `Gera um prompt para uma imagem de fundo de um post de Instagram da marca Infonte (percurso de desenvolvimento pessoal feminino, estética terra/ocre/âmbar).

Contexto do post (dia ${contexto.dia}, tema "${contexto.tema}"):
${contexto.texto}

O prompt deve:
1. Descrever uma cena contemplativa, abstracta ou simbólica que transmita a emoção do texto
2. NÃO incluir pessoas, rostos, mãos, texto ou logótipos
3. Usar a paleta terra/ocre/âmbar/creme
4. Ser específico nos materiais e na luz
5. Terminar com o estilo base abaixo

Estilo base obrigatório no fim:
${STYLE_BASE}

Devolve APENAS o prompt, sem explicações, sem aspas, sem prefixos. Uma linha.`,
      }],
    }),
  });

  if (!r.ok) {
    throw new Error(`Claude ${r.status}: ${await r.text()}`);
  }
  const j = await r.json();
  return j.content?.[0]?.text?.trim() ?? "";
}

type ReplicatePrediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string | null;
  urls?: { get?: string };
};

async function chamarReplicate(
  token: string,
  prompt: string
): Promise<string> {
  // FLUX 1.1 Pro: 8-15s tipico, qualidade fotográfica.
  // Prefer: wait pede à Replicate para aguardar até 55s pela conclusão
  // antes de devolver, em vez de obrigar a polling.
  const create = await fetch(
    "https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: "wait=55",
      },
      body: JSON.stringify({
        input: {
          prompt,
          aspect_ratio: "9:16",
          output_format: "png",
          output_quality: 90,
          safety_tolerance: 2,
        },
      }),
    }
  );

  if (!create.ok) {
    throw new Error(`Replicate ${create.status}: ${await create.text()}`);
  }

  let pred = (await create.json()) as ReplicatePrediction;

  // Polling de segurança se ainda não acabou.
  const inicio = Date.now();
  while (
    (pred.status === "starting" || pred.status === "processing") &&
    Date.now() - inicio < 45_000 &&
    pred.urls?.get
  ) {
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(pred.urls.get, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!poll.ok) break;
    pred = (await poll.json()) as ReplicatePrediction;
  }

  if (pred.status !== "succeeded" || !pred.output) {
    throw new Error(`Replicate falhou: ${pred.error ?? pred.status}`);
  }

  const url = Array.isArray(pred.output) ? pred.output[0] : pred.output;
  if (!url) throw new Error("Replicate sem output");
  return url;
}

async function descarregar(url: string): Promise<Buffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

export async function gerarEUploadDia(opts: {
  dia: number;
  slot: string;
  anthropicKey: string;
  replicateToken: string;
}): Promise<{ url: string; prompt: string }> {
  const sb = criarClienteAdmin();
  const { data: post } = await sb
    .from("campanha_posts")
    .select("dia, tema, texto_imagem, legenda, imagens")
    .eq("dia", opts.dia)
    .eq("slot", opts.slot)
    .single();

  if (!post) throw new Error("post não encontrado");

  const textoContexto = post.texto_imagem || post.legenda || post.tema;
  const promptCru = await gerarPromptViaClaude(opts.anthropicKey, {
    dia: post.dia,
    tema: post.tema,
    texto: textoContexto,
  });
  const prompt = limparPromptParaReplicate(promptCru);

  const imagemUrl = await chamarReplicate(opts.replicateToken, prompt);
  const buffer = await descarregar(imagemUrl);

  const dia2 = String(opts.dia).padStart(2, "0");
  const slotSuffix = opts.slot === "tarde" ? "-tarde" : "";
  const path = `infonte-campanha/dia-${dia2}${slotSuffix}-replicate.png`;

  await sb.storage.createBucket("infonte-assets", {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
  });

  const { error: upErr } = await sb.storage
    .from("infonte-assets")
    .upload(path, buffer, {
      contentType: "image/png",
      upsert: true,
    });
  if (upErr) throw new Error(`upload: ${upErr.message}`);

  const { data: pub } = sb.storage.from("infonte-assets").getPublicUrl(path);
  const urlPub = `${pub.publicUrl}?v=${Date.now()}`;

  const imagensAntigas = (post.imagens as string[] | null) ?? [];
  const novas = [urlPub, ...imagensAntigas.filter((u) => !u.startsWith(pub.publicUrl))];
  await sb
    .from("campanha_posts")
    .update({ imagens: novas, imagem_url: urlPub })
    .eq("dia", opts.dia)
    .eq("slot", opts.slot);

  return { url: urlPub, prompt };
}
