import { NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { enviarEmailEtapaAberta } from "@/lib/emails";
import { HORAS_GATING } from "@/lib/etapas/gating";

// Corre uma vez por dia (vercel cron). Para cada utilizadora com compra
// concluída, verifica se a etapa seguinte já passou as 72h desde que a
// anterior foi desbloqueada. Se sim, cria/atualiza a linha de progresso
// da seguinte com desbloqueada_em = agora e dispara o email de abertura.

export async function GET(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const admin = criarClienteAdmin();
  const agora = new Date();

  // utilizadoras que compraram
  const { data: compradoras, error } = await admin
    .from("utilizadoras")
    .select("id, email, nome")
    .eq("comprou", true);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  const origem =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://infonte.vivannedossantos.com";
  const limiteMs = HORAS_GATING * 60 * 60 * 1000;

  const resumo: {
    utilizadora_id: string;
    etapas_abertas: number[];
    emails_enviados: number[];
  }[] = [];

  for (const u of compradoras ?? []) {
    const { data: progresso } = await admin
      .from("progresso")
      .select("etapa, desbloqueada_em, email_aberta_enviado_em")
      .eq("utilizadora_id", u.id)
      .order("etapa", { ascending: true });

    const mapa = new Map(progresso?.map((p) => [p.etapa, p]) ?? []);
    const abertas: number[] = [];
    const enviadas: number[] = [];

    for (let n = 2; n <= 7; n++) {
      const anterior = mapa.get(n - 1);
      if (!anterior?.desbloqueada_em) continue;
      const passou =
        agora.getTime() - new Date(anterior.desbloqueada_em).getTime() >= limiteMs;
      if (!passou) continue;

      const atual = mapa.get(n);
      if (!atual?.desbloqueada_em) {
        // Abre a etapa
        const { error: e1 } = atual
          ? await admin
              .from("progresso")
              .update({ desbloqueada_em: agora.toISOString() })
              .eq("utilizadora_id", u.id)
              .eq("etapa", n)
          : await admin.from("progresso").insert({
              utilizadora_id: u.id,
              etapa: n,
              desbloqueada_em: agora.toISOString(),
            });
        if (e1) {
          console.error("Erro a abrir progresso", e1);
          continue;
        }
        abertas.push(n);
      }

      // Envia email, se ainda não foi enviado
      const refreshed = atual ?? (await mapa.set(n, { etapa: n, desbloqueada_em: agora.toISOString(), email_aberta_enviado_em: null }).get(n));
      if (!refreshed?.email_aberta_enviado_em && u.email) {
        const r = await enviarEmailEtapaAberta({
          email: u.email,
          nome: u.nome,
          etapa: n,
          url: `${origem}/etapa/${n}`,
        });
        if (r.ok) {
          await admin
            .from("progresso")
            .update({ email_aberta_enviado_em: agora.toISOString() })
            .eq("utilizadora_id", u.id)
            .eq("etapa", n);
          enviadas.push(n);
        }
      }
    }

    if (abertas.length > 0 || enviadas.length > 0) {
      resumo.push({
        utilizadora_id: u.id,
        etapas_abertas: abertas,
        emails_enviados: enviadas,
      });
    }
  }

  return NextResponse.json({ ok: true, agora: agora.toISOString(), resumo });
}
