import { NextResponse } from "next/server";
import JSZip from "jszip";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Bundle ZIP único dos dias falhados. Paraleliza tudo para caber
// nos 60s do Vercel: result.json em paralelo (lotes de 10), PNGs em
// paralelo (lotes de 20), pára de procurar quando encontrou todos.

const DIAS_MANHA = [3, 8, 11, 13, 14, 19, 20, 29, 30];
const DIAS_TARDE = [5, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 29, 30];

export async function GET(request: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  // ?slot=manha|tarde reduz o ZIP a metade (cabe em memória).
  // Sem param: tenta tudo (pode falhar com 500 se for grande).
  const url = new URL(request.url);
  const slotFiltro = url.searchParams.get("slot");

  const alvos = new Set<string>();
  if (slotFiltro !== "tarde") {
    DIAS_MANHA.forEach((d) => alvos.add(`${d}-manha`));
  }
  if (slotFiltro !== "manha") {
    DIAS_TARDE.forEach((d) => alvos.add(`${d}-tarde`));
  }
  const totalAlvos = alvos.size;

  const sb = criarClienteAdmin();
  const BUCKET = "infonte-assets";

  const { data: jobs } = await sb.storage
    .from(BUCKET)
    .list("infonte-campanha-hd", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ erro: "sem jobs" }, { status: 404 });
  }

  // Descarregar result.json em paralelo, mantendo ordem (mais recente
  // primeiro) para depois fazer o "primeiro a aparecer ganha" por chave.
  const renders = new Map<string, string[]>();
  const LOTE_JSON = 10;
  for (let i = 0; i < jobs.length && renders.size < totalAlvos; i += LOTE_JSON) {
    const lote = jobs.slice(i, i + LOTE_JSON);
    const parsed = await Promise.all(
      lote.map(async (job) => {
        if (!job.name) return null;
        const path = `infonte-campanha-hd/${job.name}/result.json`;
        const { data: file } = await sb.storage.from(BUCKET).download(path);
        if (!file) return null;
        try {
          return JSON.parse(await file.text()) as {
            slot?: string;
            dias?: Record<string, { urls?: string[] }>;
          };
        } catch {
          return null;
        }
      })
    );
    for (const j of parsed) {
      if (!j) continue;
      const slot = j.slot ?? "manha";
      const dias = j.dias ?? {};
      for (const [diaStr, r] of Object.entries(dias)) {
        const dia = parseInt(diaStr, 10);
        const key = `${dia}-${slot}`;
        if (!alvos.has(key)) continue;
        if (renders.has(key)) continue;
        const urls = r?.urls;
        if (Array.isArray(urls) && urls.length > 0) renders.set(key, urls);
      }
    }
  }

  if (renders.size === 0) {
    return NextResponse.json(
      { erro: "sem renders para os dias falhados" },
      { status: 404 }
    );
  }

  // Tarefas planas para download de PNG.
  const tarefas: { chave: string; idx: number; url: string }[] = [];
  for (const [chave, urls] of renders.entries()) {
    urls.forEach((url, idx) => tarefas.push({ chave, idx, url }));
  }

  // Download em paralelo, lotes grandes para acelerar.
  const buffers: { caminho: string; buf: Buffer }[] = [];
  const LOTE_PNG = 20;
  for (let i = 0; i < tarefas.length; i += LOTE_PNG) {
    const lote = tarefas.slice(i, i + LOTE_PNG);
    const out = await Promise.all(
      lote.map(async ({ chave, idx, url }) => {
        try {
          const r = await fetch(url);
          if (!r.ok) return null;
          const [diaStr, slot] = chave.split("-");
          const dia = String(diaStr).padStart(2, "0");
          const slideN = String(idx + 1).padStart(2, "0");
          return {
            caminho: `dia-${dia}-${slot}/slide-${slideN}.png`,
            buf: Buffer.from(await r.arrayBuffer()),
          };
        } catch {
          return null;
        }
      })
    );
    for (const item of out) {
      if (item) buffers.push(item);
    }
  }

  const zip = new JSZip();
  for (const { caminho, buf } of buffers) {
    zip.file(caminho, buf);
  }
  const readme =
    `infonte campanha — dias falhados\n\n` +
    `${renders.size} posts, ${buffers.length} PNGs.\n` +
    `Cada pasta = 1 post. Arrasta para o Metricool ao criar cada post.\n`;
  zip.file("LEIA-ME.txt", readme);

  // STORE (nível 0) em vez de DEFLATE: PNGs já são comprimidos, deflate
  // não reduz e gasta CPU/tempo.
  const zipBuffer = await zip.generateAsync({
    type: "uint8array",
    compression: "STORE",
  });

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="infonte-dias-falhados${slotFiltro ? "-" + slotFiltro : ""}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
