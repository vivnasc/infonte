import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { dataDeAbertura } from "@/lib/etapas/gating";

export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erro: "não autenticada" }, { status: 401 });
  }

  let body: { etapa?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "corpo JSON inválido" }, { status: 400 });
  }

  const etapa = typeof body.etapa === "number" ? body.etapa : NaN;
  if (!Number.isFinite(etapa) || etapa < 1 || etapa > 7) {
    return NextResponse.json({ erro: "etapa inválida" }, { status: 400 });
  }

  const { data: utilizadora } = await supabase
    .from("utilizadoras")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!utilizadora) {
    return NextResponse.json({ erro: "utilizadora não encontrada" }, { status: 404 });
  }

  const admin = criarClienteAdmin();
  const agora = new Date().toISOString();

  // Marcar etapa como concluida (upsert para lidar com o caso de a linha ja existir)
  const { data: existente } = await admin
    .from("progresso")
    .select("id, concluida_em")
    .eq("utilizadora_id", utilizadora.id)
    .eq("etapa", etapa)
    .maybeSingle();

  if (existente?.concluida_em) {
    // Ja concluida, devolver info da proxima etapa
    const seguinte = etapa < 7 ? etapa + 1 : null;
    const abreSeguinte = seguinte ? dataDeAbertura(new Date(existente.concluida_em)) : null;
    return NextResponse.json({
      ok: true,
      ja_concluida: true,
      proxima_etapa: seguinte,
      abre_em: abreSeguinte?.toISOString() ?? null,
    });
  }

  if (existente) {
    await admin
      .from("progresso")
      .update({ concluida_em: agora })
      .eq("id", existente.id);
  } else {
    await admin.from("progresso").insert({
      utilizadora_id: utilizadora.id,
      etapa,
      desbloqueada_em: agora,
      concluida_em: agora,
    });
  }

  // Se a utilizadora comprou e esta nao e a ultima etapa,
  // garantir que a proxima etapa tem linha de progresso com desbloqueada_em
  const seguinte = etapa < 7 ? etapa + 1 : null;
  let abreSeguinte: Date | null = null;

  if (seguinte) {
    abreSeguinte = dataDeAbertura(new Date(agora));

    const { data: progSeguinte } = await admin
      .from("progresso")
      .select("id, desbloqueada_em")
      .eq("utilizadora_id", utilizadora.id)
      .eq("etapa", seguinte)
      .maybeSingle();

    if (!progSeguinte) {
      // Criar linha para a proxima etapa (desbloqueada_em sera preenchida pelo cron)
      await admin.from("progresso").insert({
        utilizadora_id: utilizadora.id,
        etapa: seguinte,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    ja_concluida: false,
    proxima_etapa: seguinte,
    abre_em: abreSeguinte?.toISOString() ?? null,
  });
}
