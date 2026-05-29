import { createClient } from "@supabase/supabase-js";
import { renderSlides, parseTextoImagemToSlides } from "../src/lib/render-slides";

// Script de render HD executado no GitHub Actions, fora do Vercel.
// Lê env vars:
//   DIAS         - JSON array tipo "[1,2,3]" ou "all" para todos os 30
//   SLOT         - "manha" (default) ou "tarde"
//   JOB_ID       - identificador único da corrida (pasta no Storage)
//   SUPABASE_URL - https://....supabase.co
//   SUPABASE_SERVICE_ROLE_KEY

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.INFONTE_SUPABASE_SERVICE_ROLE_KEY;
const diasRaw = process.env.DIAS || "all";
const slot = process.env.SLOT || "manha";
const jobId = process.env.JOB_ID || `render-${Date.now()}`;
const BUCKET = "infonte-assets";

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: "infonte" },
});

function diasAlvo(): number[] {
  if (diasRaw === "all") return Array.from({ length: 30 }, (_, i) => i + 1);
  try {
    const arr = JSON.parse(diasRaw);
    if (Array.isArray(arr) && arr.every((n) => Number.isFinite(n))) {
      return arr.filter((n) => n >= 1 && n <= 30);
    }
  } catch {}
  console.error(`DIAS inválido: ${diasRaw}`);
  process.exit(1);
}

type PostRow = {
  dia: number;
  tema: string;
  texto_imagem: string | null;
  formato: string | null;
  imagem_url: string | null;
  imagens: string[] | null;
};

async function processarDia(dia: number): Promise<{ urls: string[] } | { erro: string }> {
  const { data: post, error } = await sb
    .from("campanha_posts")
    .select("dia, tema, texto_imagem, formato, imagem_url, imagens")
    .eq("dia", dia)
    .eq("slot", slot)
    .single<PostRow>();

  if (error || !post) return { erro: `post não encontrado (${error?.message ?? "vazio"})` };
  if (!post.texto_imagem?.trim()) return { erro: "sem texto_imagem" };

  const slides = parseTextoImagemToSlides(
    post.dia,
    post.tema,
    post.texto_imagem,
    post.formato,
    post.imagem_url,
    post.imagens,
  );
  if (slides.length === 0) return { erro: "sem slides" };

  const rendered = await renderSlides(slides);

  const urls: string[] = [];
  for (const r of rendered) {
    const path = `infonte-campanha-hd/${jobId}/${r.name}`;
    const { error: upErr } = await sb.storage.from(BUCKET).upload(path, r.buffer, {
      contentType: "image/png",
      upsert: true,
    });
    if (upErr) return { erro: `upload ${r.name}: ${upErr.message}` };
    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
    urls.push(`${pub.publicUrl}?v=${Date.now()}`);
  }

  // NÃO tocar em campanha_posts.imagens nem imagem_url. Esses campos
  // são para fundos MJ/Replicate (entrada do render). Os PNGs do render
  // saem em result.json + ficheiros no bucket, e são lidos pela vista
  // "depois" através do endpoint /renders-hd. Antes este código
  // sobrescrevia imagens e partia o preview HTML em loop.
  void post;
  return { urls };
}

async function main() {
  const dias = diasAlvo();
  await sb.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
  });

  console.log(`Job ${jobId}: render HD de ${dias.length} dias (slot=${slot})`);
  const resultados: Record<number, { urls?: string[]; erro?: string }> = {};
  for (const dia of dias) {
    try {
      const r = await processarDia(dia);
      resultados[dia] = r;
      if ("erro" in r) {
        console.log(`Dia ${dia}: ERRO, ${r.erro}`);
      } else {
        console.log(`Dia ${dia}: ${r.urls.length} slide(s) ok`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      resultados[dia] = { erro: msg };
      console.log(`Dia ${dia}: EXCEPÇÃO ${msg}`);
    }
  }

  const resultadoJson = {
    jobId,
    slot,
    completedAt: new Date().toISOString(),
    dias: resultados,
    totalOk: Object.values(resultados).filter((r) => !("erro" in r) || !r.erro).length,
    totalErro: Object.values(resultados).filter((r) => "erro" in r && r.erro).length,
  };

  const buf = Buffer.from(JSON.stringify(resultadoJson, null, 2));
  await sb.storage
    .from(BUCKET)
    .upload(`infonte-campanha-hd/${jobId}/result.json`, buf, {
      contentType: "application/json",
      upsert: true,
    });

  console.log(`\nResumo: ${resultadoJson.totalOk} ok, ${resultadoJson.totalErro} erro`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
