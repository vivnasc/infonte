import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

// Lê todos os result.json em infonte-assets/infonte-campanha-hd/<jobId>/
// e actualiza estado dos posts:
//   - sucesso -> pronto (se ainda estiver em rascunho/rendering)
//   - erro    -> failed
// Mantém os já agendados/publicados intactos.
//
// É idempotente: pode-se correr quantas vezes quiser para apanhar o
// último estado.
export async function POST() {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  const sb = criarClienteAdmin();
  const BUCKET = "infonte-assets";

  const { data: jobs, error: errJobs } = await sb.storage
    .from(BUCKET)
    .list("infonte-campanha-hd", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (errJobs) {
    return NextResponse.json({ erro: errJobs.message }, { status: 500 });
  }

  const log: string[] = [];
  let atualizados = 0;

  // Lê os 50 jobs mais recentes. Quando se disparam 8 workflows numa
  // sessão (4 semanas × 2 slots), 5 não chega. Como deduplicamos
  // (dia, slot) com o set `visto`, jobs antigos não sobrescrevem
  // jobs novos: o primeiro a ser visitado (mais recente) ganha.
  const jobsRecentes = (jobs ?? []).slice(0, 50);

  // Já visitamos este (dia,slot) — não sobrescrever resultado de job
  // mais recente com um mais antigo.
  const visto = new Set<string>();

  for (const job of jobsRecentes) {
    if (!job.name) continue;
    const path = `infonte-campanha-hd/${job.name}/result.json`;
    const { data: file, error: errDl } = await sb.storage.from(BUCKET).download(path);
    if (errDl || !file) {
      log.push(`${job.name}: sem result.json (${errDl?.message ?? "404"})`);
      continue;
    }

    let resultado: { jobId?: string; slot?: string; dias?: Record<string, { urls?: string[]; erro?: string }> };
    try {
      resultado = JSON.parse(await file.text());
    } catch {
      log.push(`${job.name}: result.json inválido`);
      continue;
    }

    const slot = resultado.slot ?? "manha";
    const diasMap = resultado.dias ?? {};

    for (const [diaStr, r] of Object.entries(diasMap)) {
      const dia = parseInt(diaStr, 10);
      if (!Number.isFinite(dia)) continue;
      const chave = `${dia}-${slot}`;
      if (visto.has(chave)) continue;
      visto.add(chave);

      const novoEstado = r.erro ? "failed" : "pronto";

      // Só promove se ainda for rascunho/rendering/failed.
      // Não toca em agendado/publicado para não atropelar.
      const { data: post } = await sb
        .from("campanha_posts")
        .select("estado")
        .eq("dia", dia)
        .eq("slot", slot)
        .maybeSingle();

      if (!post) continue;
      const actual = (post.estado as string) ?? "rascunho";
      if (["agendado", "publicado"].includes(actual)) {
        log.push(`Dia ${dia} ${slot}: já está ${actual}, mantido`);
        continue;
      }

      await sb
        .from("campanha_posts")
        .update({ estado: novoEstado })
        .eq("dia", dia)
        .eq("slot", slot);
      atualizados++;
      log.push(`Dia ${dia} ${slot}: ${actual} → ${novoEstado}`);
    }
  }

  return NextResponse.json({
    ok: true,
    atualizados,
    jobs_analisados: jobsRecentes.length,
    log,
  });
}
