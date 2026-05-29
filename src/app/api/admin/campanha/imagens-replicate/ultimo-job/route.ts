import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Lê o último result.json de bulks Replicate e devolve o errorSlot,
// para a UI mostrar "Retomar a partir do dia X".
export async function GET() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const sb = criarClienteAdmin();
  const BUCKET = "infonte-assets";

  const { data: files, error } = await sb.storage
    .from(BUCKET)
    .list("infonte-campanha/jobs", {
      limit: 10,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error) {
    return NextResponse.json({ ok: false, erro: error.message });
  }

  const ultimo = files?.find((f) => f.name?.endsWith(".json"));
  if (!ultimo) {
    return NextResponse.json({ ok: true, temUltimo: false });
  }

  const { data: file, error: errDl } = await sb.storage
    .from(BUCKET)
    .download(`infonte-campanha/jobs/${ultimo.name}`);
  if (errDl || !file) {
    return NextResponse.json({ ok: false, erro: errDl?.message ?? "404" });
  }

  try {
    const j = JSON.parse(await file.text());
    return NextResponse.json({
      ok: true,
      temUltimo: true,
      jobId: j.jobId,
      slot: j.slot,
      strategy: j.strategy,
      inicio: j.inicio,
      fim: j.fim,
      gerados: j.gerados,
      reusados: j.reusados,
      saltados: j.saltados,
      errorSlot: j.errorSlot,
      criadoEm: j.criadoEm,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      erro: e instanceof Error ? e.message : "JSON inválido",
    });
  }
}
