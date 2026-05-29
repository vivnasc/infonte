import { criarClienteAdmin } from "@/lib/supabase/admin";

// Linha de paleta e qualidade que se anexa sempre no fim, para a FLUX
// ler em último lugar. NÃO impõe assunto (still life, pessoas, etc.):
// a decisão do que mostrar é da Claude, post a post.
const QUALIDADE = `warm terra and ocre palette (#2E1D12 deep terra, #F2E8DC cream, #B8843D ocre, #EBAE4A amber gold, #6B6B47 olive), painterly editorial photography, soft natural light, gentle chiaroscuro, 9:16 vertical, high resolution, no text in image, no logos, no watermarks, no extreme close-up faces, no faces filling the frame, no portrait headshots`;

// Regras editoriais SyncHim: detecta violações no prompt antes de
// mandar para a FLUX. Dispara 1 retry cirúrgico se falhar.
type Violacao = "close-up" | "cadencia-semanal" | "texto-na-imagem";

function detectarViolacoes(prompt: string): Violacao[] {
  const baixo = prompt.toLowerCase();
  const v: Violacao[] = [];
  if (/(close[\s-]?up|extreme close|tight crop|headshot|head shot|portrait of (a |the )?(woman|man|girl)|face fill|filling the frame)/i.test(baixo)) {
    v.push("close-up");
  }
  if (/(semana que vem|próxima semana|next week|this week|today|amanhã|tomorrow)/i.test(baixo)) {
    v.push("cadencia-semanal");
  }
  if (/(handwritten text|written words|sign with text|typography of)/i.test(baixo)) {
    v.push("texto-na-imagem");
  }
  return v;
}

const REPARO: Record<Violacao, string> = {
  "close-up": "evita ABSOLUTAMENTE qualquer close-up de cara, retrato, ou cara a preencher o enquadramento. Se houver pessoas, capta-as a média ou longa distância, em interacção, ou de costas.",
  "cadencia-semanal": "não menciones tempo (semana, hoje, amanhã, próxima semana, etc.).",
  "texto-na-imagem": "remove qualquer referência a texto, letras, palavras ou tipografia dentro da imagem.",
};

// Remove flags de Midjourney (--ar, --v, etc.) que o Replicate não
// entende. O aspect ratio passa em campo separado do input.
function limparPromptParaReplicate(prompt: string): string {
  return prompt
    .replace(/--\w+\s+[\w:.-]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fixarQualidade(prompt: string): string {
  return `${prompt}, ${QUALIDADE}`;
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
        content: `És directora de arte da Infonte, percurso de desenvolvimento pessoal feminino com estética terra/ocre/âmbar. Vais gerar um prompt para o FLUX 1.1 Pro produzir UMA imagem para este post de Instagram.

Contexto do post (dia ${contexto.dia}, tema "${contexto.tema}"):
${contexto.texto}

Tens liberdade criativa total para decidir o que mostra a imagem. Pensa primeiro qual é a emoção e a verdade do texto, e escolhe a representação que melhor a serve. Pode ser:
- Uma cena com pessoa(s) a interagir num ambiente (cozinha, secretária, varanda, caminho), captadas a média ou longa distância, com naturalidade documental
- Mãos a fazer algo (escrever, regar uma planta, segurar uma chávena) sem mostrar a cara
- Um interior, paisagem ou objecto que simbolize a mensagem
- Uma composição abstracta com luz, sombra e materiais
- Qualquer mistura que faça sentido

Regras inegociáveis:
- NUNCA close-ups de cara, retratos de cabeça, ou cara a olhar directamente para a câmara
- NUNCA texto, palavras ou logótipos dentro da imagem
- Paleta terra (#2E1D12), creme (#F2E8DC), ocre (#B8843D), âmbar (#EBAE4A), oliva (#6B6B47). Pequenos desvios tonais ok.
- Luz natural suave, atmosfera editorial contemplativa, vertical 9:16

Princípio: a imagem deve conversar com o texto, não competir nem decorar. Se a frase é sobre fome, a imagem pode ser uma mesa quase vazia. Se é sobre permissão, pode ser uma porta entreaberta. Se é sobre cansaço de perseguir, pode ser passos numa estrada. Escolhe a metáfora visual que mais ressoa.

Devolve APENAS o prompt para o FLUX, em inglês, uma linha, sem aspas, sem explicações, sem prefixos. Sê concreto: nomeia os materiais, os objectos, a luz, a composição.`,
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
  let promptCru = await gerarPromptViaClaude(opts.anthropicKey, {
    dia: post.dia,
    tema: post.tema,
    texto: textoContexto,
  });

  // Post-validação editorial (SyncHim, regra 4 + 3). 1 retry cirúrgico.
  const viol = detectarViolacoes(promptCru);
  if (viol.length > 0) {
    const correccoes = viol.map((v) => REPARO[v]).join(" ");
    const retryPrompt = `${promptCru}\n\nO prompt acima viola regras editoriais. Reescreve-o respeitando: ${correccoes} Mantém a mesma cena e emoção. Devolve APENAS o prompt reescrito.`;
    promptCru = await gerarPromptViaClaude(opts.anthropicKey, {
      dia: post.dia,
      tema: post.tema,
      texto: retryPrompt,
    });
  }

  const prompt = fixarQualidade(limparPromptParaReplicate(promptCru));

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
