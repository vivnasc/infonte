import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { criarClienteAdmin } from "@/lib/supabase/admin";

const CAMPOS_PERMITIDOS = [
  "tema",
  "formato",
  "texto_imagem",
  "legenda",
  "pergunta",
  "hashtags",
  "link",
  "imagem_url",
  "redes",
  "data_publicacao",
  "estado",
  "notas",
] as const;

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ dia: string }> }
) {
  const admin = await exigirAdmin();
  if (!admin) {
    return NextResponse.json({ erro: "acesso negado" }, { status: 403 });
  }
  const { dia: diaStr } = await ctx.params;
  const dia = parseInt(diaStr, 10);
  if (!Number.isFinite(dia) || dia < 1 || dia > 30) {
    return NextResponse.json({ erro: "dia inválido" }, { status: 400 });
  }
  const corpo = await request.json();
  const atualizacao: Record<string, unknown> = {};
  for (const k of CAMPOS_PERMITIDOS) {
    if (k in corpo) atualizacao[k] = corpo[k];
  }

  if (Array.isArray(atualizacao.redes)) {
    atualizacao.redes = (atualizacao.redes as unknown[]).filter(
      (r) => typeof r === "string"
    );
  }

  const sb = criarClienteAdmin();
  const { error } = await sb
    .from("campanha_posts")
    .update(atualizacao)
    .eq("dia", dia);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
