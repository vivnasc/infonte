import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Devolve as URLs dos PNGs renderizados em HD para um (dia, slot),
// lendo o último result.json em infonte-campanha-hd/<jobId>/.
//
// Esta é a vista "depois do render": a Vivianne pede o estado actual
// dos PNGs num dia, e este endpoint procura o job mais recente que
// tenha esse dia e devolve as URLs ordenadas por slide.
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

  const { data: jobs, error } = await sb.storage
    .from(BUCKET)
    .list("infonte-campanha-hd", {
      limit: 50,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error) {
    return NextResponse.json({ ok: false, erro: error.message });
  }

  // Percorrer os jobs do mais recente para o mais antigo, encontrar
  // o primeiro que tenha o dia + slot renderizados.
  for (const job of jobs ?? []) {
    if (!job.name) continue;
    const path = `infonte-campanha-hd/${job.name}/result.json`;
    const { data: file } = await sb.storage.from(BUCKET).download(path);
    if (!file) continue;
    try {
      const j = JSON.parse(await file.text());
      if (j.slot !== slot) continue;
      const diaRes = j.dias?.[dia];
      if (!diaRes || !diaRes.urls || diaRes.urls.length === 0) continue;
      return NextResponse.json({
        ok: true,
        temRender: true,
        jobId: j.jobId,
        slot,
        dia,
        urls: diaRes.urls as string[],
        criadoEm: j.completedAt,
      });
    } catch {
      // result.json inválido, ignorar e seguir para o próximo
    }
  }

  return NextResponse.json({ ok: true, temRender: false, dia, slot, urls: [] });
}
