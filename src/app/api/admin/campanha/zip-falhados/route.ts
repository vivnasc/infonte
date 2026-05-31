import { NextResponse } from "next/server";
import JSZip from "jszip";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

// Bundle de todos os PNGs HD dos dias falhados num ZIP único,
// organizado em pastas por dia/slot.
//
// GET /api/admin/campanha/zip-falhados
//
// Lista hardcoded — mesma que BotaoRenderFalhados.

const DIAS_MANHA = [3, 8, 11, 13, 14, 19, 20, 29, 30];
const DIAS_TARDE = [5, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 29, 30];

async function carregarRendersPara(
  sb: ReturnType<typeof criarClienteAdmin>,
  alvos: Set<string>
): Promise<Map<string, string[]>> {
  const BUCKET = "infonte-assets";
  const { data: jobs } = await sb.storage
    .from(BUCKET)
    .list("infonte-campanha-hd", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

  const renders = new Map<string, string[]>();
  for (const job of jobs ?? []) {
    if (!job.name) continue;
    const path = `infonte-campanha-hd/${job.name}/result.json`;
    const { data: file } = await sb.storage.from(BUCKET).download(path);
    if (!file) continue;
    try {
      const j = JSON.parse(await file.text());
      const slot = (j.slot as string) ?? "manha";
      const dias = (j.dias ?? {}) as Record<string, { urls?: string[] }>;
      for (const [diaStr, r] of Object.entries(dias)) {
        const dia = parseInt(diaStr, 10);
        const key = `${dia}-${slot}`;
        if (!alvos.has(key)) continue;
        if (renders.has(key)) continue;
        const urls = r?.urls;
        if (Array.isArray(urls) && urls.length > 0) renders.set(key, urls);
      }
    } catch {}
  }
  return renders;
}

export async function GET() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const alvos = new Set<string>([
    ...DIAS_MANHA.map((d) => `${d}-manha`),
    ...DIAS_TARDE.map((d) => `${d}-tarde`),
  ]);

  const sb = criarClienteAdmin();
  const renders = await carregarRendersPara(sb, alvos);

  if (renders.size === 0) {
    return NextResponse.json(
      { erro: "sem renders para os dias falhados. Corre primeiro o render." },
      { status: 404 }
    );
  }

  const zip = new JSZip();
  const log: string[] = [];

  // Descarrega todos os PNGs em paralelo (lotes de 6).
  const tarefas: { chave: string; pngIdx: number; url: string }[] = [];
  for (const [chave, urls] of renders.entries()) {
    urls.forEach((url, idx) => {
      tarefas.push({ chave, pngIdx: idx, url });
    });
  }

  const CONC = 6;
  const buffers: { caminho: string; buf: Buffer }[] = [];
  for (let i = 0; i < tarefas.length; i += CONC) {
    const lote = tarefas.slice(i, i + CONC);
    const out = await Promise.all(
      lote.map(async ({ chave, pngIdx, url }) => {
        const r = await fetch(url);
        if (!r.ok) {
          log.push(`${chave} slide ${pngIdx + 1}: HTTP ${r.status}`);
          return null;
        }
        const [diaStr, slot] = chave.split("-");
        const dia = String(diaStr).padStart(2, "0");
        const slideN = String(pngIdx + 1).padStart(2, "0");
        return {
          caminho: `dia-${dia}-${slot}/slide-${slideN}.png`,
          buf: Buffer.from(await r.arrayBuffer()),
        };
      })
    );
    for (const item of out) {
      if (item) buffers.push(item);
    }
  }

  for (const { caminho, buf } of buffers) {
    zip.file(caminho, buf);
  }
  // Adiciona um README com a lista de pastas.
  const readme =
    `infonte campanha — dias falhados\n\n` +
    `Cada pasta = 1 post.\n` +
    `Para o Metricool, cria o post na data certa e arrasta os 10 PNGs da pasta correspondente.\n\n` +
    `Dias incluídos:\n` +
    [...renders.keys()].sort().join("\n");
  zip.file("LEIA-ME.txt", readme);

  const zipBuffer = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="infonte-dias-falhados.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
