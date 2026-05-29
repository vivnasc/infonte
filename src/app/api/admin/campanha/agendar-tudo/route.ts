import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

// POST { dataInicial: "YYYY-MM-DD", horaManha?: "HH:MM", horaTarde?: "HH:MM" }
// Distribui as 60 datas pelos 30 dias consecutivos a partir da data
// dada. Manhã às 10:00 (configurável), tarde às 13:00 (configurável).
// Marca todos como "agendado". Idempotente: pode-se re-correr com
// data diferente.
export async function POST(request: Request) {
  const admin = await exigirAdmin();
  if (!admin) return NextResponse.json({ erro: "acesso negado" }, { status: 403 });

  let body: { dataInicial?: string; horaManha?: string; horaTarde?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "body inválido" }, { status: 400 });
  }

  const dataInicial = body.dataInicial;
  if (!dataInicial || !/^\d{4}-\d{2}-\d{2}$/.test(dataInicial)) {
    return NextResponse.json({ erro: "dataInicial em formato YYYY-MM-DD" }, { status: 400 });
  }
  const horaManha = body.horaManha ?? "10:00";
  const horaTarde = body.horaTarde ?? "13:00";

  if (!/^\d{2}:\d{2}$/.test(horaManha) || !/^\d{2}:\d{2}$/.test(horaTarde)) {
    return NextResponse.json({ erro: "horas em formato HH:MM" }, { status: 400 });
  }

  const sb = criarClienteAdmin();
  const log: string[] = [];
  let atualizados = 0;

  // Maputo/Lisboa: +01:00 (sem horário de verão em CAT/Maputo).
  // Para ser correcto em ambos, usa offset relativo a UTC. Vivianne
  // está em Maputo (+02:00) ou Lisboa (+01:00 inverno, +02:00 verão).
  // Default +02:00 que cobre Maputo o ano inteiro. Pode ser override
  // via env CAMPAIGN_TZ_OFFSET (ex: "+02:00").
  const offset = process.env.CAMPAIGN_TZ_OFFSET ?? "+02:00";

  for (let dia = 1; dia <= 30; dia++) {
    // Data deste dia = dataInicial + (dia-1) dias
    const d = new Date(`${dataInicial}T00:00:00${offset}`);
    d.setUTCDate(d.getUTCDate() + (dia - 1));
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const dataStr = `${yyyy}-${mm}-${dd}`;

    const isoManha = `${dataStr}T${horaManha}:00${offset}`;
    const isoTarde = `${dataStr}T${horaTarde}:00${offset}`;

    for (const [slot, iso] of [["manha", isoManha], ["tarde", isoTarde]] as const) {
      const { error } = await sb
        .from("campanha_posts")
        .update({ data_publicacao: iso, estado: "agendado" })
        .eq("dia", dia)
        .eq("slot", slot);
      if (error) {
        log.push(`Dia ${dia} ${slot}: erro ${error.message}`);
      } else {
        atualizados++;
        log.push(`Dia ${dia} ${slot}: ${iso}`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    atualizados,
    dataInicial,
    horaManha,
    horaTarde,
    offset,
    log: log.slice(0, 10), // primeiros 10 para a UI não rebentar
  });
}
