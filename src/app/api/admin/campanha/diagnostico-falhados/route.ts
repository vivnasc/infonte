import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Diagnóstico dos 22 (dia, slot) falhados no Metricool.
// Para cada um:
//   - encontra a URL do slide 1 (Picture Url 1 no CSV)
//   - faz HEAD/GET para verificar status HTTP
//   - lê dimensões reais do PNG (bytes 16-23)
//   - reporta motivo provável da rejeição do Metricool

const DIAS_MANHA = [3, 8, 11, 13, 14, 19, 20, 29, 30];
const DIAS_TARDE = [5, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 29, 30];

async function dimensoesPNG(url: string): Promise<{
  status: number;
  width?: number;
  height?: number;
  ratio?: number;
  bytes?: number;
  erro?: string;
}> {
  try {
    const r = await fetch(url);
    if (!r.ok) return { status: r.status };
    const buf = Buffer.from(await r.arrayBuffer());
    // PNG signature: 8 bytes. IHDR chunk começa em byte 8, width em 16, height em 20.
    if (buf.length < 24) return { status: r.status, bytes: buf.length, erro: "ficheiro muito pequeno" };
    // Verifica signature PNG
    if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) {
      return { status: r.status, bytes: buf.length, erro: "não é PNG válido" };
    }
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    return {
      status: r.status,
      width,
      height,
      ratio: Math.round((width / height) * 1000) / 1000,
      bytes: buf.length,
    };
  } catch (e) {
    return { status: 0, erro: e instanceof Error ? e.message : "erro fetch" };
  }
}

export async function GET() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const sb = criarClienteAdmin();
  const BUCKET = "infonte-assets";

  // Carrega URLs do slide 1 para cada falhado.
  const alvos = new Set<string>([
    ...DIAS_MANHA.map((d) => `${d}-manha`),
    ...DIAS_TARDE.map((d) => `${d}-tarde`),
  ]);

  const { data: jobs } = await sb.storage
    .from(BUCKET)
    .list("infonte-campanha-hd", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

  const url1: Map<string, { url: string; jobId: string; totalUrls: number }> = new Map();
  const totalSlides: Map<string, number> = new Map();

  for (const job of jobs ?? []) {
    if (!job.name) continue;
    if (url1.size >= alvos.size) break;
    const path = `infonte-campanha-hd/${job.name}/result.json`;
    const { data: file } = await sb.storage.from(BUCKET).download(path);
    if (!file) continue;
    try {
      const j = JSON.parse(await file.text()) as {
        slot?: string;
        dias?: Record<string, { urls?: string[]; erro?: string }>;
      };
      const slot = j.slot ?? "manha";
      const dias = j.dias ?? {};
      for (const [diaStr, r] of Object.entries(dias)) {
        const dia = parseInt(diaStr, 10);
        const key = `${dia}-${slot}`;
        if (!alvos.has(key)) continue;
        if (url1.has(key)) continue;
        const urls = r?.urls;
        if (Array.isArray(urls) && urls.length > 0) {
          url1.set(key, { url: urls[0], jobId: job.name, totalUrls: urls.length });
          totalSlides.set(key, urls.length);
        } else if (r?.erro) {
          url1.set(key, { url: "", jobId: job.name, totalUrls: 0 });
        }
      }
    } catch {}
  }

  // Verifica cada URL
  const resultados: Array<{
    dia: number;
    slot: string;
    encontrado: boolean;
    jobId?: string;
    totalSlides?: number;
    url?: string;
    status?: number;
    width?: number;
    height?: number;
    ratio?: number;
    bytes?: number;
    diagnostico: string;
  }> = [];

  for (const chave of alvos) {
    const [diaStr, slot] = chave.split("-");
    const dia = parseInt(diaStr, 10);
    const info = url1.get(chave);
    if (!info || !info.url) {
      resultados.push({
        dia,
        slot,
        encontrado: false,
        diagnostico: "SEM RENDER. result.json não tem URLs para este (dia,slot). Re-render necessário.",
      });
      continue;
    }
    const dim = await dimensoesPNG(info.url);
    let diagnostico = "OK";
    if (dim.status !== 200) {
      diagnostico = `HTTP ${dim.status}. URL não acessível (404/500). Re-render.`;
    } else if (!dim.width || !dim.height) {
      diagnostico = `Ficheiro inválido: ${dim.erro ?? "sem dimensões"}`;
    } else {
      const r = dim.ratio ?? 0;
      // Metricool aceita 3:4 (0.75) a 1.91:1 (1.91)
      if (r < 0.75 || r > 1.91) {
        diagnostico = `RATIO MAU: ${dim.width}×${dim.height} = ${r}. Metricool aceita 0.75 a 1.91. Re-render.`;
      } else if (info.totalUrls < 2) {
        diagnostico = `SÓ ${info.totalUrls} slide(s). Esperado carrossel.`;
      } else {
        diagnostico = `OK ${dim.width}×${dim.height}, ${info.totalUrls} slides`;
      }
    }
    resultados.push({
      dia,
      slot,
      encontrado: true,
      jobId: info.jobId,
      totalSlides: info.totalUrls,
      url: info.url,
      ...dim,
      diagnostico,
    });
  }

  resultados.sort((a, b) => a.dia - b.dia || a.slot.localeCompare(b.slot));

  const resumo = {
    total: resultados.length,
    semRender: resultados.filter((r) => !r.encontrado).length,
    ratioMau: resultados.filter((r) => r.diagnostico.includes("RATIO MAU")).length,
    poucosSlides: resultados.filter((r) => r.diagnostico.includes("SÓ")).length,
    http: resultados.filter((r) => r.diagnostico.includes("HTTP")).length,
    ok: resultados.filter((r) => r.diagnostico.startsWith("OK")).length,
  };

  return NextResponse.json({ ok: true, resumo, resultados }, {
    headers: { "Cache-Control": "no-store" },
  });
}
