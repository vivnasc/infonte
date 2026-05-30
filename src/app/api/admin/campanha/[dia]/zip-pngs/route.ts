import { NextResponse } from "next/server";
import JSZip from "jszip";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

// Bundle dos PNGs HD de um carrossel num único ZIP, prontos a importar
// no Metricool slide a slide. Padrão SyncHim.
//
// GET /api/admin/campanha/[dia]/zip-pngs?slot=manha
export async function GET(
  request: Request,
  ctx: { params: Promise<{ dia: string }> }
) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const { dia: diaStr } = await ctx.params;
  const dia = parseInt(diaStr, 10);
  if (!Number.isFinite(dia) || dia < 1 || dia > 30) {
    return NextResponse.json({ erro: "dia inválido" }, { status: 400 });
  }

  const url = new URL(request.url);
  const slot = url.searchParams.get("slot") ?? "manha";

  const sb = criarClienteAdmin();
  const BUCKET = "infonte-assets";

  // Encontrar URLs do último render para este (dia, slot)
  const { data: jobs } = await sb.storage
    .from(BUCKET)
    .list("infonte-campanha-hd", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

  let pngs: string[] = [];
  for (const job of jobs ?? []) {
    if (!job.name) continue;
    const path = `infonte-campanha-hd/${job.name}/result.json`;
    const { data: file } = await sb.storage.from(BUCKET).download(path);
    if (!file) continue;
    try {
      const j = JSON.parse(await file.text());
      if (j.slot !== slot) continue;
      const diaRes = j.dias?.[dia];
      if (Array.isArray(diaRes?.urls) && diaRes.urls.length > 0) {
        pngs = diaRes.urls;
        break;
      }
    } catch {
      // próximo job
    }
  }

  if (pngs.length === 0) {
    return NextResponse.json(
      { erro: `sem renders HD para dia ${dia} ${slot}` },
      { status: 404 }
    );
  }

  // Descarregar todos os PNGs em paralelo (lotes de 4)
  const buffers: { nome: string; buf: Buffer }[] = [];
  const CONC = 4;
  for (let i = 0; i < pngs.length; i += CONC) {
    const lote = pngs.slice(i, i + CONC);
    const out = await Promise.all(
      lote.map(async (u, idx) => {
        const r = await fetch(u);
        if (!r.ok) throw new Error(`download slide ${i + idx + 1}: ${r.status}`);
        return {
          nome: `dia-${String(dia).padStart(2, "0")}-${slot}-slide-${String(i + idx + 1).padStart(2, "0")}.png`,
          buf: Buffer.from(await r.arrayBuffer()),
        };
      })
    );
    buffers.push(...out);
  }

  // Montar ZIP
  const zip = new JSZip();
  for (const { nome, buf } of buffers) {
    zip.file(nome, buf);
  }
  const zipBuffer = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const nomeArquivo = `infonte-dia-${String(dia).padStart(2, "0")}-${slot}.zip`;

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      "Cache-Control": "no-store",
    },
  });
}
