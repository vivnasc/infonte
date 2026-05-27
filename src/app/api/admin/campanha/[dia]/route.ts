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
  "imagens",
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

  let corpo: Record<string, unknown>;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "corpo JSON inválido" }, { status: 400 });
  }

  const atualizacao: Record<string, unknown> = {};
  for (const k of CAMPOS_PERMITIDOS) {
    if (k in corpo) atualizacao[k] = corpo[k];
  }

  if (Object.keys(atualizacao).length === 0) {
    return NextResponse.json({ erro: "nenhum campo válido enviado" }, { status: 400 });
  }

  if (Array.isArray(atualizacao.redes)) {
    atualizacao.redes = (atualizacao.redes as unknown[]).filter(
      (r) => typeof r === "string"
    );
  }

  const url = new URL(request.url);
  const slot = url.searchParams.get("slot") ?? "manha";

  const sb = criarClienteAdmin();
  const { error } = await sb
    .from("campanha_posts")
    .update(atualizacao)
    .eq("dia", dia)
    .eq("slot", slot);

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
