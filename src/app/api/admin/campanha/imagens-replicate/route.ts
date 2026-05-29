import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { gerarEUploadDia } from "@/lib/replicate-campanha";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "infonte-assets";

// Bulk Replicate.
// Query params:
//   inicio, fim   : intervalo de dias (1-30)
//   slot          : manha (default) | tarde
//   strategy      : always-new (default) | prefer-existing | reuse-only
//
// Escreve um result.json em infonte-assets/infonte-campanha/jobs/<jobId>.json
// para suportar retoma a partir do dia que falhou.
export async function POST(request: Request) {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ erro: "acesso negado" }, { status: 403 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!anthropicKey || !replicateToken) {
    return NextResponse.json(
      {
        erro: "faltam env vars",
        detalhe: !anthropicKey ? "ANTHROPIC_API_KEY" : "REPLICATE_API_TOKEN",
      },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const inicio = Math.max(1, parseInt(url.searchParams.get("inicio") ?? "1", 10));
  const fim = Math.min(30, parseInt(url.searchParams.get("fim") ?? "30", 10));
  const slot = url.searchParams.get("slot") ?? "manha";
  const strategy = (url.searchParams.get("strategy") ?? "always-new") as
    | "always-new"
    | "prefer-existing"
    | "reuse-only";

  const dias: number[] = [];
  for (let d = inicio; d <= fim; d++) dias.push(d);

  const sb = criarClienteAdmin();
  const jobId = `rep-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`;

  // Mapa de imagens existentes para a estratégia de reuso.
  type ResultDia = {
    dia: number;
    estado: "ok" | "reusado" | "erro" | "saltado";
    url?: string;
    erro?: string;
  };
  const resultados: ResultDia[] = [];
  let errorSlot: number | null = null;
  let gerados = 0;
  let reusados = 0;
  let saltados = 0;

  async function imagemExistente(d: number): Promise<string | null> {
    const { data: post } = await sb
      .from("campanha_posts")
      .select("imagem_url, imagens")
      .eq("dia", d)
      .eq("slot", slot)
      .single();
    if (!post) return null;
    if (post.imagem_url) return post.imagem_url;
    const imgs = (post.imagens as string[] | null) ?? [];
    return imgs[0] ?? null;
  }

  const CONCORRENCIA = 3;
  outer: for (let i = 0; i < dias.length; i += CONCORRENCIA) {
    const lote = dias.slice(i, i + CONCORRENCIA);
    const loteRes = await Promise.all(
      lote.map(async (d): Promise<ResultDia> => {
        // Estratégia de reuso
        if (strategy === "prefer-existing" || strategy === "reuse-only") {
          const existente = await imagemExistente(d);
          if (existente) {
            return { dia: d, estado: "reusado", url: existente };
          }
          if (strategy === "reuse-only") {
            return { dia: d, estado: "saltado" };
          }
        }
        try {
          const r = await gerarEUploadDia({
            dia: d,
            slot,
            anthropicKey: anthropicKey!,
            replicateToken: replicateToken!,
          });
          return { dia: d, estado: "ok", url: r.url };
        } catch (e) {
          return {
            dia: d,
            estado: "erro",
            erro: e instanceof Error ? e.message : String(e),
          };
        }
      })
    );

    for (const r of loteRes) {
      resultados.push(r);
      if (r.estado === "ok") gerados++;
      else if (r.estado === "reusado") reusados++;
      else if (r.estado === "saltado") saltados++;
      else if (r.estado === "erro" && errorSlot === null) {
        errorSlot = r.dia;
      }
    }

    // Se acumulámos 3 erros em sequência, paramos para permitir retoma.
    const ultimos = resultados.slice(-CONCORRENCIA);
    if (ultimos.length === CONCORRENCIA && ultimos.every((r) => r.estado === "erro")) {
      break outer;
    }
  }

  // Persistir result.json para retoma posterior.
  try {
    const resultJson = {
      jobId,
      slot,
      strategy,
      inicio,
      fim,
      gerados,
      reusados,
      saltados,
      errorSlot,
      criadoEm: new Date().toISOString(),
      dias: resultados,
    };
    await sb.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 10 * 1024 * 1024 });
    await sb.storage
      .from(BUCKET)
      .upload(
        `infonte-campanha/jobs/${jobId}.json`,
        Buffer.from(JSON.stringify(resultJson, null, 2)),
        { contentType: "application/json", upsert: true }
      );
  } catch (e) {
    console.warn("[imagens-replicate] erro a escrever result.json:", e);
  }

  return NextResponse.json({
    ok: errorSlot === null,
    jobId,
    inicio,
    fim,
    slot,
    strategy,
    gerados,
    reusados,
    saltados,
    errorSlot,
    log: resultados.map((r) => {
      if (r.estado === "ok") return `Dia ${r.dia}: gerado`;
      if (r.estado === "reusado") return `Dia ${r.dia}: reusado da biblioteca`;
      if (r.estado === "saltado") return `Dia ${r.dia}: saltado (reuse-only sem match)`;
      return `Dia ${r.dia}: ERRO ${r.erro}`;
    }),
  });
}
